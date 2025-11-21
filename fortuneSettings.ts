import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ConvexError } from "convex/values";

// Get fortune pricing settings
export const getFortunePricing = query({
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
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    const pricing = await ctx.db.query("fortunePricing").first();
    return pricing;
  },
});

// Update fortune pricing settings (admin only)
export const updateFortunePricing = mutation({
  args: {
    coffeeFortunePricePerFortune: v.optional(v.number()),
    tarotFortunePricePerFortune: v.optional(v.number()),
    palmFortunePricePerFortune: v.optional(v.number()),
    birthchartFortunePricePerFortune: v.optional(v.number()),
    auraFortunePricePerFortune: v.optional(v.number()),
    dailyFreeCoffee: v.optional(v.number()),
    dailyFreeTarot: v.optional(v.number()),
    dailyFreePalm: v.optional(v.number()),
    dailyFreeBirthchart: v.optional(v.number()),
    dailyFreeAura: v.optional(v.number()),
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

    if (!user || (user.role !== "admin" && !user.isSuperAdmin)) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    const existingPricing = await ctx.db.query("fortunePricing").first();

    if (existingPricing) {
      // Update existing pricing
      await ctx.db.patch(existingPricing._id, args);
    } else {
      // Create new pricing with defaults
      await ctx.db.insert("fortunePricing", {
        coffeeFortunePricePerFortune: args.coffeeFortunePricePerFortune ?? 1000,
        tarotFortunePricePerFortune: args.tarotFortunePricePerFortune ?? 1500,
        palmFortunePricePerFortune: args.palmFortunePricePerFortune ?? 2000,
        birthchartFortunePricePerFortune: args.birthchartFortunePricePerFortune ?? 2500,
        auraFortunePricePerFortune: args.auraFortunePricePerFortune ?? 2000,
        dailyFreeCoffee: args.dailyFreeCoffee ?? 1,
        dailyFreeTarot: args.dailyFreeTarot ?? 1,
        dailyFreePalm: args.dailyFreePalm ?? 0,
        dailyFreeBirthchart: args.dailyFreeBirthchart ?? 0,
        dailyFreeAura: args.dailyFreeAura ?? 0,
      });
    }
  },
});
