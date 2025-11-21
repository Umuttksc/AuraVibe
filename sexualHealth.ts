import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get sexual health articles filtered by user's gender
export const getArticles = query({
  args: {},
  handler: async (ctx) => {
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

    const userGender = user.gender || "other";

    // Get all published articles
    const allArticles = await ctx.db
      .query("sexualHealthArticles")
      .collect();

    // Filter by target gender and published status
    const filteredArticles = allArticles
      .filter((article) => {
        if (!article.isPublished) return false;
        if (article.targetGender === "all") return true;
        if (article.targetGender === userGender) return true;
        return false;
      })
      .sort((a, b) => a.order - b.order);

    return filteredArticles;
  },
});

// Get article by ID
export const getArticleById = query({
  args: { articleId: v.id("sexualHealthArticles") },
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

    const article = await ctx.db.get(args.articleId);

    if (!article) {
      throw new ConvexError({
        message: "Makale bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Check if user has access to this article
    const userGender = user.gender || "other";
    if (
      article.targetGender !== "all" &&
      article.targetGender !== userGender
    ) {
      throw new ConvexError({
        message: "Bu makaleye erişim yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    return article;
  },
});

// Get checkup reminders for current user
export const getCheckupReminders = query({
  args: {},
  handler: async (ctx) => {
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

    const reminders = await ctx.db
      .query("healthCheckupReminders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Filter reminders based on gender
    const userGender = user.gender || "other";
    const filteredReminders = reminders.filter((reminder) => {
      if (
        reminder.checkupType === "gynecology" ||
        reminder.checkupType === "breast_exam"
      ) {
        return userGender === "female";
      }
      return true;
    });

    return filteredReminders;
  },
});

// Update or create checkup reminder
export const updateCheckupReminder = mutation({
  args: {
    checkupType: v.union(
      v.literal("gynecology"),
      v.literal("sti_screening"),
      v.literal("breast_exam"),
      v.literal("general_health")
    ),
    lastCheckupDate: v.optional(v.string()),
    nextCheckupDate: v.optional(v.string()),
    reminderEnabled: v.boolean(),
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

    // Check gender restrictions
    const userGender = user.gender || "other";
    if (
      (args.checkupType === "gynecology" ||
        args.checkupType === "breast_exam") &&
      userGender !== "female"
    ) {
      throw new ConvexError({
        message: "Bu kontrol türüne erişim yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    // Check if reminder already exists
    const existing = await ctx.db
      .query("healthCheckupReminders")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", user._id).eq("checkupType", args.checkupType)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastCheckupDate: args.lastCheckupDate,
        nextCheckupDate: args.nextCheckupDate,
        reminderEnabled: args.reminderEnabled,
      });
      return existing._id;
    } else {
      const reminderId = await ctx.db.insert("healthCheckupReminders", {
        userId: user._id,
        checkupType: args.checkupType,
        lastCheckupDate: args.lastCheckupDate,
        nextCheckupDate: args.nextCheckupDate,
        reminderEnabled: args.reminderEnabled,
      });
      return reminderId;
    }
  },
});
