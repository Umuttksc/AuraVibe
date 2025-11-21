import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get notification preferences for current user
export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .unique();

    // Return default preferences if none exist
    if (!preferences) {
      return {
        likes: true,
        comments: true,
        follows: true,
        mentions: true,
        messages: true,
        stories: true,
        polls: true,
        communities: true,
        pauseAll: false,
        emailNotifications: true,
      };
    }

    return {
      likes: preferences.likes,
      comments: preferences.comments,
      follows: preferences.follows,
      mentions: preferences.mentions,
      messages: preferences.messages,
      stories: preferences.stories,
      polls: preferences.polls,
      communities: preferences.communities,
      pauseAll: preferences.pauseAll,
      emailNotifications: preferences.emailNotifications,
    };
  },
});

// Update notification preferences
export const updatePreferences = mutation({
  args: {
    likes: v.optional(v.boolean()),
    comments: v.optional(v.boolean()),
    follows: v.optional(v.boolean()),
    mentions: v.optional(v.boolean()),
    messages: v.optional(v.boolean()),
    stories: v.optional(v.boolean()),
    polls: v.optional(v.boolean()),
    communities: v.optional(v.boolean()),
    pauseAll: v.optional(v.boolean()),
    emailNotifications: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const existingPreferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .unique();

    if (existingPreferences) {
      // Update existing preferences
      await ctx.db.patch(existingPreferences._id, {
        ...(args.likes !== undefined && { likes: args.likes }),
        ...(args.comments !== undefined && { comments: args.comments }),
        ...(args.follows !== undefined && { follows: args.follows }),
        ...(args.mentions !== undefined && { mentions: args.mentions }),
        ...(args.messages !== undefined && { messages: args.messages }),
        ...(args.stories !== undefined && { stories: args.stories }),
        ...(args.polls !== undefined && { polls: args.polls }),
        ...(args.communities !== undefined && { communities: args.communities }),
        ...(args.pauseAll !== undefined && { pauseAll: args.pauseAll }),
        ...(args.emailNotifications !== undefined && { emailNotifications: args.emailNotifications }),
      });
    } else {
      // Create new preferences
      await ctx.db.insert("notificationPreferences", {
        userId: currentUser._id,
        likes: args.likes ?? true,
        comments: args.comments ?? true,
        follows: args.follows ?? true,
        mentions: args.mentions ?? true,
        messages: args.messages ?? true,
        stories: args.stories ?? true,
        polls: args.polls ?? true,
        communities: args.communities ?? true,
        pauseAll: args.pauseAll ?? false,
        emailNotifications: args.emailNotifications ?? true,
      });
    }
  },
});

// Check if a specific notification type is enabled for a user
export const isNotificationEnabled = query({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("comment"),
      v.literal("follow"),
      v.literal("mention"),
      v.literal("message"),
      v.literal("story"),
      v.literal("poll"),
      v.literal("community"),
    ),
  },
  handler: async (ctx, args) => {
    const preferences = await ctx.db
      .query("notificationPreferences")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    // If no preferences exist, default to enabled
    if (!preferences) {
      return true;
    }

    // If pauseAll is enabled, no notifications
    if (preferences.pauseAll) {
      return false;
    }

    // Check specific type
    const typeMap: Record<string, boolean> = {
      like: preferences.likes,
      comment: preferences.comments,
      follow: preferences.follows,
      mention: preferences.mentions,
      message: preferences.messages,
      story: preferences.stories,
      poll: preferences.polls,
      community: preferences.communities,
    };

    return typeMap[args.type] ?? true;
  },
});
