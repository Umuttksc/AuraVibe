import { query } from "../_generated/server";
import { ConvexError } from "convex/values";

// Get fortune usage statistics
export const getFortuneStats = query({
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

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    // Get all fortunes
    const allFortunes = await ctx.db.query("fortunes").collect();
    
    // Count by type
    const coffeeFortunes = allFortunes.filter((f) => f.fortuneType === "coffee");
    const tarotFortunes = allFortunes.filter((f) => f.fortuneType === "tarot");
    const palmFortunes = allFortunes.filter((f) => f.fortuneType === "palm");
    const birthchartFortunes = allFortunes.filter((f) => f.fortuneType === "birthchart");
    const auraFortunes = allFortunes.filter((f) => f.fortuneType === "aura");
    
    // Count by category
    const byCategory = {
      love: allFortunes.filter((f) => f.category === "love").length,
      general: allFortunes.filter((f) => f.category === "general").length,
      career: allFortunes.filter((f) => f.category === "career").length,
      health: allFortunes.filter((f) => f.category === "health").length,
      money: allFortunes.filter((f) => f.category === "money").length,
    };

    // Count interpreted vs uninterpreted
    const interpretedCount = allFortunes.filter((f) => f.isInterpreted).length;
    const uninterpretedCount = allFortunes.length - interpretedCount;

    // Count public vs private
    const publicCount = allFortunes.filter((f) => f.isPublic).length;
    const privateCount = allFortunes.length - publicCount;

    // Count favorites
    const favoritesCount = allFortunes.filter((f) => f.isFavorite).length;

    // Count shared as posts
    const sharedCount = allFortunes.filter((f) => f.sharedPostId).length;

    // Get payments
    const allPayments = await ctx.db.query("fortunePayments").collect();
    const completedPayments = allPayments.filter((p) => p.status === "completed");
    
    // Calculate revenue (convert from kuruş to lira)
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0) / 100;
    const coffeeRevenue = completedPayments
      .filter((p) => p.fortuneType === "coffee")
      .reduce((sum, p) => sum + p.amount, 0) / 100;
    const tarotRevenue = completedPayments
      .filter((p) => p.fortuneType === "tarot")
      .reduce((sum, p) => sum + p.amount, 0) / 100;
    const palmRevenue = completedPayments
      .filter((p) => p.fortuneType === "palm")
      .reduce((sum, p) => sum + p.amount, 0) / 100;
    const birthchartRevenue = completedPayments
      .filter((p) => p.fortuneType === "birthchart")
      .reduce((sum, p) => sum + p.amount, 0) / 100;
    const auraRevenue = completedPayments
      .filter((p) => p.fortuneType === "aura")
      .reduce((sum, p) => sum + p.amount, 0) / 100;

    // Get premium subscriptions
    const allSubscriptions = await ctx.db.query("premiumSubscriptions").collect();
    const activeSubscriptions = allSubscriptions.filter((s) => s.status === "active");
    const premiumRevenue = allSubscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + s.amount, 0) / 100;

    // Get unique users who used fortunes
    const uniqueUsers = new Set(allFortunes.map((f) => f.userId)).size;

    return {
      totalFortunes: allFortunes.length,
      coffeeFortunesCount: coffeeFortunes.length,
      tarotFortunesCount: tarotFortunes.length,
      palmFortunesCount: palmFortunes.length,
      birthchartFortunesCount: birthchartFortunes.length,
      auraFortunesCount: auraFortunes.length,
      byCategory,
      interpretedCount,
      uninterpretedCount,
      publicCount,
      privateCount,
      favoritesCount,
      sharedCount,
      uniqueUsers,
      revenue: {
        total: totalRevenue,
        coffee: coffeeRevenue,
        tarot: tarotRevenue,
        palm: palmRevenue,
        birthchart: birthchartRevenue,
        aura: auraRevenue,
        premium: premiumRevenue,
      },
      payments: {
        total: allPayments.length,
        completed: completedPayments.length,
        pending: allPayments.filter((p) => p.status === "pending").length,
        failed: allPayments.filter((p) => p.status === "failed").length,
      },
      subscriptions: {
        total: allSubscriptions.length,
        active: activeSubscriptions.length,
        cancelled: allSubscriptions.filter((s) => s.status === "cancelled").length,
        expired: allSubscriptions.filter((s) => s.status === "expired").length,
      },
    };
  },
});

// Get recent fortunes (for admin review)
export const getRecentFortunes = query({
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

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    const fortunes = await ctx.db
      .query("fortunes")
      .order("desc")
      .take(20);

    // Get user details for each fortune
    const fortunesWithUsers = await Promise.all(
      fortunes.map(async (fortune) => {
        const fortuneUser = await ctx.db.get(fortune.userId);
        let imageUrl = null;
        if ((fortune.fortuneType === "coffee" || fortune.fortuneType === "palm" || fortune.fortuneType === "aura") && fortune.imageId) {
          imageUrl = await ctx.storage.getUrl(fortune.imageId);
        }
        return {
          ...fortune,
          imageUrl,
          user: fortuneUser
            ? {
                _id: fortuneUser._id,
                name: fortuneUser.name,
                username: fortuneUser.username,
              }
            : null,
        };
      })
    );

    return fortunesWithUsers;
  },
});
