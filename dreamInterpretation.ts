"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api.js";
import { ConvexError } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

export const interpretDream = action({
  args: {
    dreamId: v.id("dreams"),
    dreamContent: v.string(),
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
        
        // Get recent journal entries for emotional context
        const recentJournals = await ctx.runQuery(api.journal.getEntries, {
          paginationOpts: { numItems: 1, cursor: null }
        });
        if (recentJournals && recentJournals.page.length > 0) {
          const lastEntry = recentJournals.page[0];
          const contentPreview = lastEntry.content.slice(0, 50) + (lastEntry.content.length > 50 ? "..." : "");
          userContext += `\n- Son Günlük Giriş: "${contentPreview}" (${lastEntry.mood || "belirsiz ruh hali"})`;
        }

        // Get recent dreams for pattern analysis
        const recentDreams = await ctx.runQuery(api.dreams.getDreams, {});
        if (recentDreams && recentDreams.length > 1) {
          userContext += `\n- Önceki Rüya Sayısı: ${recentDreams.length - 1}`;
        }
      }

      const systemPrompt = `ÇOK ÖNEMLİ: SADECE TÜRKÇE KULLAN! Arapça, İngilizce veya başka hiçbir dil kullanma. Tüm yorumun %100 Türkçe olmalı.

Sen bir rüya yorumcususun. Kullanıcının anlattığı rüyayı psikolojik, sembolik ve İslami açıdan KİŞİSELLEŞTİRİLMİŞ bir şekilde yorumla.${userContext}

Yorumunu Türkçe olarak, anlaşılır ve empatik bir dille yaz. Yorumunu 3-4 paragraf halinde sun:

1. **Genel Rüya Özeti**: Rüyanın ana temalarını özetle, kullanıcının ismiyle hitap et
2. **Sembolik Yorumlama**: Rüyadaki sembollerin anlamlarını açıkla, kullanıcının yaşı ve durumunu göz önünde bulundur
3. **Psikolojik Bakış**: Rüyanın kişinin iç dünyası ve duygularıyla ilişkisini değerlendir, son günlük girişiyle bağlantı kur
4. **Öneriler**: Rüyanın mesajına göre kişiye ÖZEL ve pratik önerilerde bulun

ÖNEMLI: Yorumunu kullanıcının yaşına, cinsiyetine, duygusal durumuna göre KİŞİSELLEŞTİR. Genel klişelerden kaçın. İsmiyle hitap et. Yorumlarını bilimsel, saygılı ve empatik bir yaklaşımla sun.

TEKRAR HATIRLATMA: Yorumunun tamamını SADECE TÜRKÇE yaz. Hiçbir şekilde Arapça, İngilizce veya başka dil kullanma!`;

      const prompt = `${systemPrompt}\n\nRüya: ${args.dreamContent}`;
      
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
      const interpretation = data.choices?.[0]?.message?.content || "Rüya yorumlanamadı.";

      // Update the dream with the interpretation
      await ctx.runMutation(api.dreams.updateDream, {
        dreamId: args.dreamId,
        interpretation,
        isInterpreted: true,
      });

      return interpretation;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Dream interpretation error:", errorMessage);
      throw new ConvexError({
        message: `Failed to interpret dream: ${errorMessage}`,
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }
  },
});
