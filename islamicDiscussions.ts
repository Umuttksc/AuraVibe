import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ConvexError } from "convex/values";

export const getDiscussions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const discussions = await ctx.db
      .query("islamicDiscussions")
      .order("desc")
      .take(args.limit || 20);

    const discussionsWithUser = await Promise.all(
      discussions.map(async (discussion) => {
        const user = await ctx.db.get(discussion.userId);
        return {
          ...discussion,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                profilePicture: user.profilePicture,
                isVerified: user.isVerified,
              }
            : null,
        };
      })
    );

    return discussionsWithUser;
  },
});

export const getReplies = query({
  args: { discussionId: v.id("islamicDiscussions") },
  handler: async (ctx, args) => {
    const replies = await ctx.db
      .query("islamicDiscussionReplies")
      .withIndex("by_discussion", (q) => q.eq("discussionId", args.discussionId))
      .order("desc")
      .collect();

    const repliesWithUser = await Promise.all(
      replies.map(async (reply) => {
        const user = await ctx.db.get(reply.userId);
        return {
          ...reply,
          user: user
            ? {
                _id: user._id,
                name: user.name,
                username: user.username,
                profilePicture: user.profilePicture,
                isVerified: user.isVerified,
              }
            : null,
        };
      })
    );

    return repliesWithUser;
  },
});

export const createDiscussion = mutation({
  args: { question: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Soru göndermek için giriş yapmalısınız",
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

    const discussionId = await ctx.db.insert("islamicDiscussions", {
      userId: user._id,
      question: args.question,
      likeCount: 0,
      replyCount: 0,
    });

    return discussionId;
  },
});

export const createReply = mutation({
  args: {
    discussionId: v.id("islamicDiscussions"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Cevap göndermek için giriş yapmalısınız",
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

    const discussion = await ctx.db.get(args.discussionId);
    if (!discussion) {
      throw new ConvexError({
        message: "Soru bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const replyId = await ctx.db.insert("islamicDiscussionReplies", {
      discussionId: args.discussionId,
      userId: user._id,
      content: args.content,
      likeCount: 0,
    });

    // Update reply count
    await ctx.db.patch(args.discussionId, {
      replyCount: discussion.replyCount + 1,
    });

    return replyId;
  },
});

export const toggleLike = mutation({
  args: {
    discussionId: v.optional(v.id("islamicDiscussions")),
    replyId: v.optional(v.id("islamicDiscussionReplies")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Beğenmek için giriş yapmalısınız",
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

    if (args.discussionId) {
      const discussion = await ctx.db.get(args.discussionId);
      if (!discussion) {
        throw new ConvexError({
          message: "Soru bulunamadı",
          code: "NOT_FOUND",
        });
      }

      const existingLike = await ctx.db
        .query("islamicDiscussionLikes")
        .withIndex("by_discussion", (q) => q.eq("discussionId", args.discussionId))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .unique();

      if (existingLike) {
        await ctx.db.delete(existingLike._id);
        await ctx.db.patch(args.discussionId, {
          likeCount: Math.max(0, discussion.likeCount - 1),
        });
        return { liked: false };
      } else {
        await ctx.db.insert("islamicDiscussionLikes", {
          discussionId: args.discussionId,
          userId: user._id,
        });
        await ctx.db.patch(args.discussionId, {
          likeCount: discussion.likeCount + 1,
        });
        return { liked: true };
      }
    } else if (args.replyId) {
      const reply = await ctx.db.get(args.replyId);
      if (!reply) {
        throw new ConvexError({
          message: "Cevap bulunamadı",
          code: "NOT_FOUND",
        });
      }

      const existingLike = await ctx.db
        .query("islamicDiscussionLikes")
        .withIndex("by_reply", (q) => q.eq("replyId", args.replyId))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .unique();

      if (existingLike) {
        await ctx.db.delete(existingLike._id);
        await ctx.db.patch(args.replyId, {
          likeCount: Math.max(0, reply.likeCount - 1),
        });
        return { liked: false };
      } else {
        await ctx.db.insert("islamicDiscussionLikes", {
          replyId: args.replyId,
          userId: user._id,
        });
        await ctx.db.patch(args.replyId, {
          likeCount: reply.likeCount + 1,
        });
        return { liked: true };
      }
    }

    throw new ConvexError({
      message: "Geçersiz istek",
      code: "BAD_REQUEST",
    });
  },
});

export const hasLiked = query({
  args: {
    discussionId: v.optional(v.id("islamicDiscussions")),
    replyId: v.optional(v.id("islamicDiscussionReplies")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return false;
    }

    if (args.discussionId) {
      const like = await ctx.db
        .query("islamicDiscussionLikes")
        .withIndex("by_discussion", (q) => q.eq("discussionId", args.discussionId))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .unique();
      return !!like;
    } else if (args.replyId) {
      const like = await ctx.db
        .query("islamicDiscussionLikes")
        .withIndex("by_reply", (q) => q.eq("replyId", args.replyId))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .unique();
      return !!like;
    }

    return false;
  },
});

export const deleteDiscussion = mutation({
  args: { discussionId: v.id("islamicDiscussions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Soruyu silmek için giriş yapmalısınız",
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

    const discussion = await ctx.db.get(args.discussionId);
    if (!discussion) {
      throw new ConvexError({
        message: "Soru bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Check if user owns the discussion
    if (discussion.userId !== user._id) {
      throw new ConvexError({
        message: "Bu soruyu silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    // Delete all replies
    const replies = await ctx.db
      .query("islamicDiscussionReplies")
      .withIndex("by_discussion", (q) => q.eq("discussionId", args.discussionId))
      .collect();

    for (const reply of replies) {
      await ctx.db.delete(reply._id);
    }

    // Delete all likes on the discussion
    const likes = await ctx.db
      .query("islamicDiscussionLikes")
      .withIndex("by_discussion", (q) => q.eq("discussionId", args.discussionId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete the discussion
    await ctx.db.delete(args.discussionId);
  },
});

export const deleteReply = mutation({
  args: { replyId: v.id("islamicDiscussionReplies") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Cevabı silmek için giriş yapmalısınız",
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

    const reply = await ctx.db.get(args.replyId);
    if (!reply) {
      throw new ConvexError({
        message: "Cevap bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Check if user owns the reply
    if (reply.userId !== user._id) {
      throw new ConvexError({
        message: "Bu cevabı silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    // Update discussion reply count
    const discussion = await ctx.db.get(reply.discussionId);
    if (discussion) {
      await ctx.db.patch(reply.discussionId, {
        replyCount: Math.max(0, discussion.replyCount - 1),
      });
    }

    // Delete all likes on the reply
    const likes = await ctx.db
      .query("islamicDiscussionLikes")
      .withIndex("by_reply", (q) => q.eq("replyId", args.replyId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete the reply
    await ctx.db.delete(args.replyId);
  },
});
