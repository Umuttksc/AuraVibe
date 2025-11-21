import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Log sleep for a specific date
export const logSleep = mutation({
  args: {
    date: v.string(),
    bedTime: v.string(),
    wakeTime: v.string(),
    duration: v.number(),
    quality: v.number(),
    feelingOnWaking: v.optional(
      v.union(
        v.literal("refreshed"),
        v.literal("tired"),
        v.literal("groggy"),
        v.literal("energetic")
      )
    ),
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

    // Check if sleep already logged for this date
    const existing = await ctx.db
      .query("sleepTracking")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Update existing sleep log
      await ctx.db.patch(existing._id, {
        bedTime: args.bedTime,
        wakeTime: args.wakeTime,
        duration: args.duration,
        quality: args.quality,
        feelingOnWaking: args.feelingOnWaking,
        notes: args.notes,
      });
      return existing._id;
    } else {
      // Create new sleep log
      return await ctx.db.insert("sleepTracking", {
        userId: user._id,
        date: args.date,
        bedTime: args.bedTime,
        wakeTime: args.wakeTime,
        duration: args.duration,
        quality: args.quality,
        feelingOnWaking: args.feelingOnWaking,
        notes: args.notes,
      });
    }
  },
});

// Get sleep logs for a date range
export const getSleepLogs = query({
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
      .query("sleepTracking")
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

// Get sleep statistics
export const getSleepStats = query({
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
      .query("sleepTracking")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    if (logs.length === 0) {
      return {
        totalLogs: 0,
        averageDuration: 0,
        averageQuality: 0,
        totalSleepHours: 0,
      };
    }

    const totalDuration = logs.reduce((sum, log) => sum + log.duration, 0);
    const totalQuality = logs.reduce((sum, log) => sum + log.quality, 0);

    return {
      totalLogs: logs.length,
      averageDuration: totalDuration / logs.length,
      averageQuality: totalQuality / logs.length,
      totalSleepHours: totalDuration / 60,
    };
  },
});

// Delete sleep log
export const deleteSleepLog = mutation({
  args: {
    logId: v.id("sleepTracking"),
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
