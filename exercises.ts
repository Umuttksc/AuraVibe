import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const getTodayExercises = query({
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
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", today)
      )
      .order("desc")
      .collect();

    return exercises;
  },
});

export const getAllExercises = query({
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

    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return exercises;
  },
});

export const addExercise = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    duration: v.number(),
    category: v.union(
      v.literal("cardio"),
      v.literal("strength"),
      v.literal("flexibility"),
      v.literal("balance"),
      v.literal("other")
    ),
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

    const today = new Date().toISOString().split("T")[0];
    const id = await ctx.db.insert("exercises", {
      userId: user._id,
      name: args.name,
      description: args.description,
      duration: args.duration,
      category: args.category,
      isCompleted: false,
      date: today,
    });

    return id;
  },
});

export const toggleComplete = mutation({
  args: { exerciseId: v.id("exercises") },
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

    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      throw new ConvexError({
        message: "Exercise not found",
        code: "NOT_FOUND",
      });
    }

    if (exercise.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.exerciseId, {
      isCompleted: !exercise.isCompleted,
    });
  },
});

export const deleteExercise = mutation({
  args: { exerciseId: v.id("exercises") },
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

    const exercise = await ctx.db.get(args.exerciseId);
    if (!exercise) {
      throw new ConvexError({
        message: "Exercise not found",
        code: "NOT_FOUND",
      });
    }

    if (exercise.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.exerciseId);
  },
});
