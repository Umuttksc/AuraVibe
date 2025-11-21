import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Create a new wellness goal
export const createGoal = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("fitness"),
      v.literal("mental_health"),
      v.literal("nutrition"),
      v.literal("sleep"),
      v.literal("habits"),
      v.literal("other")
    ),
    targetValue: v.number(),
    unit: v.string(),
    targetDate: v.string(),
    milestones: v.optional(
      v.array(
        v.object({
          value: v.number(),
          label: v.string(),
          completed: v.boolean(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
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
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    return await ctx.db.insert("wellnessGoals", {
      userId: user._id,
      title: args.title,
      description: args.description,
      category: args.category,
      targetValue: args.targetValue,
      currentValue: 0,
      unit: args.unit,
      startDate: today,
      targetDate: args.targetDate,
      isCompleted: false,
      milestones: args.milestones,
    });
  },
});

// Get user's wellness goals
export const getGoals = query({
  args: {
    category: v.optional(
      v.union(
        v.literal("fitness"),
        v.literal("mental_health"),
        v.literal("nutrition"),
        v.literal("sleep"),
        v.literal("habits"),
        v.literal("other")
      )
    ),
    includeCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
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
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    let goals;
    if (args.category) {
      goals = await ctx.db
        .query("wellnessGoals")
        .withIndex("by_user_and_category", (q) =>
          q.eq("userId", user._id).eq("category", args.category!)
        )
        .collect();
    } else {
      goals = await ctx.db
        .query("wellnessGoals")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    }

    if (!args.includeCompleted) {
      goals = goals.filter((g) => !g.isCompleted);
    }

    return goals;
  },
});

// Update goal progress
export const updateGoalProgress = mutation({
  args: {
    goalId: v.id("wellnessGoals"),
    value: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const goal = await ctx.db.get(args.goalId);
    if (!goal) {
      throw new ConvexError({
        message: "Hedef bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || goal.userId !== user._id) {
      throw new ConvexError({
        message: "Bu hedefi güncelleme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // Log progress
    await ctx.db.insert("wellnessGoalProgress", {
      userId: user._id,
      goalId: args.goalId,
      date: today,
      value: args.value,
      notes: args.notes,
    });

    // Update current value
    const newValue = goal.currentValue + args.value;
    const isCompleted = newValue >= goal.targetValue;

    // Update milestones
    let updatedMilestones = goal.milestones;
    if (updatedMilestones) {
      updatedMilestones = updatedMilestones.map((m) => ({
        ...m,
        completed: newValue >= m.value,
      }));
    }

    await ctx.db.patch(args.goalId, {
      currentValue: newValue,
      isCompleted,
      milestones: updatedMilestones,
    });
  },
});

// Update goal
export const updateGoal = mutation({
  args: {
    goalId: v.id("wellnessGoals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    targetValue: v.optional(v.number()),
    targetDate: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const goal = await ctx.db.get(args.goalId);
    if (!goal) {
      throw new ConvexError({
        message: "Hedef bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || goal.userId !== user._id) {
      throw new ConvexError({
        message: "Bu hedefi düzenleme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.targetValue !== undefined) updates.targetValue = args.targetValue;
    if (args.targetDate !== undefined) updates.targetDate = args.targetDate;
    if (args.isCompleted !== undefined) updates.isCompleted = args.isCompleted;

    await ctx.db.patch(args.goalId, updates);
  },
});

// Delete goal
export const deleteGoal = mutation({
  args: {
    goalId: v.id("wellnessGoals"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const goal = await ctx.db.get(args.goalId);
    if (!goal) {
      throw new ConvexError({
        message: "Hedef bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || goal.userId !== user._id) {
      throw new ConvexError({
        message: "Bu hedefi silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    // Delete all progress logs
    const progress = await ctx.db
      .query("wellnessGoalProgress")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId))
      .collect();

    for (const p of progress) {
      await ctx.db.delete(p._id);
    }

    await ctx.db.delete(args.goalId);
  },
});

// Get goal progress history
export const getGoalProgress = query({
  args: {
    goalId: v.id("wellnessGoals"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    let query = ctx.db
      .query("wellnessGoalProgress")
      .withIndex("by_goal", (q) => q.eq("goalId", args.goalId));

    if (args.startDate && args.endDate) {
      const allProgress = await query.collect();
      return allProgress.filter(
        (p) => p.date >= args.startDate! && p.date <= args.endDate!
      );
    }

    return await query.collect();
  },
});
