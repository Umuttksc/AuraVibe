import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// Get or create a conversation between two users
export const getOrCreateConversation = mutation({
  args: {
    otherUserId: v.id("users"),
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

    // Can't message yourself
    if (currentUser._id === args.otherUserId) {
      throw new ConvexError({
        message: "Cannot message yourself",
        code: "BAD_REQUEST",
      });
    }

    // Check if conversation already exists (in either direction)
    const existingConversation1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) =>
        q.eq("participant1Id", currentUser._id),
      )
      .filter((q) => q.eq(q.field("participant2Id"), args.otherUserId))
      .unique();

    if (existingConversation1) {
      return existingConversation1._id;
    }

    const existingConversation2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) =>
        q.eq("participant1Id", args.otherUserId),
      )
      .filter((q) => q.eq(q.field("participant2Id"), currentUser._id))
      .unique();

    if (existingConversation2) {
      return existingConversation2._id;
    }

    // Create new conversation
    const conversationId = await ctx.db.insert("conversations", {
      participant1Id: currentUser._id,
      participant2Id: args.otherUserId,
    });

    return conversationId;
  },
});

// Send a message
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"), v.literal("audio"))),
    audioId: v.optional(v.id("_storage")),
    audioDuration: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
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

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new ConvexError({
        message: "Conversation not found",
        code: "NOT_FOUND",
      });
    }

    // Verify user is part of conversation
    if (
      conversation.participant1Id !== currentUser._id &&
      conversation.participant2Id !== currentUser._id
    ) {
      throw new ConvexError({
        message: "You are not part of this conversation",
        code: "FORBIDDEN",
      });
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content: args.content,
      isRead: false,
      imageId: args.imageId,
      mediaType: args.mediaType,
      audioId: args.audioId,
      audioDuration: args.audioDuration,
      isAnonymous: args.isAnonymous,
    });

    // Update conversation last message
    const lastMessageContent = args.audioId ? "🎤 Sesli mesaj" : args.content;
    await ctx.db.patch(args.conversationId, {
      lastMessageContent,
      lastMessageAt: Date.now(),
      lastMessageSenderId: currentUser._id,
    });

    return messageId;
  },
});

// Get all conversations for current user
export const getConversations = query({
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

    // Get conversations where user is participant1
    const conversations1 = await ctx.db
      .query("conversations")
      .withIndex("by_participant1", (q) =>
        q.eq("participant1Id", currentUser._id),
      )
      .collect();

    // Get conversations where user is participant2
    const conversations2 = await ctx.db
      .query("conversations")
      .withIndex("by_participant2", (q) =>
        q.eq("participant2Id", currentUser._id),
      )
      .collect();

    const allConversations = [...conversations1, ...conversations2];

    // Get other user info and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      allConversations.map(async (conv) => {
        const otherUserId =
          conv.participant1Id === currentUser._id
            ? conv.participant2Id
            : conv.participant1Id;

        const otherUser = await ctx.db.get(otherUserId);
        if (!otherUser) return null;

        const profilePictureUrl = otherUser.profilePicture
          ? await ctx.storage.getUrl(otherUser.profilePicture)
          : null;

        // Count unread messages
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conv._id),
          )
          .filter((q) =>
            q.and(
              q.eq(q.field("isRead"), false),
              q.neq(q.field("senderId"), currentUser._id),
            ),
          )
          .collect();

        const unreadCount = messages.length;

        return {
          _id: conv._id,
          otherUser: {
            _id: otherUser._id,
            username: otherUser.username || otherUser.name || "User",
            profilePictureUrl,
          },
          lastMessage: conv.lastMessageContent,
          lastMessageAt: conv.lastMessageAt
            ? new Date(conv.lastMessageAt).toISOString()
            : null,
          isLastMessageFromMe: conv.lastMessageSenderId === currentUser._id,
          unreadCount,
        };
      }),
    );

    // Filter out null values and sort by last message time
    const validConversations = conversationsWithDetails.filter(
      (c) => c !== null,
    );

    validConversations.sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return (
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime()
      );
    });

    return validConversations;
  },
});

// Get messages for a conversation
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
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

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new ConvexError({
        message: "Conversation not found",
        code: "NOT_FOUND",
      });
    }

    // Verify user is part of conversation
    if (
      conversation.participant1Id !== currentUser._id &&
      conversation.participant2Id !== currentUser._id
    ) {
      throw new ConvexError({
        message: "You are not part of this conversation",
        code: "FORBIDDEN",
      });
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();

    const messagesWithDetails = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        const imageUrl = msg.imageId
          ? await ctx.storage.getUrl(msg.imageId)
          : null;
        const audioUrl = msg.audioId
          ? await ctx.storage.getUrl(msg.audioId)
          : null;

        // If message is anonymous and not from current user, hide sender info
        const senderUsername = msg.isAnonymous && msg.senderId !== currentUser._id
          ? "Anonim Kullanıcı"
          : (sender?.username || sender?.name || "User");

        // Get gift details if message has a gift
        let giftDetails = null;
        if (msg.giftId) {
          const gift = await ctx.db.get(msg.giftId);
          if (gift) {
            giftDetails = {
              _id: gift._id,
              name: gift.name,
              imageUrl: gift.imageUrl,
              isPremium: gift.isPremium,
              animationType: gift.animationType,
            };
          }
        }

        return {
          _id: msg._id,
          content: msg.content,
          senderId: msg.senderId,
          senderUsername,
          isRead: msg.isRead,
          imageUrl,
          audioUrl,
          audioDuration: msg.audioDuration,
          mediaType: msg.mediaType,
          isAnonymous: msg.isAnonymous,
          giftDetails,
          createdAt: new Date(msg._creationTime).toISOString(),
          isFromMe: msg.senderId === currentUser._id,
        };
      }),
    );

    return messagesWithDetails;
  },
});

// Mark messages as read
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
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

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      return;
    }

    // Mark all unread messages from other user as read
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isRead"), false),
          q.neq(q.field("senderId"), currentUser._id),
        ),
      )
      .collect();

    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, { isRead: true });
    }
  },
});

// Generate upload URL for message image
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Search users to start a conversation
export const searchUsers = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
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

    if (!args.searchTerm || args.searchTerm.trim() === "") {
      return [];
    }

    const searchLower = args.searchTerm.toLowerCase();

    // Get all users and filter
    const allUsers = await ctx.db.query("users").collect();
    
    const filteredUsers = allUsers.filter((user) => {
      if (user._id === currentUser._id) return false;
      
      const username = (user.username || "").toLowerCase();
      const name = (user.name || "").toLowerCase();
      
      return username.includes(searchLower) || name.includes(searchLower);
    });

    // Take first 10 results
    const results = filteredUsers.slice(0, 10);

    const usersWithDetails = await Promise.all(
      results.map(async (user) => {
        const profilePictureUrl = user.profilePicture
          ? await ctx.storage.getUrl(user.profilePicture)
          : null;

        return {
          _id: user._id,
          username: user.username || user.name || "User",
          name: user.name,
          profilePictureUrl,
        };
      }),
    );

    return usersWithDetails;
  },
});
