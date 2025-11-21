import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Send a reply to a story
export const sendReply = mutation({
  args: {
    storyId: v.id("stories"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const story = await ctx.db.get(args.storyId);
    if (!story) {
      throw new ConvexError({
        message: "Story not found",
        code: "NOT_FOUND",
      });
    }

    // Check if story has expired
    if (story.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Story has expired",
        code: "NOT_FOUND",
      });
    }

    // Create reply
    const replyId = await ctx.db.insert("storyReplies", {
      storyId: args.storyId,
      senderId: user._id,
      content: args.content,
    });

    // Update reply count
    const currentReplyCount = story.replyCount || 0;
    await ctx.db.patch(args.storyId, {
      replyCount: currentReplyCount + 1,
    });

    // Get or create conversation with story author for DM
    const storyAuthor = await ctx.db.get(story.authorId);
    if (!storyAuthor) {
      throw new ConvexError({
        message: "Story author not found",
        code: "NOT_FOUND",
      });
    }

    // Don't send to self
    if (story.authorId !== user._id) {
      // Find existing conversation
      let conversation = await ctx.db
        .query("conversations")
        .withIndex("by_participant1", (q) => q.eq("participant1Id", user._id))
        .filter((q) => q.eq(q.field("participant2Id"), story.authorId))
        .unique();

      if (!conversation) {
        conversation = await ctx.db
          .query("conversations")
          .withIndex("by_participant2", (q) => q.eq("participant2Id", user._id))
          .filter((q) => q.eq(q.field("participant1Id"), story.authorId))
          .unique();
      }

      // Create conversation if doesn't exist
      if (!conversation) {
        const conversationId = await ctx.db.insert("conversations", {
          participant1Id: user._id,
          participant2Id: story.authorId,
          lastMessageContent: args.content,
          lastMessageAt: Date.now(),
          lastMessageSenderId: user._id,
        });
        conversation = await ctx.db.get(conversationId);
      }

      if (conversation) {
        // Send the reply as a message
        await ctx.db.insert("messages", {
          conversationId: conversation._id,
          senderId: user._id,
          content: `Hikayene yanıt: ${args.content}`,
          isRead: false,
        });

        // Update conversation
        await ctx.db.patch(conversation._id, {
          lastMessageContent: args.content,
          lastMessageAt: Date.now(),
          lastMessageSenderId: user._id,
        });
      }
    }

    return replyId;
  },
});

// Get replies for a story (only for story author)
export const getReplies = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const story = await ctx.db.get(args.storyId);
    if (!story) {
      throw new ConvexError({
        message: "Story not found",
        code: "NOT_FOUND",
      });
    }

    // Only author can see replies
    if (story.authorId !== user._id) {
      throw new ConvexError({
        message: "You can only view replies to your own stories",
        code: "FORBIDDEN",
      });
    }

    const replies = await ctx.db
      .query("storyReplies")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .order("desc")
      .collect();

    const repliesWithSender = await Promise.all(
      replies.map(async (reply) => {
        const sender = await ctx.db.get(reply.senderId);
        if (!sender) return null;

        const profilePictureUrl = sender.profilePicture
          ? await ctx.storage.getUrl(sender.profilePicture)
          : null;

        return {
          _id: reply._id,
          content: reply.content,
          sender: {
            _id: sender._id,
            username: sender.username || sender.name || "User",
            profilePictureUrl,
          },
          createdAt: new Date(reply._creationTime).toISOString(),
        };
      }),
    );

    return repliesWithSender.filter((r) => r !== null);
  },
});

// Add a reaction to a story
export const addReaction = mutation({
  args: {
    storyId: v.id("stories"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const story = await ctx.db.get(args.storyId);
    if (!story) {
      throw new ConvexError({
        message: "Story not found",
        code: "NOT_FOUND",
      });
    }

    // Check if story has expired
    if (story.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Story has expired",
        code: "NOT_FOUND",
      });
    }

    // Check if already reacted
    const existingReaction = await ctx.db
      .query("storyReactions")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", args.storyId).eq("userId", user._id),
      )
      .unique();

    if (existingReaction) {
      // Update existing reaction
      await ctx.db.patch(existingReaction._id, {
        emoji: args.emoji,
      });
    } else {
      // Add new reaction
      await ctx.db.insert("storyReactions", {
        storyId: args.storyId,
        userId: user._id,
        emoji: args.emoji,
      });

      // Update reaction count
      const currentReactionCount = story.reactionCount || 0;
      await ctx.db.patch(args.storyId, {
        reactionCount: currentReactionCount + 1,
      });
    }
  },
});

// Get reactions for a story
export const getReactions = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const reactions = await ctx.db
      .query("storyReactions")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    // Group by emoji
    const emojiCounts: Record<string, number> = {};
    for (const reaction of reactions) {
      emojiCounts[reaction.emoji] = (emojiCounts[reaction.emoji] || 0) + 1;
    }

    return Object.entries(emojiCounts).map(([emoji, count]) => ({
      emoji,
      count,
    }));
  },
});

// Check if current user has reacted to a story
export const hasReacted = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null;
    }

    const reaction = await ctx.db
      .query("storyReactions")
      .withIndex("by_story_and_user", (q) =>
        q.eq("storyId", args.storyId).eq("userId", user._id),
      )
      .unique();

    return reaction ? reaction.emoji : null;
  },
});
