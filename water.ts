import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const getTodayIntake = query({
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

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const intake = await ctx.db
      .query("waterIntake")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", today)
      )
      .unique();

    return intake;
  },
});

export const addWater = mutation({
  args: { amount: v.number() },
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

    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("waterIntake")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", today)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: existing.amount + args.amount,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert("waterIntake", {
        userId: user._id,
        date: today,
        amount: args.amount,
        goal: 2000, // Default 2L goal
      });
      return id;
    }
  },
});

export const updateGoal = mutation({
  args: { goal: v.number() },
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

    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("waterIntake")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", today)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        goal: args.goal,
      });
    } else {
      await ctx.db.insert("waterIntake", {
        userId: user._id,
        date: today,
        amount: 0,
        goal: args.goal,
      });
    }
  },
});

export const resetToday = mutation({
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

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const existing = await ctx.db
      .query("waterIntake")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", today)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: 0,
      });
    }
  },
});

export const getWeeklyHistory = query({
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

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const allIntakes = await ctx.db
      .query("waterIntake")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(7);

    return allIntakes;
  },
});
