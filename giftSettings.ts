import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get gift settings
export const getGiftSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("giftSettings").first();
    return settings || null;
  },
});

// Admin: Update gift settings
export const updateGiftSettings = mutation({
  args: {
    platformSharePercentage: v.number(),
    creatorSharePercentage: v.number(),
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

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    // Validate percentages add up to 100
    if (args.platformSharePercentage + args.creatorSharePercentage !== 100) {
      throw new ConvexError({
        message: "Percentages must add up to 100",
        code: "BAD_REQUEST",
      });
    }

    // Check if settings exist
    const existing = await ctx.db.query("giftSettings").first();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("giftSettings", args);
    }

    return { success: true };
  },
});
