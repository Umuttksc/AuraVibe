import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Log a symptom
export const logSymptom = mutation({
  args: {
    date: v.string(),
    symptomName: v.string(),
    severity: v.number(),
    bodyPart: v.optional(v.string()),
    triggers: v.optional(v.array(v.string())),
    duration: v.optional(v.string()),
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

    return await ctx.db.insert("symptoms", {
      userId: user._id,
      date: args.date,
      symptomName: args.symptomName,
      severity: args.severity,
      bodyPart: args.bodyPart,
      triggers: args.triggers,
      duration: args.duration,
      notes: args.notes,
    });
  },
});

// Get symptom logs for a date range
export const getSymptoms = query({
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

    const symptoms = await ctx.db
      .query("symptoms")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .order("desc")
      .collect();

    return symptoms;
  },
});

// Get symptom statistics
export const getSymptomStats = query({
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

    const symptoms = await ctx.db
      .query("symptoms")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate),
          q.lte(q.field("date"), args.endDate)
        )
      )
      .collect();

    // Count symptoms by name
    const symptomCounts: Record<string, number> = {};
    const symptomSeverities: Record<string, number[]> = {};

    symptoms.forEach((symptom) => {
      symptomCounts[symptom.symptomName] =
        (symptomCounts[symptom.symptomName] || 0) + 1;

      if (!symptomSeverities[symptom.symptomName]) {
        symptomSeverities[symptom.symptomName] = [];
      }
      symptomSeverities[symptom.symptomName].push(symptom.severity);
    });

    // Calculate average severity for each symptom
    const averageSeverities: Record<string, number> = {};
    Object.entries(symptomSeverities).forEach(([name, severities]) => {
      averageSeverities[name] =
        severities.reduce((sum, s) => sum + s, 0) / severities.length;
    });

    // Find most common symptom
    const mostCommonSymptom = Object.entries(symptomCounts).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    return {
      totalSymptoms: symptoms.length,
      symptomCounts,
      averageSeverities,
      mostCommonSymptom,
    };
  },
});

// Delete symptom
export const deleteSymptom = mutation({
  args: {
    symptomId: v.id("symptoms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Oturum açmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const symptom = await ctx.db.get(args.symptomId);
    if (!symptom) {
      throw new ConvexError({
        message: "Semptom bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || symptom.userId !== user._id) {
      throw new ConvexError({
        message: "Bu semptomu silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.symptomId);
  },
});

// Update symptom
export const updateSymptom = mutation({
  args: {
    symptomId: v.id("symptoms"),
    symptomName: v.optional(v.string()),
    severity: v.optional(v.number()),
    bodyPart: v.optional(v.string()),
    triggers: v.optional(v.array(v.string())),
    duration: v.optional(v.string()),
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

    const symptom = await ctx.db.get(args.symptomId);
    if (!symptom) {
      throw new ConvexError({
        message: "Semptom bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || symptom.userId !== user._id) {
      throw new ConvexError({
        message: "Bu semptomu düzenleme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    const updates: Record<string, unknown> = {};
    if (args.symptomName !== undefined) updates.symptomName = args.symptomName;
    if (args.severity !== undefined) updates.severity = args.severity;
    if (args.bodyPart !== undefined) updates.bodyPart = args.bodyPart;
    if (args.triggers !== undefined) updates.triggers = args.triggers;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.symptomId, updates);
  },
});
