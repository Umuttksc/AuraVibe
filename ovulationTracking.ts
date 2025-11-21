import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get ovulation tracking data for a specific month
export const getOvulationData = query({
  args: {
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    // Only allow female users
    if (user.gender !== "female") {
      throw new ConvexError({
        message: "Bu özelliğe sadece kadın kullanıcılar erişebilir",
        code: "FORBIDDEN",
      });
    }

    // Get all tracking data for the user
    const allData = await ctx.db
      .query("ovulationTracking")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter by month and year
    const filteredData = allData.filter((entry) => {
      const date = new Date(entry.date);
      return (
        date.getFullYear() === args.year && date.getMonth() === args.month - 1
      );
    });

    return filteredData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },
});

// Add or update ovulation tracking entry
export const addOrUpdateEntry = mutation({
  args: {
    date: v.string(),
    cervicalMucus: v.optional(
      v.union(
        v.literal("dry"),
        v.literal("sticky"),
        v.literal("creamy"),
        v.literal("watery"),
        v.literal("egg_white")
      )
    ),
    basalBodyTemperature: v.optional(v.number()),
    ovulationTestResult: v.optional(
      v.union(v.literal("negative"), v.literal("positive"))
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmalısınız",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Only allow female users
    if (user.gender !== "female") {
      throw new ConvexError({
        message: "Bu özelliğe sadece kadın kullanıcılar erişebilir",
        code: "FORBIDDEN",
      });
    }

    // Check if entry for this date already exists
    const existing = await ctx.db
      .query("ovulationTracking")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        cervicalMucus: args.cervicalMucus,
        basalBodyTemperature: args.basalBodyTemperature,
        ovulationTestResult: args.ovulationTestResult,
        notes: args.notes,
      });
      return existing._id;
    } else {
      const entryId = await ctx.db.insert("ovulationTracking", {
        userId: user._id,
        date: args.date,
        cervicalMucus: args.cervicalMucus,
        basalBodyTemperature: args.basalBodyTemperature,
        ovulationTestResult: args.ovulationTestResult,
        notes: args.notes,
      });
      return entryId;
    }
  },
});

// Delete ovulation tracking entry
export const deleteEntry = mutation({
  args: { entryId: v.id("ovulationTracking") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmalısınız",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new ConvexError({
        message: "Kayıt bulunamadı",
        code: "NOT_FOUND",
      });
    }

    if (entry.userId !== user._id) {
      throw new ConvexError({
        message: "Bu kaydı silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.entryId);
  },
});

// Get fertility prediction based on cycle data
export const getFertilityPrediction = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.gender !== "female") {
      return null;
    }

    // Get recent menstrual cycles
    const cycles = await ctx.db
      .query("menstrualCycles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(3);

    if (cycles.length === 0) {
      return null;
    }

    // Calculate average cycle length
    const completedCycles = cycles.filter((c) => c.cycleLength);
    if (completedCycles.length === 0) {
      return null;
    }

    const avgCycleLength =
      completedCycles.reduce((sum, c) => sum + (c.cycleLength || 0), 0) /
      completedCycles.length;

    const lastCycle = cycles[0];
    const lastPeriodStart = new Date(lastCycle.startDate);

    // Estimate ovulation day (typically 14 days before next period)
    const ovulationDay = Math.round(avgCycleLength - 14);
    const estimatedOvulation = new Date(lastPeriodStart);
    estimatedOvulation.setDate(estimatedOvulation.getDate() + ovulationDay);

    // Fertile window is typically 5 days before ovulation to 1 day after
    const fertileWindowStart = new Date(estimatedOvulation);
    fertileWindowStart.setDate(fertileWindowStart.getDate() - 5);

    const fertileWindowEnd = new Date(estimatedOvulation);
    fertileWindowEnd.setDate(fertileWindowEnd.getDate() + 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isCurrentlyFertile =
      today >= fertileWindowStart && today <= fertileWindowEnd;

    return {
      avgCycleLength: Math.round(avgCycleLength),
      estimatedOvulationDate: estimatedOvulation.toISOString().split("T")[0],
      fertileWindowStart: fertileWindowStart.toISOString().split("T")[0],
      fertileWindowEnd: fertileWindowEnd.toISOString().split("T")[0],
      isCurrentlyFertile,
      daysUntilOvulation: Math.ceil(
        (estimatedOvulation.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      ),
    };
  },
});
