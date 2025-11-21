import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Create a new habit
export const createHabit = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    category: v.union(
      v.literal("health"),
      v.literal("fitness"),
      v.literal("mindfulness"),
      v.literal("productivity"),
      v.literal("social"),
      v.literal("learning"),
      v.literal("other")
    ),
    frequency: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("custom")
    ),
    targetDays: v.optional(v.array(v.number())),
    reminderTime: v.optional(v.string()),
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

    return await ctx.db.insert("habits", {
      userId: user._id,
      name: args.name,
      description: args.description,
      category: args.category,
      frequency: args.frequency,
      targetDays: args.targetDays,
      reminderTime: args.reminderTime,
      isActive: true,
      currentStreak: 0,
      longestStreak: 0,
    });
  },
});

// Get user's habits
export const getHabits = query({
  args: {
    includeInactive: v.optional(v.boolean()),
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

    let habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (!args.includeInactive) {
      habits = habits.filter((h) => h.isActive);
    }

    return habits;
  },
});

// Update habit
export const updateHabit = mutation({
  args: {
    habitId: v.id("habits"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(
      v.union(
        v.literal("health"),
        v.literal("fitness"),
        v.literal("mindfulness"),
        v.literal("productivity"),
        v.literal("social"),
        v.literal("learning"),
        v.literal("other")
      )
    ),
    frequency: v.optional(
      v.union(v.literal("daily"), v.literal("weekly"), v.literal("custom"))
    ),
    targetDays: v.optional(v.array(v.number())),
    reminderTime: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const habit = await ctx.db.get(args.habitId);
    if (!habit) {
      throw new ConvexError({
        message: "Alışkanlık bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || habit.userId !== user._id) {
      throw new ConvexError({
        message: "Bu alışkanlığı düzenleme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.category !== undefined) updates.category = args.category;
    if (args.frequency !== undefined) updates.frequency = args.frequency;
    if (args.targetDays !== undefined) updates.targetDays = args.targetDays;
    if (args.reminderTime !== undefined)
      updates.reminderTime = args.reminderTime;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.habitId, updates);
  },
});

// Delete habit
export const deleteHabit = mutation({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const habit = await ctx.db.get(args.habitId);
    if (!habit) {
      throw new ConvexError({
        message: "Alışkanlık bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || habit.userId !== user._id) {
      throw new ConvexError({
        message: "Bu alışkanlığı silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    // Delete all logs for this habit
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(args.habitId);
  },
});

// Log habit completion
export const logHabitCompletion = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
    completed: v.boolean(),
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

    const habit = await ctx.db.get(args.habitId);
    if (!habit) {
      throw new ConvexError({
        message: "Alışkanlık bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || habit.userId !== user._id) {
      throw new ConvexError({
        message: "Bu alışkanlığı güncelleme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    // Check if log already exists for this date
    const existing = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit_and_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: args.completed,
        notes: args.notes,
      });
    } else {
      await ctx.db.insert("habitLogs", {
        userId: user._id,
        habitId: args.habitId,
        date: args.date,
        completed: args.completed,
        notes: args.notes,
      });
    }

    // Update streak
    await updateHabitStreak(ctx, args.habitId, user._id);
  },
});

// Helper function to update habit streak
async function updateHabitStreak(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  habitId: unknown,
  userId: unknown
) {
  const logs = await ctx.db
    .query("habitLogs")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .withIndex("by_habit", (q: any) => q.eq("habitId", habitId))
    .order("desc")
    .collect();

  const completedLogs = (logs as { completed: boolean; date: string }[])
    .filter((l) => l.completed)
    .sort((a, b) => b.date.localeCompare(a.date));

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date().toISOString().split("T")[0];
  let checkDate = today;

  for (const log of completedLogs) {
    if (log.date === checkDate) {
      tempStreak++;
      if (checkDate === today || checkDate === getYesterday(today)) {
        currentStreak = tempStreak;
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      // Move to previous day
      checkDate = getPreviousDay(checkDate);
    } else {
      // Streak broken
      break;
    }
  }

  await ctx.db.patch(habitId, {
    currentStreak,
    longestStreak,
  });
}

function getYesterday(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

function getPreviousDay(dateStr: string): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

// Get habit logs for a date range
export const getHabitLogs = query({
  args: {
    habitId: v.id("habits"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    return logs;
  },
});

// Get habit statistics
export const getHabitStats = query({
  args: {
    habitId: v.id("habits"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const habit = await ctx.db.get(args.habitId);
    if (!habit) {
      throw new ConvexError({
        message: "Alışkanlık bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_habit", (q) => q.eq("habitId", args.habitId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    const completedCount = logs.filter((l) => l.completed).length;
    const totalDays = logs.length;
    const completionRate = totalDays > 0 ? (completedCount / totalDays) * 100 : 0;

    return {
      totalDays,
      completedCount,
      missedCount: totalDays - completedCount,
      completionRate,
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
    };
  },
});
