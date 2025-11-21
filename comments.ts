import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import type { DataModel } from "./_generated/dataModel.d.ts";

// Helper function to check if content contains banned words
async function containsBannedWords(ctx: MutationCtx, content: string): Promise<boolean> {
  const bannedWords = await ctx.db.query("bannedWords").collect();
  const activeBannedWords = bannedWords.filter((w) => w.isActive);
  
  const lowerContent = content.toLowerCase();
  
  for (const bannedWord of activeBannedWords) {
    const lowerBannedWord = bannedWord.word.toLowerCase();
    // Check if banned word exists as a whole word or part of text
    if (lowerContent.includes(lowerBannedWord)) {
      return true;
    }
  }
  
  return false;
}

export const addComment = mutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
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
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Post not found",
      });
    }

    // Check for banned words
    const hasBannedWords = await containsBannedWords(ctx, args.content);
    if (hasBannedWords) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Yorumunuz uygunsuz içerik barındırdığı için engellenmiştir",
      });
    }

    const commentId = await ctx.db.insert("comments", {
      postId: args.postId,
      authorId: user._id,
      content: args.content,
    });

    // Increment comment count
    await ctx.db.patch(args.postId, {
      commentCount: post.commentCount + 1,
    });

    // Create notification for post author (don't notify yourself)
    if (post.authorId !== user._id) {
      await ctx.db.insert("notifications", {
        userId: post.authorId,
        type: "comment",
        actorId: user._id,
        postId: args.postId,
        commentId,
        isRead: false,
      });
    }

    return commentId;
  },
});

export const getComments = query({
  args: { postId: v.id("posts"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .paginate(args.paginationOpts);

    const commentsWithAuthors = await Promise.all(
      comments.page.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        let profilePictureUrl = null;
        if (author?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(author.profilePicture);
        }
        return {
          ...comment,
          author: author ? { ...author, profilePictureUrl } : null,
          createdAt: new Date(comment._creationTime).toISOString(),
        };
      }),
    );

    return {
      ...comments,
      page: commentsWithAuthors,
    };
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Comment not found",
      });
    }

    if (comment.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only delete your own comments",
      });
    }

    const post = await ctx.db.get(comment.postId);
    if (post) {
      await ctx.db.patch(comment.postId, {
        commentCount: Math.max(0, post.commentCount - 1),
      });
    }

    await ctx.db.delete(args.commentId);
  },
});

// Toggle comment like
export const toggleCommentLike = mutation({
  args: { commentId: v.id("comments") },
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

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Comment not found",
      });
    }

    const existingLike = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment_and_user", (q) =>
        q.eq("commentId", args.commentId).eq("userId", user._id)
      )
      .unique();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, {
        likeCount: Math.max(0, (comment.likeCount || 0) - 1),
      });
      return { isLiked: false };
    } else {
      await ctx.db.insert("commentLikes", {
        commentId: args.commentId,
        userId: user._id,
      });
      await ctx.db.patch(args.commentId, {
        likeCount: (comment.likeCount || 0) + 1,
      });
      return { isLiked: true };
    }
  },
});

// Get comment likes
export const getCommentLikes = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("commentLikes")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();

    return likes;
  },
});
