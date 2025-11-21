import { mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

// Seed default gifts (admin only)
export const seedDefaultGifts = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || (user.role !== "admin" && !user.isSuperAdmin)) {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    // Check if gifts already exist
    const existingGifts = await ctx.db.query("gifts").first();
    if (existingGifts) {
      throw new ConvexError({
        message: "Gifts already seeded",
        code: "CONFLICT",
      });
    }

    // Default gift collection with animated emojis
    const defaultGifts = [
      // Love Category
      {
        name: "❤️ Kalp",
        description: "Sevgini göster",
        price: 1000, // 10 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif",
        category: "love",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "💝 Hediye Kutusu",
        description: "Özel hediye",
        price: 2500, // 25 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f49d/512.gif",
        category: "love",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🌹 Gül",
        description: "Romantik jest",
        price: 1500, // 15 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f339/512.gif",
        category: "love",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "💋 Öpücük",
        description: "Tatlı öpücük",
        price: 800, // 8 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f48b/512.gif",
        category: "love",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "💕 İki Kalp",
        description: "Çift kalp",
        price: 2000, // 20 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f495/512.gif",
        category: "love",
        isActive: true,
        isDeleted: false,
      },

      // Celebration Category
      {
        name: "🎉 Konfeti",
        description: "Kutlama zamanı",
        price: 1200, // 12 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f389/512.gif",
        category: "celebration",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🎂 Pasta",
        description: "Doğum günün kutlu olsun",
        price: 1800, // 18 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f382/512.gif",
        category: "celebration",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🎁 Hediye",
        description: "Sürpriz hediye",
        price: 2200, // 22 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f381/512.gif",
        category: "celebration",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🏆 Kupa",
        description: "Şampiyonsun",
        price: 3000, // 30 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3c6/512.gif",
        category: "celebration",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🎈 Balon",
        description: "Parti balonu",
        price: 1000, // 10 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f388/512.gif",
        category: "celebration",
        isActive: true,
        isDeleted: false,
      },

      // Fun Category
      {
        name: "😂 Kahkaha",
        description: "Çok komik",
        price: 500, // 5 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif",
        category: "fun",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🤣 Yuvarlanıyorum",
        description: "Gülmekten öldüm",
        price: 800, // 8 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f923/512.gif",
        category: "fun",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🎮 Oyun",
        description: "Oyun arkadaşı",
        price: 1500, // 15 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ae/512.gif",
        category: "fun",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🍕 Pizza",
        description: "Yemek ısmarlıyorum",
        price: 1000, // 10 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f355/512.gif",
        category: "fun",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "☕ Kahve",
        description: "Kahve içelim",
        price: 700, // 7 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/2615/512.gif",
        category: "fun",
        isActive: true,
        isDeleted: false,
      },

      // Friendship Category
      {
        name: "👋 El Sallama",
        description: "Selam!",
        price: 500, // 5 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif",
        category: "friendship",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🤝 Tokalaşma",
        description: "Anlaştık!",
        price: 1200, // 12 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f91d/512.gif",
        category: "friendship",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🎮 Oyun Kumandası",
        description: "Oyun oynayalım",
        price: 1500, // 15 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ae/512.gif",
        category: "friendship",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🤗 Sarılma",
        description: "Sarılalım",
        price: 1800, // 18 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.gif",
        category: "friendship",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👯 Dans",
        description: "Dans edelim",
        price: 2000, // 20 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f46f/512.gif",
        category: "friendship",
        isActive: true,
        isDeleted: false,
      },
      
      // Support Category
      {
        name: "💪 Güç",
        description: "Güçlüsün!",
        price: 1000, // 10 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.gif",
        category: "support",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👏 Alkış",
        description: "Bravo!",
        price: 800, // 8 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44f/512.gif",
        category: "support",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "🙏 Teşekkür",
        description: "Teşekkürler",
        price: 1200, // 12 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.gif",
        category: "support",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "⭐ Yıldız",
        description: "Parlıyorsun",
        price: 2000, // 20 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/2b50/512.gif",
        category: "support",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "✨ Parıltı",
        description: "Işıldıyorsun",
        price: 1500, // 15 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/2728/512.gif",
        category: "support",
        isActive: true,
        isDeleted: false,
      },
    ];

    // Insert all gifts
    for (const gift of defaultGifts) {
      await ctx.db.insert("gifts", gift);
    }

    return { success: true, count: defaultGifts.length };
  },
});
