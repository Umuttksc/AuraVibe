import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Create a new menstrual cycle entry
export const createCycle = mutation({
  args: {
    startDate: v.string(),
    endDate: v.optional(v.string()),
    periodLength: v.optional(v.number()),
    symptoms: v.optional(v.array(v.string())),
    flow: v.optional(v.union(v.literal("light"), v.literal("medium"), v.literal("heavy"))),
    notes: v.optional(v.string()),
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

    const cycleId = await ctx.db.insert("menstrualCycles", {
      userId: user._id,
      startDate: args.startDate,
      endDate: args.endDate,
      periodLength: args.periodLength,
      cycleLength: undefined,
      symptoms: args.symptoms,
      flow: args.flow,
      notes: args.notes,
    });

    return cycleId;
  },
});

// Update an existing cycle
export const updateCycle = mutation({
  args: {
    cycleId: v.id("menstrualCycles"),
    endDate: v.optional(v.string()),
    periodLength: v.optional(v.number()),
    cycleLength: v.optional(v.number()),
    symptoms: v.optional(v.array(v.string())),
    flow: v.optional(v.union(v.literal("light"), v.literal("medium"), v.literal("heavy"))),
    notes: v.optional(v.string()),
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

    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Cycle not found",
      });
    }

    if (cycle.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only update your own cycles",
      });
    }

    await ctx.db.patch(args.cycleId, {
      endDate: args.endDate,
      periodLength: args.periodLength,
      cycleLength: args.cycleLength,
      symptoms: args.symptoms,
      flow: args.flow,
      notes: args.notes,
    });
  },
});

// Get user's cycles
export const getCycles = query({
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

    const cycles = await ctx.db
      .query("menstrualCycles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);

    return cycles;
  },
});

// Get latest cycle
export const getLatestCycle = query({
  args: {},
  handler: async (ctx) => {
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

    const latestCycle = await ctx.db
      .query("menstrualCycles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();

    return latestCycle;
  },
});

// Get cycles by date range
export const getCyclesByDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    const allCycles = await ctx.db
      .query("menstrualCycles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter cycles within date range
    const filteredCycles = allCycles.filter((cycle) => {
      return cycle.startDate >= args.startDate && cycle.startDate <= args.endDate;
    });

    return filteredCycles;
  },
});

// Delete a cycle
export const deleteCycle = mutation({
  args: { cycleId: v.id("menstrualCycles") },
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

    const cycle = await ctx.db.get(args.cycleId);
    if (!cycle) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Cycle not found",
      });
    }

    if (cycle.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only delete your own cycles",
      });
    }

    await ctx.db.delete(args.cycleId);
  },
});
