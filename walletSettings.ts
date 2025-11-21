import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get wallet settings
export const getWalletSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("walletSettings").first();
    
    // Return default if not found
    if (!settings) {
      return {
        minWithdrawalAmount: 25000, // 250 TL
        levelThreshold: 1000000, // 10,000 TL
        maxLevel: 100,
        level50PlusDiscount: 25,
        recipientSharePercent: 50, // 50% to recipient
      };
    }
    
    return settings;
  },
});

// Update wallet settings (admin only)
export const updateWalletSettings = mutation({
  args: {
    minWithdrawalAmount: v.number(),
    levelThreshold: v.number(),
    maxLevel: v.number(),
    level50PlusDiscount: v.number(),
  },
  handler: async (ctx, args) => {
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

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    if (user.role !== "admin" && !user.isSuperAdmin) {
      throw new ConvexError({
        message: "Only admins can update wallet settings",
        code: "FORBIDDEN",
      });
    }

    // Validate inputs
    if (args.minWithdrawalAmount < 0) {
      throw new ConvexError({
        message: "Minimum withdrawal amount must be positive",
        code: "BAD_REQUEST",
      });
    }

    if (args.levelThreshold <= 0) {
      throw new ConvexError({
        message: "Level threshold must be positive",
        code: "BAD_REQUEST",
      });
    }

    if (args.maxLevel < 1 || args.maxLevel > 1000) {
      throw new ConvexError({
        message: "Max level must be between 1 and 1000",
        code: "BAD_REQUEST",
      });
    }

    if (args.level50PlusDiscount < 0 || args.level50PlusDiscount > 100) {
      throw new ConvexError({
        message: "Discount percentage must be between 0 and 100",
        code: "BAD_REQUEST",
      });
    }

    // Check if settings exist
    const existing = await ctx.db.query("walletSettings").first();
    
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return await ctx.db.insert("walletSettings", args);
    }
  },
});
