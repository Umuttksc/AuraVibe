import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Create a new medication
export const createMedication = mutation({
  args: {
    name: v.string(),
    dosage: v.string(),
    frequency: v.string(),
    times: v.array(v.string()),
    startDate: v.string(),
    endDate: v.optional(v.string()),
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

    return await ctx.db.insert("medications", {
      userId: user._id,
      name: args.name,
      dosage: args.dosage,
      frequency: args.frequency,
      times: args.times,
      startDate: args.startDate,
      endDate: args.endDate,
      notes: args.notes,
      isActive: true,
    });
  },
});

// Get user's medications
export const getMedications = query({
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

    let medications = await ctx.db
      .query("medications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    if (!args.includeInactive) {
      medications = medications.filter((m) => m.isActive);
    }

    return medications;
  },
});

// Update medication
export const updateMedication = mutation({
  args: {
    medicationId: v.id("medications"),
    name: v.optional(v.string()),
    dosage: v.optional(v.string()),
    frequency: v.optional(v.string()),
    times: v.optional(v.array(v.string())),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    notes: v.optional(v.string()),
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

    const medication = await ctx.db.get(args.medicationId);
    if (!medication) {
      throw new ConvexError({
        message: "İlaç bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || medication.userId !== user._id) {
      throw new ConvexError({
        message: "Bu ilacı düzenleme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.dosage !== undefined) updates.dosage = args.dosage;
    if (args.frequency !== undefined) updates.frequency = args.frequency;
    if (args.times !== undefined) updates.times = args.times;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    await ctx.db.patch(args.medicationId, updates);
  },
});

// Delete medication
export const deleteMedication = mutation({
  args: {
    medicationId: v.id("medications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const medication = await ctx.db.get(args.medicationId);
    if (!medication) {
      throw new ConvexError({
        message: "İlaç bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || medication.userId !== user._id) {
      throw new ConvexError({
        message: "Bu ilacı silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    // Delete all logs for this medication
    const logs = await ctx.db
      .query("medicationLogs")
      .withIndex("by_medication", (q) => q.eq("medicationId", args.medicationId))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(args.medicationId);
  },
});

// Log medication intake
export const logMedicationIntake = mutation({
  args: {
    medicationId: v.id("medications"),
    date: v.string(),
    scheduledTime: v.string(),
    status: v.union(
      v.literal("taken"),
      v.literal("missed"),
      v.literal("skipped")
    ),
    takenAt: v.optional(v.number()),
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

    const medication = await ctx.db.get(args.medicationId);
    if (!medication) {
      throw new ConvexError({
        message: "İlaç bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || medication.userId !== user._id) {
      throw new ConvexError({
        message: "Bu ilacı güncelleme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    return await ctx.db.insert("medicationLogs", {
      userId: user._id,
      medicationId: args.medicationId,
      date: args.date,
      scheduledTime: args.scheduledTime,
      status: args.status,
      takenAt: args.takenAt || Date.now(),
      notes: args.notes,
    });
  },
});

// Get medication logs for a date range
export const getMedicationLogs = query({
  args: {
    medicationId: v.optional(v.id("medications")),
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

    let query = ctx.db
      .query("medicationLogs")
      .withIndex("by_user", (q) => q.eq("userId", user._id));

    if (args.medicationId) {
      const allLogs = await query.collect();
      const filtered = allLogs.filter(
        (log) =>
          log.medicationId === args.medicationId &&
          log.date >= args.startDate &&
          log.date <= args.endDate
      );
      return filtered;
    }

    const logs = await query
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

// Get medication adherence statistics
export const getMedicationStats = query({
  args: {
    medicationId: v.id("medications"),
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
      .query("medicationLogs")
      .withIndex("by_medication", (q) => q.eq("medicationId", args.medicationId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    const takenCount = logs.filter((l) => l.status === "taken").length;
    const missedCount = logs.filter((l) => l.status === "missed").length;
    const skippedCount = logs.filter((l) => l.status === "skipped").length;
    const totalScheduled = logs.length;

    const adherenceRate =
      totalScheduled > 0 ? (takenCount / totalScheduled) * 100 : 0;

    return {
      totalScheduled,
      takenCount,
      missedCount,
      skippedCount,
      adherenceRate,
    };
  },
});
