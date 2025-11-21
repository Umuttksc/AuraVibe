import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Create a journal entry
export const createEntry = mutation({
  args: {
    date: v.string(),
    content: v.string(),
    mood: v.optional(
      v.union(
        v.literal("happy"),
        v.literal("sad"),
        v.literal("anxious"),
        v.literal("calm"),
        v.literal("energetic"),
        v.literal("tired")
      )
    ),
    activities: v.optional(v.array(v.string())),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if entry for this date already exists
    const existingEntry = await ctx.db
      .query("journalEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date),
      )
      .unique();

    if (existingEntry) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Journal entry for this date already exists",
      });
    }

    const entryId = await ctx.db.insert("journalEntries", {
      userId: user._id,
      date: args.date,
      content: args.content,
      mood: args.mood,
      activities: args.activities,
      isPrivate: args.isPrivate,
    });

    return entryId;
  },
});

// Update a journal entry
export const updateEntry = mutation({
  args: {
    entryId: v.id("journalEntries"),
    content: v.optional(v.string()),
    mood: v.optional(
      v.union(
        v.literal("happy"),
        v.literal("sad"),
        v.literal("anxious"),
        v.literal("calm"),
        v.literal("energetic"),
        v.literal("tired")
      )
    ),
    activities: v.optional(v.array(v.string())),
    isPrivate: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Journal entry not found",
      });
    }

    if (entry.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only update your own entries",
      });
    }

    await ctx.db.patch(args.entryId, {
      content: args.content,
      mood: args.mood,
      activities: args.activities,
      isPrivate: args.isPrivate,
    });
  },
});

// Get user's journal entries
export const getEntries = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return { page: [], isDone: true, continueCursor: "" };
    }

    const entries = await ctx.db
      .query("journalEntries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    return entries;
  },
});

// Get entry by date
export const getEntryByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null;
    }

    const entry = await ctx.db
      .query("journalEntries")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date),
      )
      .unique();

    return entry;
  },
});

// Delete a journal entry
export const deleteEntry = mutation({
  args: { entryId: v.id("journalEntries") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Journal entry not found",
      });
    }

    if (entry.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only delete your own entries",
      });
    }

    await ctx.db.delete(args.entryId);
  },
});
