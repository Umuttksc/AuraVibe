import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Get notifications for current user
export const getNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      return [];
    }

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .take(50);

    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notification) => {
        const actor = await ctx.db.get(notification.actorId);
        if (!actor) return null;

        const actorProfilePictureUrl = actor.profilePicture
          ? await ctx.storage.getUrl(actor.profilePicture)
          : null;

        let post = null;
        if (notification.postId) {
          const postData = await ctx.db.get(notification.postId);
          if (postData) {
            const postImageUrl = postData.imageId
              ? await ctx.storage.getUrl(postData.imageId)
              : null;
            post = {
              _id: postData._id,
              content: postData.content,
              imageUrl: postImageUrl,
            };
          }
        }

        let comment = null;
        if (notification.commentId) {
          const commentData = await ctx.db.get(notification.commentId);
          if (commentData) {
            comment = {
              _id: commentData._id,
              content: commentData.content,
            };
          }
        }

        return {
          _id: notification._id,
          type: notification.type,
          actor: {
            _id: actor._id,
            username: actor.username || actor.name || "User",
            profilePictureUrl: actorProfilePictureUrl,
          },
          post,
          comment,
          isRead: notification.isRead,
          createdAt: new Date(notification._creationTime).toISOString(),
        };
      }),
    );

    return notificationsWithDetails.filter((n) => n !== null);
  },
});

// Get unread notification count
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return 0;
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      return 0;
    }

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unreadNotifications.length;
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) {
      return;
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
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

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    for (const notification of unreadNotifications) {
      await ctx.db.patch(notification._id, {
        isRead: true,
      });
    }
  },
});
