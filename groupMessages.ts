import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

export const sendGroupMessage = mutation({
  args: {
    communityId: v.id("communities"),
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    replyToId: v.optional(v.id("groupMessages")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if user is a member of the community
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (!membership) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Must be a member to send messages",
      });
    }

    const messageId = await ctx.db.insert("groupMessages", {
      communityId: args.communityId,
      senderId: user._id,
      content: args.content,
      imageId: args.imageId,
      mediaType: args.mediaType,
      replyToId: args.replyToId,
      isDeleted: false,
      isPinned: false,
    });

    // Mark message as read by sender
    await ctx.db.insert("groupMessageReads", {
      messageId,
      userId: user._id,
      communityId: args.communityId,
    });

    return messageId;
  },
});

export const getGroupMessages = query({
  args: { communityId: v.id("communities"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if user is a member of the community
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (!membership) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Must be a member to view messages",
      });
    }

    const messages = await ctx.db
      .query("groupMessages")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .order("desc")
      .paginate(args.paginationOpts);

    const messagesWithDetails = await Promise.all(
      messages.page.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        
        // Get reactions
        const reactions = await ctx.db
          .query("groupMessageReactions")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .collect();

        const reactionCounts = reactions.reduce((acc, r) => {
          acc[r.reaction] = (acc[r.reaction] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const userReaction = reactions.find((r) => r.userId === user._id)?.reaction;

        // Get read receipts count
        const readCount = await ctx.db
          .query("groupMessageReads")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .collect();

        // Get reply info if this is a reply
        let replyTo = null;
        if (message.replyToId) {
          const replyToMessage = await ctx.db.get(message.replyToId);
          if (replyToMessage) {
            const replyToSender = await ctx.db.get(replyToMessage.senderId);
            replyTo = {
              _id: replyToMessage._id,
              content: replyToMessage.content,
              senderName: replyToSender?.name || "Kullanıcı",
            };
          }
        }

        return {
          ...message,
          sender,
          reactionCounts,
          userReaction,
          readCount: readCount.length,
          replyTo,
          createdAt: new Date(message._creationTime).toISOString(),
        };
      })
    );

    return {
      ...messages,
      page: messagesWithDetails.reverse(), // Reverse to show oldest first
    };
  },
});

export const getPinnedMessages = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const messages = await ctx.db
      .query("groupMessages")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .filter((q) => q.eq(q.field("isPinned"), true))
      .collect();

    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender,
          createdAt: new Date(message._creationTime).toISOString(),
        };
      })
    );

    return messagesWithSender;
  },
});

export const toggleReaction = mutation({
  args: {
    messageId: v.id("groupMessages"),
    reaction: v.union(
      v.literal("like"),
      v.literal("love"),
      v.literal("laugh"),
      v.literal("wow"),
      v.literal("sad"),
      v.literal("angry")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if user already reacted with this reaction
    const existingReaction = await ctx.db
      .query("groupMessageReactions")
      .withIndex("by_message_and_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", user._id)
      )
      .first();

    if (existingReaction) {
      if (existingReaction.reaction === args.reaction) {
        // Remove reaction
        await ctx.db.delete(existingReaction._id);
      } else {
        // Update reaction
        await ctx.db.patch(existingReaction._id, {
          reaction: args.reaction,
        });
      }
    } else {
      // Add new reaction
      await ctx.db.insert("groupMessageReactions", {
        messageId: args.messageId,
        userId: user._id,
        reaction: args.reaction,
      });
    }
  },
});

export const markAsRead = mutation({
  args: {
    messageId: v.id("groupMessages"),
    communityId: v.id("communities"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if already marked as read
    const existingRead = await ctx.db
      .query("groupMessageReads")
      .withIndex("by_message_and_user", (q) =>
        q.eq("messageId", args.messageId).eq("userId", user._id)
      )
      .first();

    if (!existingRead) {
      await ctx.db.insert("groupMessageReads", {
        messageId: args.messageId,
        userId: user._id,
        communityId: args.communityId,
      });
    }
  },
});

export const setTyping = mutation({
  args: {
    communityId: v.id("communities"),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .first();

    if (args.isTyping) {
      const expiresAt = Date.now() + 5000; // 5 seconds
      if (existing) {
        await ctx.db.patch(existing._id, { expiresAt });
      } else {
        await ctx.db.insert("typingIndicators", {
          communityId: args.communityId,
          userId: user._id,
          expiresAt,
        });
      }
    } else if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getTypingUsers = query({
  args: { communityId: v.id("communities") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return [];
    }

    const now = Date.now();
    const indicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    // Don't include current user
    const typingUsers = await Promise.all(
      indicators
        .filter((i) => i.userId !== user._id)
        .map(async (indicator) => {
          const typingUser = await ctx.db.get(indicator.userId);
          return typingUser?.name || "Kullanıcı";
        })
    );

    return typingUsers;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("groupMessages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message not found",
      });
    }

    // Check if user is the sender or admin
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", message.communityId).eq("userId", user._id)
      )
      .unique();

    const isAdmin = membership?.role === "admin";
    const isSender = message.senderId === user._id;

    if (!isAdmin && !isSender) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only message sender or admin can delete",
      });
    }

    await ctx.db.patch(args.messageId, { isDeleted: true });
  },
});

export const togglePinMessage = mutation({
  args: {
    messageId: v.id("groupMessages"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Message not found",
      });
    }

    // Check if user is admin
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", message.communityId).eq("userId", user._id)
      )
      .unique();

    if (membership?.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only admins can pin messages",
      });
    }

    await ctx.db.patch(args.messageId, {
      isPinned: !message.isPinned,
    });
  },
});

export const searchMessages = query({
  args: {
    communityId: v.id("communities"),
    searchQuery: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if user is a member
    const membership = await ctx.db
      .query("communityMembers")
      .withIndex("by_community_and_user", (q) =>
        q.eq("communityId", args.communityId).eq("userId", user._id)
      )
      .unique();

    if (!membership) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Must be a member to search messages",
      });
    }

    const messages = await ctx.db
      .query("groupMessages")
      .withIndex("by_community", (q) => q.eq("communityId", args.communityId))
      .filter((q) =>
        q.and(
          q.eq(q.field("isDeleted"), false),
          q.or(
            q.gte(q.field("content"), args.searchQuery.toLowerCase()),
            q.lte(q.field("content"), args.searchQuery.toLowerCase() + "\uffff")
          )
        )
      )
      .take(20);

    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender,
          createdAt: new Date(message._creationTime).toISOString(),
        };
      })
    );

    return messagesWithSender;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    return await ctx.storage.generateUploadUrl();
  },
});
