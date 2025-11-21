import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get military service for current user
export const getMilitaryService = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmanız gerekiyor",
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

    // Check if user is male
    if (user.gender !== "male") {
      throw new ConvexError({
        message: "Bu özellik sadece erkek kullanıcılar için",
        code: "FORBIDDEN",
      });
    }

    const militaryService = await ctx.db
      .query("militaryService")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return militaryService;
  },
});

// Create or update military service
export const saveMilitaryService = mutation({
  args: {
    startDate: v.string(),
    durationDays: v.number(),
    unit: v.optional(v.string()),
    branch: v.optional(v.string()),
    rank: v.optional(v.string()),
    notes: v.optional(v.string()),
    totalRoadRights: v.number(), // Based on distance
    // Initial values (if any exist from before)
    initialRestDays: v.optional(v.number()),
    initialDesertion: v.optional(v.number()),
    initialPunishment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmanız gerekiyor",
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

    // Check if user is male
    if (user.gender !== "male") {
      throw new ConvexError({
        message: "Bu özellik sadece erkek kullanıcılar için",
        code: "FORBIDDEN",
      });
    }

    // Check if military service already exists
    const existing = await ctx.db
      .query("militaryService")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      // Update existing
      await ctx.db.patch(existing._id, {
        startDate: args.startDate,
        durationDays: args.durationDays,
        unit: args.unit,
        branch: args.branch,
        rank: args.rank,
        notes: args.notes,
        totalRoadRights: args.totalRoadRights,
        usedRestDays: args.initialRestDays ?? existing.usedRestDays,
        totalDesertion: args.initialDesertion ?? existing.totalDesertion,
        totalPunishment: args.initialPunishment ?? existing.totalPunishment,
      });
      return existing._id;
    } else {
      // Create new
      const militaryServiceId = await ctx.db.insert("militaryService", {
        userId: user._id,
        startDate: args.startDate,
        durationDays: args.durationDays,
        unit: args.unit,
        branch: args.branch,
        rank: args.rank,
        notes: args.notes,
        totalLeaveRights: 6, // Fixed 6 days
        totalRoadRights: args.totalRoadRights,
        totalRestRights: 6, // Fixed 6 days
        usedLeaveDays: 0,
        usedRoadDays: 0,
        usedRestDays: args.initialRestDays ?? 0,
        totalDesertion: args.initialDesertion ?? 0,
        totalPunishment: args.initialPunishment ?? 0,
      });
      return militaryServiceId;
    }
  },
});

// Delete military service
export const deleteMilitaryService = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmanız gerekiyor",
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

    const militaryService = await ctx.db
      .query("militaryService")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (militaryService) {
      // Delete all events first
      const events = await ctx.db
        .query("militaryEvents")
        .withIndex("by_military_service", (q) => q.eq("militaryServiceId", militaryService._id))
        .collect();

      for (const event of events) {
        await ctx.db.delete(event._id);
      }

      // Delete military service
      await ctx.db.delete(militaryService._id);
    }
  },
});

// Get events for current user
export const getEvents = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmanız gerekiyor",
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

    const militaryService = await ctx.db
      .query("militaryService")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!militaryService) {
      return [];
    }

    const events = await ctx.db
      .query("militaryEvents")
      .withIndex("by_military_service", (q) => q.eq("militaryServiceId", militaryService._id))
      .order("desc")
      .collect();

    return events;
  },
});

// Add event (leave, road, rest, desertion, punishment, rollcall)
export const addEvent = mutation({
  args: {
    date: v.string(),
    type: v.union(
      v.literal("leave"),
      v.literal("road"),
      v.literal("rest"),
      v.literal("desertion"),
      v.literal("punishment"),
      v.literal("rollcall")
    ),
    days: v.optional(v.number()),
    rollcallType: v.optional(v.union(v.literal("morning"), v.literal("evening"), v.literal("special"))),
    rollcallStatus: v.optional(v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("excused")
    )),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmanız gerekiyor",
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

    const militaryService = await ctx.db
      .query("militaryService")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!militaryService) {
      throw new ConvexError({
        message: "Önce askerlik bilgilerinizi kaydedin",
        code: "NOT_FOUND",
      });
    }

    // Note: We don't check if enough rights remain - user can exceed their rights (tecavüz)

    // Add event
    const eventId = await ctx.db.insert("militaryEvents", {
      militaryServiceId: militaryService._id,
      userId: user._id,
      date: args.date,
      type: args.type,
      days: args.days,
      rollcallType: args.rollcallType,
      rollcallStatus: args.rollcallStatus,
      notes: args.notes,
    });

    // Update used days
    if (args.type === "leave") {
      await ctx.db.patch(militaryService._id, {
        usedLeaveDays: militaryService.usedLeaveDays + (args.days || 0),
      });
    } else if (args.type === "road") {
      await ctx.db.patch(militaryService._id, {
        usedRoadDays: militaryService.usedRoadDays + (args.days || 0),
      });
    } else if (args.type === "rest") {
      await ctx.db.patch(militaryService._id, {
        usedRestDays: militaryService.usedRestDays + (args.days || 0),
      });
    } else if (args.type === "desertion") {
      await ctx.db.patch(militaryService._id, {
        totalDesertion: militaryService.totalDesertion + (args.days || 0),
      });
    } else if (args.type === "punishment") {
      await ctx.db.patch(militaryService._id, {
        totalPunishment: militaryService.totalPunishment + (args.days || 0),
      });
    }

    return eventId;
  },
});

// Delete event
export const deleteEvent = mutation({
  args: {
    eventId: v.id("militaryEvents"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmanız gerekiyor",
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

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new ConvexError({
        message: "Kayıt bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Verify ownership
    if (event.userId !== user._id) {
      throw new ConvexError({
        message: "Bu kaydı silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    const militaryService = await ctx.db.get(event.militaryServiceId);
    if (!militaryService) {
      throw new ConvexError({
        message: "Askerlik kaydı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Update used days
    if (event.type === "leave") {
      await ctx.db.patch(militaryService._id, {
        usedLeaveDays: Math.max(0, militaryService.usedLeaveDays - (event.days || 0)),
      });
    } else if (event.type === "road") {
      await ctx.db.patch(militaryService._id, {
        usedRoadDays: Math.max(0, militaryService.usedRoadDays - (event.days || 0)),
      });
    } else if (event.type === "rest") {
      await ctx.db.patch(militaryService._id, {
        usedRestDays: Math.max(0, militaryService.usedRestDays - (event.days || 0)),
      });
    } else if (event.type === "desertion") {
      await ctx.db.patch(militaryService._id, {
        totalDesertion: Math.max(0, militaryService.totalDesertion - (event.days || 0)),
      });
    } else if (event.type === "punishment") {
      await ctx.db.patch(militaryService._id, {
        totalPunishment: Math.max(0, militaryService.totalPunishment - (event.days || 0)),
      });
    }

    await ctx.db.delete(args.eventId);
  },
});
