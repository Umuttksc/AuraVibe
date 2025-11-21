"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api.js";
import { ConvexError } from "convex/values";

const categoryPrompts: Record<string, string> = {
  love: "Aşk hayatı, ilişkiler, romantizm ve duygusal bağlar hakkında",
  general: "Genel yaşam, gelecek, fırsatlar ve kader hakkında",
  career: "İş hayatı, kariyer, para kazanma ve profesyonel gelişim hakkında",
  health: "Sağlık, enerji, fiziksel ve mental iyi oluş hakkında",
  money: "Para, finans, maddi durum ve bolluk hakkında",
};

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

export const interpretFortune = action({
  args: {
    fortuneId: v.id("fortunes"),
    imageUrl: v.string(),
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

      const categoryContext = categoryPrompts[args.category];
      
      const prompt = `ÇOK ÖNEMLİ: SADECE TÜRKÇE KULLAN! Arapça, İngilizce veya başka hiçbir dil kullanma. Tüm yorumun %100 Türkçe olmalı.

Sen bir Türk kahve falı uzmanısın. Kullanıcı kahve fincanı fotoğrafını yükledi. ${categoryContext} detaylı ve KİŞİSELLEŞTİRİLMİŞ bir fal yorumu yap.${userContext}

Yorumunu şu şekilde yapılandır:

1. **Genel Görünüm ve İlk İzlenim** (1-2 cümle)
   - Fincandaki genel formasyon ve enerji hakkında
   - Kullanıcının ismiyle hitap et

2. **Sembol ve Şekiller** (2-3 paragraf)
   - Fincanda gördüğün sembolleri ve anlamlarını detaylı açıkla
   - Her sembolün ${categoryContext} ne anlam ifade ettiğini belirt
   - Kullanıcının yaşı, cinsiyeti ve durumunu göz önünde bulundur

3. **Yorum ve Mesajlar** (2-3 paragraf)
   - ${categoryContext.charAt(0).toUpperCase() + categoryContext.slice(1)} ilgili KİŞİYE ÖZEL yorumlarını sun
   - Yakın gelecek ve uzak gelecek hakkında tahminler
   - Kullanıcının hayat evresine uygun tavsiyelerde bulun

4. **Öneriler ve Uyarılar** (1-2 paragraf)
   - Kişiye özel tavsiyelerde bulun
   - Dikkat etmesi gereken noktaları belirt

ÖNEMLI: Yorumunu kullanıcının yaşına, cinsiyetine ve durumuna göre kişiselleştir. Genel klişelerden kaçın. Yorumunu Türkçe, samimi, sıcak ve gizemli bir dille yaz. İsmiyle hitap et. Geleneksel fal bakma üslubunu koru ama modern ve anlaşılır ol. Yorumun 4-6 paragraf olsun.

TEKRAR HATIRLATMA: Yorumunun tamamını SADECE TÜRKÇE yaz. Hiçbir şekilde Arapça, İngilizce veya başka dil kullanma!`;

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
            max_tokens: 2500
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const interpretation = data.choices?.[0]?.message?.content || "Kahve falı yorumlanamadı.";

      // Update the fortune with the interpretation
      await ctx.runMutation(api.fortunes.updateFortune, {
        fortuneId: args.fortuneId,
        interpretation,
        isInterpreted: true,
      });

      return interpretation;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Fortune interpretation error:", errorMessage);
      throw error instanceof ConvexError ? error : new ConvexError({
        message: `Kahve falı yorumlanamadı: ${errorMessage}`,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});

// Palm reading interpretation using Groq
export const interpretPalmReading = action({
  args: {
    fortuneId: v.id("fortunes"),
    imageUrl: v.string(),
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
        message: "API key not configured",
        code: "NOT_IMPLEMENTED",
      });
    }

    try {
      // Get user info for personalization
      const user = await ctx.runQuery(api.users.getCurrentUser, {});
      let userContext = "";
      if (user) {
        const displayName = user.name || "Kullanıcı";
        const age = calculateAge(user.birthDate);
        const gender = user.gender === "female" ? "Kadın" : user.gender === "male" ? "Erkek" : null;
        
        userContext = `\n\nKullanıcı Bilgileri:`;
        userContext += `\n- İsim: ${displayName}`;
        if (age) userContext += `\n- Yaş: ${age}`;
        if (gender) userContext += `\n- Cinsiyet: ${gender}`;
      }

      const categoryContext = categoryPrompts[args.category];

      const prompt = `ÇOK ÖNEMLİ: SADECE TÜRKÇE KULLAN! 

Sen bir el falı (palmistry) uzmanısın. Kullanıcı el fotoğrafını yükledi. ${categoryContext} detaylı ve KİŞİSELLEŞTİRİLMİŞ bir el falı yorumu yap.${userContext}

Yorumunu şu şekilde yapılandır:

1. **Genel El Yapısı** (1-2 cümle)
   - Elin genel enerjisi ve karakteristik özellikleri hakkında
   - Kullanıcının ismiyle hitap et

2. **Ana Çizgiler Analizi** (2-3 paragraf)
   - Hayat çizgisi, kalp çizgisi, baş çizgisi, kader çizgisini analiz et
   - Her çizginin ${categoryContext} ne anlam ifade ettiğini belirt
   - Kullanıcının yaşı, cinsiyeti ve durumuna göre kişisel yorumla

3. **Yorum ve Mesajlar** (2-3 paragraf)
   - ${categoryContext} ilgili KİŞİYE ÖZEL yorumlarını sun
   - Yakın ve uzak gelecek hakkında tahminler
   - Kullanıcının hayat evresine uygun tavsiyelerde bulun

4. **Öneriler** (1-2 paragraf)
   - Kişiye özel tavsiyelerde bulun
   - Fırsatlar ve dikkat edilmesi gerekenler

ÖNEMLI: Yorumunu Türkçe, samimi, sıcak ve gizemli bir dille yaz. Geleneksel el falı üslubunu koru ama modern ve anlaşılır ol. 4-6 paragraf olsun.

TEKRAR: Yorumunun tamamını SADECE TÜRKÇE yaz!`;

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
            max_tokens: 2500
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const interpretation = data.choices?.[0]?.message?.content || "El falı yorumlanamadı.";

      // Update fortune
      await ctx.runMutation(api.fortunes.updateFortune, {
        fortuneId: args.fortuneId,
        interpretation,
        isInterpreted: true,
      });

      return interpretation;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Palm reading error:", errorMessage);
      throw error instanceof ConvexError ? error : new ConvexError({
        message: `El falı yorumlanamadı: ${errorMessage}`,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});

// Birth chart interpretation
export const interpretBirthChart = action({
  args: {
    fortuneId: v.id("fortunes"),
    birthDate: v.string(),
    birthTime: v.string(),
    birthPlace: v.string(),
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
        message: "API key not configured",
        code: "NOT_IMPLEMENTED",
      });
    }

    try {
      const user = await ctx.runQuery(api.users.getCurrentUser, {});
      let userContext = "";
      if (user) {
        const displayName = user.name || "Kullanıcı";
        const age = calculateAge(user.birthDate);
        const gender = user.gender === "female" ? "Kadın" : user.gender === "male" ? "Erkek" : null;
        
        userContext = `\n\nKullanıcı Bilgileri:`;
        userContext += `\n- İsim: ${displayName}`;
        if (age) userContext += `\n- Yaş: ${age}`;
        if (gender) userContext += `\n- Cinsiyet: ${gender}`;
      }

      const categoryContext = categoryPrompts[args.category];

      const prompt = `ÇOK ÖNEMLİ: SADECE TÜRKÇE KULLAN!

Sen bir astroloji ve doğum haritası uzmanısın. Aşağıdaki doğum bilgilerine göre ${categoryContext} detaylı ve KİŞİSELLEŞTİRİLMİŞ bir doğum haritası yorumu yap.

Doğum Bilgileri:
- Doğum Tarihi: ${args.birthDate}
- Doğum Saati: ${args.birthTime}
- Doğum Yeri: ${args.birthPlace}${userContext}

Yorumunu şu şekilde yapılandır:

1. **Güneş, Ay ve Yükselen Burcu** (2 paragraf)
   - Bu bilgilere dayanarak kişinin temel karakterini analiz et
   - ${categoryContext} ile ilgili özellikleri vurgula

2. **Gezegen Konumları ve Etkileri** (2-3 paragraf)
   - Doğum anındaki gezegenlerin ${categoryContext} etkisini yorumla
   - Kişiye özel güçlü ve zayıf yönleri belirt

3. **Gelecek Tahminleri** (2 paragraf)
   - ${categoryContext} yakın ve uzak gelecek hakkında tahminler
   - Önemli dönemler ve fırsatlar

4. **Öneriler ve Uyarılar** (1-2 paragraf)
   - Kişiye özel tavsiyelerde bulun
   - Dikkat edilmesi gereken noktalar

ÖNEMLI: Yorumunu Türkçe, profesyonel ama anlaşılır bir dille yaz. Astrolojik terimleri açıkla. 5-7 paragraf olsun.`;

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
            max_tokens: 2500
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const interpretation = data.choices?.[0]?.message?.content || "Doğum haritası yorumlanamadı.";

      await ctx.runMutation(api.fortunes.updateFortune, {
        fortuneId: args.fortuneId,
        interpretation,
        isInterpreted: true,
      });

      return interpretation;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Birth chart error:", errorMessage);
      throw new ConvexError({
        message: `Doğum haritası yorumlanamadı: ${errorMessage}`,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});

// Aura reading interpretation using Groq
export const interpretAuraReading = action({
  args: {
    fortuneId: v.id("fortunes"),
    imageUrl: v.string(),
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
        message: "API key not configured",
        code: "NOT_IMPLEMENTED",
      });
    }

    try {
      // Get user info for personalization
      const user = await ctx.runQuery(api.users.getCurrentUser, {});
      let userContext = "";
      if (user) {
        const displayName = user.name || "Kullanıcı";
        const age = calculateAge(user.birthDate);
        const gender = user.gender === "female" ? "Kadın" : user.gender === "male" ? "Erkek" : null;
        
        userContext = `\n\nKullanıcı Bilgileri:`;
        userContext += `\n- İsim: ${displayName}`;
        if (age) userContext += `\n- Yaş: ${age}`;
        if (gender) userContext += `\n- Cinsiyet: ${gender}`;
      }

      const categoryContext = categoryPrompts[args.category];

      const prompt = `ÇOK ÖNEMLİ: SADECE TÜRKÇE KULLAN!

Sen bir aura okuma ve enerji analizi uzmanısın. Kullanıcı fotoğrafını yükledi. ${categoryContext} detaylı ve KİŞİSELLEŞTİRİLMİŞ bir aura okuma yorumu yap.${userContext}

Yorumunu şu şekilde yapılandır:

1. **Aura Renkleri ve Anlamları** (2 paragraf)
   - Kişinin enerji alanındaki baskın renkleri ve anlamlarını belirt
   - ${categoryContext} nasıl etkilediğini açıkla

2. **Enerji Durumu Analizi** (2 paragraf)
   - Kişinin mevcut enerji seviyesi ve dengesini yorumla
   - Blokajlar ve güçlü yönleri belirt

3. **Gelecek Enerjileri** (2-3 paragraf)
   - ${categoryContext} yaklaşan enerji değişimlerini ve fırsatları analiz et
   - Kişinin enerji alanında bekleyen potansiyelleri açıkla

4. **Enerji Önerileri** (1-2 paragraf)
   - Enerji dengesini korumak için tavsiyelerde bulun
   - Aura temizleme ve güçlendirme yöntemleri

ÖNEMLI: Yorumunu Türkçe, gizemli ama anlaşılır bir dille yaz. Enerji ve aura terimlerini açıkla. 5-7 paragraf olsun.`;

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
            max_tokens: 2500
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const interpretation = data.choices?.[0]?.message?.content || "Aura okuma yorumlanamadı.";

      await ctx.runMutation(api.fortunes.updateFortune, {
        fortuneId: args.fortuneId,
        interpretation,
        isInterpreted: true,
      });

      return interpretation;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Aura reading error:", errorMessage);
      throw error instanceof ConvexError ? error : new ConvexError({
        message: `Aura okuma yorumlanamadı: ${errorMessage}`,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});
