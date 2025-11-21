import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const getDreams = query({
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

    const dreams = await ctx.db
      .query("dreams")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return dreams;
  },
});

export const addDream = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    date: v.string(),
    mood: v.optional(
      v.union(
        v.literal("peaceful"),
        v.literal("scary"),
        v.literal("confusing"),
        v.literal("happy"),
        v.literal("sad"),
        v.literal("exciting")
      )
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

    const id = await ctx.db.insert("dreams", {
      userId: user._id,
      title: args.title,
      content: args.content,
      date: args.date,
      mood: args.mood,
      isInterpreted: false,
    });

    return id;
  },
});

export const updateDream = mutation({
  args: {
    dreamId: v.id("dreams"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    date: v.optional(v.string()),
    mood: v.optional(
      v.union(
        v.literal("peaceful"),
        v.literal("scary"),
        v.literal("confusing"),
        v.literal("happy"),
        v.literal("sad"),
        v.literal("exciting")
      )
    ),
    interpretation: v.optional(v.string()),
    isInterpreted: v.optional(v.boolean()),
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

    const dream = await ctx.db.get(args.dreamId);
    if (!dream) {
      throw new ConvexError({
        message: "Dream not found",
        code: "NOT_FOUND",
      });
    }

    if (dream.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    const { dreamId, ...updates } = args;
    await ctx.db.patch(dreamId, updates);
  },
});

export const deleteDream = mutation({
  args: { dreamId: v.id("dreams") },
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

    const dream = await ctx.db.get(args.dreamId);
    if (!dream) {
      throw new ConvexError({
        message: "Dream not found",
        code: "NOT_FOUND",
      });
    }

    if (dream.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.dreamId);
  },
});
