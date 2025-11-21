import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Log mood for a specific date
export const logMood = mutation({
  args: {
    date: v.string(),
    mood: v.union(
      v.literal("very_happy"),
      v.literal("happy"),
      v.literal("neutral"),
      v.literal("sad"),
      v.literal("very_sad"),
      v.literal("anxious"),
      v.literal("stressed"),
      v.literal("calm"),
      v.literal("energetic"),
      v.literal("tired")
    ),
    intensity: v.number(),
    triggers: v.optional(v.array(v.string())),
    activities: v.optional(v.array(v.string())),
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

    // Check if mood already logged for this date
    const existing = await ctx.db
      .query("moodTracking")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing mood log
      await ctx.db.patch(existing._id, {
        mood: args.mood,
        intensity: args.intensity,
        triggers: args.triggers,
        activities: args.activities,
        notes: args.notes,
      });
      return existing._id;
    } else {
      // Create new mood log
      return await ctx.db.insert("moodTracking", {
        userId: user._id,
        date: args.date,
        mood: args.mood,
        intensity: args.intensity,
        triggers: args.triggers,
        activities: args.activities,
        notes: args.notes,
      });
    }
  },
});

// Get mood logs for a date range
export const getMoodLogs = query({
  args: {
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

    const logs = await ctx.db
      .query("moodTracking")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .order("desc")
      .collect();

    return logs;
  },
});

// Get mood statistics
export const getMoodStats = query({
  args: {
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

    const logs = await ctx.db
      .query("moodTracking")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    // Calculate statistics
    const moodCounts: Record<string, number> = {};
    let totalIntensity = 0;

    logs.forEach((log) => {
      moodCounts[log.mood] = (moodCounts[log.mood] || 0) + 1;
      totalIntensity += log.intensity;
    });

    const mostCommonMood = Object.entries(moodCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    return {
      totalLogs: logs.length,
      averageIntensity: logs.length > 0 ? totalIntensity / logs.length : 0,
      moodDistribution: moodCounts,
      mostCommonMood,
    };
  },
});

// Delete mood log
export const deleteMoodLog = mutation({
  args: {
    logId: v.id("moodTracking"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const log = await ctx.db.get(args.logId);
    if (!log) {
      throw new ConvexError({
        message: "Kayıt bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || log.userId !== user._id) {
      throw new ConvexError({
        message: "Bu kaydı silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.logId);
  },
});
