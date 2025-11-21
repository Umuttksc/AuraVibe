import { mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { v } from "convex/values";

// Seed football team gifts (admin only)
export const seedTeamGifts = mutation({
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

    // Süper Lig Takımları (2024-25 Sezonu - 19 Takım)
    // Her takımın forması ve renkleriyle animasyonlar
    const superLigTeams = [
      {
        name: "👕 Galatasaray",
        description: "🟡🔴 Sarı Kırmızı Forma",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/hbKu_-k6oS0AAAAi/galatasaray-gs.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Fenerbahçe",
        description: "🟡🔵 Sarı Lacivert Forma",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/m4zKwlIEfOUAAAAi/fenerbah%C3%A7e.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Beşiktaş",
        description: "⚪⚫ Siyah Beyaz Forma",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/pGABLLcUJSkAAAAi/be%C5%9Fikta%C5%9F-bjk.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Trabzonspor",
        description: "🔵🔴 Bordo Mavi Forma",
        price: 2000, // 20 TL
        imageUrl: "https://media.tenor.com/_JHj7HrGq4EAAAAi/trabzonspor.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Başakşehir",
        description: "🟠🔵 Turuncu Lacivert Forma",
        price: 1500, // 15 TL
        imageUrl: "https://media.tenor.com/b8nLXQQKV9MAAAAi/jersey-shirt.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Kasımpaşa",
        description: "🔵⚪ Mavi Beyaz Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/wZ2EpOCZZvkAAAAi/football-jersey.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Konyaspor",
        description: "🟢⚪ Yeşil Beyaz Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/S8cV9H8XWu4AAAAi/soccer-football.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Alanyaspor",
        description: "🟠🟢 Turuncu Yeşil Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/YT8P9f7AEUEAAAAi/football-soccer.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Antalyaspor",
        description: "🔴⚪ Kırmızı Beyaz Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/KsZtoYwjpwQAAAAi/soccer-jersey.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Sivasspor",
        description: "🔴⚪ Kırmızı Beyaz Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/4wS5BgKp4R8AAAAi/football-shirt.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Gaziantep FK",
        description: "🔴⚫ Kırmızı Siyah Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/Rb6Y5kXx8f0AAAAi/soccer-football.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Kayserispor",
        description: "🔴🟡 Kırmızı Sarı Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/VwgJUCNyHE8AAAAi/football-soccer.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Hatayspor",
        description: "🔴⚫ Kırmızı Siyah Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/DqKW7xRh8_oAAAAi/soccer-ball.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Rizespor",
        description: "🟢🔵 Yeşil Mavi Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/lqOBGUhWLxMAAAAi/football-soccer.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Adana Demirspor",
        description: "🔵⚪ Mavi Beyaz Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/2-e3rWDfkR4AAAAi/soccer-football.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Samsunspor",
        description: "🔴⚪ Kırmızı Beyaz Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/XQOZhqTBY5AAAAAi/football-soccer.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Pendikspor",
        description: "🔴🟡 Kırmızı Sarı Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/j_MJ_OAGgO0AAAAi/football-soccer.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Eyüpspor",
        description: "🟣⚪ Mor Beyaz Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/YEi2tKBwfMoAAAAi/soccer-football.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Bodrumspor",
        description: "🟢⚪ Yeşil Beyaz Forma",
        price: 1200, // 12 TL
        imageUrl: "https://media.tenor.com/Tb7q8R9u4qsAAAAi/football-soccer.gif",
        category: "süper-lig",
        isActive: true,
        isDeleted: false,
      },
    ];

    // Avrupa Takımları - Forma renkleri ile
    const europeanTeams = [
      {
        name: "👕 Real Madrid",
        description: "⚪ Beyaz Forma - Los Blancos",
        price: 3000, // 30 TL
        imageUrl: "https://media.tenor.com/JV_wygb8l0YAAAAi/real-madrid.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Barcelona",
        description: "🔴🔵 Blaugrana Forma",
        price: 3000, // 30 TL
        imageUrl: "https://media.tenor.com/R6fV-LmhCBsAAAAi/barcelona.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Manchester United",
        description: "🔴⚫ Kırmızı Forma - Red Devils",
        price: 3000, // 30 TL
        imageUrl: "https://media.tenor.com/DEhBlpCJqeEAAAAi/manchester-united.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Liverpool",
        description: "🔴 Kırmızı Forma - The Reds",
        price: 3000, // 30 TL
        imageUrl: "https://media.tenor.com/VQU9YWvnP7MAAAAi/liverpool.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Bayern Munich",
        description: "🔴⚪ Kırmızı Beyaz Forma",
        price: 3000, // 30 TL
        imageUrl: "https://media.tenor.com/vWFq5XfusFUAAAAi/bayern-munich.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Paris Saint-Germain",
        description: "🔵🔴 Lacivert Kırmızı Forma - PSG",
        price: 3000, // 30 TL
        imageUrl: "https://media.tenor.com/4NzmA_QmkS0AAAAi/psg.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Juventus",
        description: "⚪⚫ Siyah Beyaz Forma",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/8ZWXCcjvxv8AAAAi/juventus.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Inter Milan",
        description: "🔵⚫ Mavi Siyah Forma",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/p6kNiQJKDXsAAAAi/inter-milan.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 AC Milan",
        description: "🔴⚫ Kırmızı Siyah Forma",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/FwEBYV-g2zUAAAAi/ac-milan.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Arsenal",
        description: "🔴⚪ Kırmızı Beyaz Forma",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/PkO6MH3yQS8AAAAi/arsenal.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Chelsea",
        description: "🔵⚪ Mavi Beyaz Forma - The Blues",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/l0HA4OhCVJsAAAAi/chelsea.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Manchester City",
        description: "🔵⚪ Açık Mavi Forma",
        price: 3000, // 30 TL
        imageUrl: "https://media.tenor.com/xsj3s1R60wYAAAAi/manchester-city.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Borussia Dortmund",
        description: "🟡⚫ Sarı Siyah Forma - BVB",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/0cLCKc94FycAAAAi/borussia-dortmund.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
      {
        name: "👕 Atletico Madrid",
        description: "🔴⚪ Kırmızı Beyaz Forma",
        price: 2500, // 25 TL
        imageUrl: "https://media.tenor.com/mMN30xWNgfwAAAAi/atletico-madrid.gif",
        category: "avrupa",
        isActive: true,
        isDeleted: false,
      },
    ];

    const allTeamGifts = [...superLigTeams, ...europeanTeams];

    // Insert all team gifts
    let count = 0;
    for (const gift of allTeamGifts) {
      // Check if gift already exists
      const existing = await ctx.db
        .query("gifts")
        .filter((q) =>
          q.and(
            q.eq(q.field("name"), gift.name),
            q.neq(q.field("isDeleted"), true)
          )
        )
        .first();

      if (!existing) {
        await ctx.db.insert("gifts", gift);
        count++;
      }
    }

    return { success: true, count };
  },
});

// Remove duplicate team gifts (admin only)
export const removeDuplicateTeamGifts = mutation({
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

    // Get all team gifts (both süper-lig and avrupa)
    const allGifts = await ctx.db
      .query("gifts")
      .filter((q) => q.neq(q.field("isDeleted"), true))
      .collect();

    const teamGifts = allGifts.filter(
      (gift) =>
        gift.category === "süper-lig" || gift.category === "avrupa"
    );

    // Helper function to extract team name (remove emojis and extra text)
    const normalizeTeamName = (name: string): string => {
      // Remove emojis and common prefixes
      return name
        .replace(/[👕⚽🟡🔴⚪⚫🔵🟠🟢🟣]/gu, "")
        .trim();
    };

    // Group gifts by normalized team name
    const teamGroups = new Map<string, typeof teamGifts>();
    for (const gift of teamGifts) {
      const normalizedName = normalizeTeamName(gift.name);
      if (!teamGroups.has(normalizedName)) {
        teamGroups.set(normalizedName, []);
      }
      teamGroups.get(normalizedName)!.push(gift);
    }

    // For each group, keep the most recent one and delete others
    let deletedCount = 0;
    for (const [teamName, gifts] of teamGroups) {
      if (gifts.length > 1) {
        // Sort by creation time (most recent first)
        gifts.sort((a, b) => b._creationTime - a._creationTime);
        
        // Keep the first (most recent), delete the rest
        for (let i = 1; i < gifts.length; i++) {
          await ctx.db.patch(gifts[i]._id, { isDeleted: true });
          deletedCount++;
        }
      }
    }

    return { success: true, deletedCount };
  },
});
