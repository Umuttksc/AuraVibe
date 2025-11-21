import { mutation } from "./_generated/server";

export const seedPremiumGifts = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if premium gifts already exist
    const existingPremiumGifts = await ctx.db
      .query("gifts")
      .filter((q) => q.eq(q.field("isPremium"), true))
      .collect();

    if (existingPremiumGifts.length > 0) {
      return { success: true, message: "Premium gifts already exist", count: existingPremiumGifts.length };
    }

    const premiumGifts = [
      {
        name: "💎 Elmas Şöleni",
        description: "Ekranı elmaslarla kaplayan muhteşem hediye",
        price: 100000, // 1,000 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f48e/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "diamonds" as const,
      },
      {
        name: "🎆 Havai Fişek Gösterisi",
        description: "Gökyüzünü aydınlatan muhteşem havai fişek",
        price: 150000, // 1,500 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f386/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "fireworks" as const,
      },
      {
        name: "💰 Altın Yağmuru",
        description: "Ekranı altın ve para ile kaplayan lüks hediye",
        price: 200000, // 2,000 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4b0/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "coins" as const,
      },
      {
        name: "⭐ Yıldız Yağmuru",
        description: "Gökyüzünden yıldızlar yağdıran büyülü hediye",
        price: 75000, // 750 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/2b50/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "stars" as const,
      },
      {
        name: "❤️ Kalp Kasırgası",
        description: "Ekranı kalplerle dolduran romantik hediye",
        price: 50000, // 500 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/2764_fe0f/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "hearts" as const,
      },
      {
        name: "🔥 Alev Fırtınası",
        description: "Ekranı alevlerle saran güçlü hediye",
        price: 120000, // 1,200 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "fire" as const,
      },
      {
        name: "❄️ Kar Fırtınası",
        description: "Ekranı kar taneleriyle kaplayan muhteşem hediye",
        price: 60000, // 600 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/2744_fe0f/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "snow" as const,
      },
      {
        name: "🎊 Konfeti Patlaması",
        description: "Ekranı renkli konfetilerle dolduran eğlenceli hediye",
        price: 40000, // 400 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f38a/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "confetti" as const,
      },
      {
        name: "👑 Taç",
        description: "Kraliçe/Kral tacı",
        price: 250000, // 2,500 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f451/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "crown" as const,
      },
      {
        name: "🌟 Parlayan Yıldız",
        description: "Göz kamaştırıcı parıltı",
        price: 80000, // 800 TL
        imageUrl: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f31f/512.gif",
        category: "premium",
        isActive: true,
        isPremium: true,
        animationType: "sparkle" as const,
      },
    ];

    // Insert premium gifts
    for (const gift of premiumGifts) {
      await ctx.db.insert("gifts", gift);
    }

    return { success: true, message: "Premium gifts seeded successfully", count: premiumGifts.length };
  },
});
