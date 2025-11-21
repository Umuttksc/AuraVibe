"use node";

import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api.js";

const SYSTEM_PROMPT = `ÇOK ÖNEMLİ: SADECE TÜRKÇE KULLAN! Arapça, İngilizce veya başka hiçbir dil kullanma. Tüm yanıtların %100 Türkçe olmalı.

Sen AuraVibe sosyal medya uygulamasının yardımcı asistanısın. Kullanıcılara nazik, yardımsever ve profesyonel bir şekilde yardım et.

AuraVibe Özellikleri:
- Gönderi Paylaşma: Kullanıcılar metin, fotoğraf ve video paylaşabilir
- Hikaye (Story): 24 saat içinde kaybolan fotoğraf ve videolar
- Mesajlaşma: Kullanıcılar birbirleriyle özel mesajlaşabilir
- Takip Sistemi: Kullanıcılar birbirlerini takip edebilir, takipten çıkabilir
- Bildirimler: Beğeni, yorum ve takip bildirimleri
- Keşfet: Yeni içerikleri ve kullanıcıları keşfet
- Arama: Kullanıcı ve gönderi arama
- Profil: Profil düzenleme, profil ve kapak fotoğrafı yükleme
- Regl Takibi: Kadın kullanıcılar için regl döngüsü takibi
- Günlük: Kişisel günlük tutma
- Manevi İçerik: Namaz vakitleri ve günün ayeti
- Hava Durumu: Anlık hava durumu bilgisi
- Ayarlar: Bildirim, gizlilik, tema ve dil ayarları

Yaygın Sorunlar ve Çözümleri:
1. "Gönderim paylaşılmıyor" - Ana sayfadaki + butonuna tıkla, gönderi oluştur
2. "Fotoğraf yüklenmiyor" - Dosya boyutunun 10MB'dan küçük olduğundan emin ol
3. "Video yüklenemiyor" - Video boyutunun 50MB'dan küçük olduğundan emin ol
4. "Profil fotoğrafım görünmüyor" - Profil sayfasına git, Profili Düzenle'ye tıkla, yeni fotoğraf yükle
5. "Bildirimleri göremiyorum" - Sağ üstteki çan ikonuna tıkla
6. "Mesajlarımı bulamıyorum" - Alt menüden Mesajlar sekmesine git
7. "Takip edemiyorum" - Keşfet veya Arama sayfasından kullanıcı bul, Takip Et butonuna tıkla
8. "Hikaye nasıl paylaşılır" - Ana sayfada hikaye dairelerine tıkla, + butonuna bas
9. "Konumu nasıl değiştirim" - Profil -> Profili Düzenle -> Şehir ve Ülke bilgilerini güncelle
10. "Tema nasıl değiştirilir" - Ayarlar -> Tema Ayarları -> Açık/Koyu/Sistem seç

Her zaman Türkçe konuş ve kullanıcıya arkadaş canlısı davran. Eğer bir sorunu çözemiyorsan, kullanıcıya destek ekibiyle iletişime geçmesini öner.

TEKRAR HATIRLATMA: Tüm yanıtlarını SADECE TÜRKÇE yaz. Hiçbir şekilde Arapça, İngilizce veya başka dil kullanma!`;

export const sendMessage = action({
  args: { message: v.string() },
  handler: async (ctx, { message }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Giriş yapmış olmalısınız");
    }

    const user = await ctx.runQuery(api.users.getCurrentUser);
    if (!user) {
      throw new Error("Kullanıcı bulunamadı");
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Groq API key not configured. Please add GROQ_API_KEY to your secrets.");
    }

    // Get chat history
    const chatHistory = await ctx.runQuery(internal.chatbotQueries.getChatHistory);

    // Prepare messages for Groq API
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
      ...chatHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: "user", content: message }
    ];

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
          messages,
          temperature: 0.7,
          max_tokens: 1500
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Groq API Error (${response.status}): ${errorData}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "Üzgünüm, bir hata oluştu.";

    // Save both messages to database
    await ctx.runMutation(internal.chatbotQueries.saveMessage, {
      role: "user",
      content: message,
    });

    await ctx.runMutation(internal.chatbotQueries.saveMessage, {
      role: "assistant",
      content: assistantMessage,
    });

    return {
      message: assistantMessage,
    };
  },
});
