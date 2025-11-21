"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api.js";
import { ConvexError } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Major Arcana cards
const MAJOR_ARCANA = [
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World"
];

// Turkish translations and images of Major Arcana
const TAROT_TURKISH: Record<string, string> = {
  "The Fool": "Deli",
  "The Magician": "Büyücü",
  "The High Priestess": "Baş Rahibe",
  "The Empress": "İmparatoriçe",
  "The Emperor": "İmparator",
  "The Hierophant": "Aziz",
  "The Lovers": "Aşıklar",
  "The Chariot": "Savaş Arabası",
  "Strength": "Güç",
  "The Hermit": "Ermiş",
  "Wheel of Fortune": "Kader Çarkı",
  "Justice": "Adalet",
  "The Hanged Man": "Asılan Adam",
  "Death": "Ölüm",
  "Temperance": "Ölçülülük",
  "The Devil": "Şeytan",
  "The Tower": "Kule",
  "The Star": "Yıldız",
  "The Moon": "Ay",
  "The Sun": "Güneş",
  "Judgement": "Mahşer",
  "The World": "Dünya"
};

// Tarot card images
const TAROT_IMAGES: Record<string, string> = {
  "The Fool": "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400",
  "The Magician": "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400",
  "The High Priestess": "https://images.unsplash.com/photo-1532153955177-f59af40d6472?w=400",
  "The Empress": "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=400",
  "The Emperor": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400",
  "The Hierophant": "https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=400",
  "The Lovers": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400",
  "The Chariot": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
  "Strength": "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=400",
  "The Hermit": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
  "Wheel of Fortune": "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400",
  "Justice": "https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400",
  "The Hanged Man": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400",
  "Death": "https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400",
  "Temperance": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
  "The Devil": "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400",
  "The Tower": "https://images.unsplash.com/photo-1520962922320-2038952a1976?w=400",
  "The Star": "https://images.unsplash.com/photo-1502085671122-2d218cd434e6?w=400",
  "The Moon": "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400",
  "The Sun": "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=400",
  "Judgement": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
  "The World": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400"
};

const categoryPrompts: Record<string, string> = {
  love: "Aşk hayatı, ilişkiler, romantizm ve duygusal bağlar hakkında",
  general: "Genel yaşam, gelecek, fırsatlar ve kader hakkında",
  career: "İş hayatı, kariyer, para kazanma ve profesyonel gelişim hakkında",
  health: "Sağlık, enerji, fiziksel ve mental iyi oluş hakkında",
  money: "Para, finans, maddi durum ve bolluk hakkında",
};

function drawTarotCards(count: number): string[] {
  const shuffled = [...MAJOR_ARCANA].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export const interpretTarot = action({
  args: {
    fortuneId: v.id("fortunes"),
    category: v.union(
      v.literal("love"),
      v.literal("general"),
      v.literal("career"),
      v.literal("health"),
      v.literal("money")
    ),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new ConvexError({
        message: "Groq API key not configured. Please add GROQ_API_KEY to your secrets.",
        code: "NOT_IMPLEMENTED",
      });
    }

    try {
      // Get user info for personalization
      const user = await ctx.runQuery(api.users.getCurrentUser, {});
      
      // Build user context
      let userContext = "";
      if (user) {
        const displayName = user.name || "Kullanıcı";
        const age = calculateAge(user.birthDate);
        const gender = user.gender === "female" ? "Kadın" : user.gender === "male" ? "Erkek" : null;
        
        userContext = `\n\nKullanıcı Bilgileri:`;
        userContext += `\n- İsim: ${displayName}`;
        if (age) userContext += `\n- Yaş: ${age}`;
        if (gender) userContext += `\n- Cinsiyet: ${gender}`;
        if (user.location) userContext += `\n- Konum: ${user.location}`;
        
        // Get recent journal entries for additional context
        const recentJournals = await ctx.runQuery(api.journal.getEntries, {
          paginationOpts: { numItems: 1, cursor: null }
        });
        if (recentJournals && recentJournals.page.length > 0) {
          const lastEntry = recentJournals.page[0];
          const contentPreview = lastEntry.content.slice(0, 40) + (lastEntry.content.length > 40 ? "..." : "");
          userContext += `\n- Son Günlük Giriş: "${contentPreview}"`;
        }
      }

      // Draw 3 cards for a classic past-present-future spread
      const cards = drawTarotCards(3);
      const categoryContext = categoryPrompts[args.category];
      
      const cardsText = cards.map((card, i) => {
        const position = i === 0 ? "Geçmiş" : i === 1 ? "Şimdi" : "Gelecek";
        return `${position}: ${TAROT_TURKISH[card]} (${card})`;
      }).join("\n");

      const prompt = `ÇOK ÖNEMLİ: SADECE TÜRKÇE KULLAN! Arapça, İngilizce veya başka hiçbir dil kullanma. Tüm yorumun %100 Türkçe olmalı.

Sen bir tarot yorumcususun. Kullanıcı için çekilen 3 kartlık tarot yayılımını ${categoryContext} KİŞİSELLEŞTİRİLMİŞ bir şekilde yorumla.${userContext}

Yayılım: Geçmiş - Şimdi - Gelecek

Yorumunu şu şekilde yapılandır:

1. **Çekilen Kartlar** (1 paragraf)
   - Üç kartın genel enerjisini ve birlikte ne anlattıklarını özetle
   - Kullanıcının ismiyle hitap et

2. **Geçmiş - İlk Kart** (1-2 paragraf)
   - Bu kartın geçmişteki etkisini ve ${categoryContext} nasıl şekillendirdiğini açıkla
   - Kullanıcının yaşı ve durumunu göz önünde bulundur

3. **Şimdi - İkinci Kart** (1-2 paragraf)
   - Şu anki durumunu ve mevcut enerjilerini yorumla
   - ${categoryContext} şu anda nerede durduğunu KİŞİYE ÖZEL belirt

4. **Gelecek - Üçüncü Kart** (1-2 paragraf)
   - Gelecekteki olası yönelimi ve sonuçları açıkla
   - ${categoryContext} nereye doğru gittiğini göster
   - Kullanıcının hayat evresine uygun perspektif sun

5. **Genel Değerlendirme ve Öneriler** (1-2 paragraf)
   - Tüm kartları bir arada değerlendir
   - Kişiye ÖZEL ve pratik önerilerde bulun

ÖNEMLI: Yorumunu kullanıcının yaşına, cinsiyetine ve durumuna göre KİŞİSELLEŞTİR. Genel klişelerden kaçın. İsmiyle hitap et. Yorumunu Türkçe, samimi, sıcak ve mistik bir dille yaz. Modern ve anlaşılır ol. Her kartın sembolik anlamını derinlemesine açıkla.

${categoryContext} hakkında tarot yorumla. Çekilen kartlar:

${cardsText}

TEKRAR HATIRLATMA: Yorumunun tamamını SADECE TÜRKÇE yaz. Hiçbir şekilde Arapça, İngilizce veya başka dil kullanma!`;

      // Use Groq API - Fast and Free!
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 2000
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Groq API Error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      const interpretation = data.choices?.[0]?.message?.content || "Tarot yorumlanamadı.";

      // Prepare card data with images
      const cardsWithImages = cards.map(card => ({
        name: card,
        turkish: TAROT_TURKISH[card],
        image: TAROT_IMAGES[card]
      }));

      // Update the fortune with the interpretation and cards
      await ctx.runMutation(api.fortunes.updateFortune, {
        fortuneId: args.fortuneId,
        interpretation,
        isInterpreted: true,
        tarotCards: cards,
      });

      return { interpretation, cards: cardsWithImages };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Tarot interpretation error:", errorMessage);
      throw new ConvexError({
        message: `Failed to interpret tarot: ${errorMessage}`,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});
