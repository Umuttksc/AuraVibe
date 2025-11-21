import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Toggle save post (save or unsave)
export const toggleSavePost = mutation({
  args: {
    postId: v.id("posts"),
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

    // Check if post exists
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError({
        message: "Post not found",
        code: "NOT_FOUND",
      });
    }

    // Check if already saved
    const existingSave = await ctx.db
      .query("savedPosts")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", currentUser._id).eq("postId", args.postId),
      )
      .unique();

    if (existingSave) {
      // Unsave
      await ctx.db.delete(existingSave._id);
      return { saved: false };
    } else {
      // Save
      await ctx.db.insert("savedPosts", {
        userId: currentUser._id,
        postId: args.postId,
      });
      return { saved: true };
    }
  },
});

// Check if a post is saved by current user
export const isPostSaved = query({
  args: {
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser) {
      return false;
    }

    const savedPost = await ctx.db
      .query("savedPosts")
      .withIndex("by_user_and_post", (q) =>
        q.eq("userId", currentUser._id).eq("postId", args.postId),
      )
      .unique();

    return !!savedPost;
  },
});

// Get all saved posts for current user
export const getSavedPosts = query({
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

    // Get all saved post records for this user
    const savedPostRecords = await ctx.db
      .query("savedPosts")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .order("desc")
      .collect();

    // Get full post details with author info
    const postsWithDetails = await Promise.all(
      savedPostRecords.map(async (record) => {
        const post = await ctx.db.get(record.postId);
        if (!post) return null;

        const author = await ctx.db.get(post.authorId);
        if (!author) return null;

        const music = post.musicId ? await ctx.db.get(post.musicId) : null;

        const imageUrl = post.imageId
          ? await ctx.storage.getUrl(post.imageId)
          : null;

        const profilePictureUrl = author.profilePicture
          ? await ctx.storage.getUrl(author.profilePicture)
          : null;

        // Check if current user has liked this post
        const userLike = await ctx.db
          .query("likes")
          .withIndex("by_post_and_user", (q) =>
            q.eq("postId", post._id).eq("userId", currentUser._id),
          )
          .unique();

        return {
          _id: post._id,
          content: post.content,
          imageUrl,
          mediaType: post.mediaType,
          musicId: post.musicId,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          isLiked: !!userLike,
          isSaved: true, // Always true since we're getting saved posts
          author: {
            _id: author._id,
            name: author.name || "Unknown",
            username: author.username,
            profilePictureUrl,
          },
          music: music ? {
            _id: music._id,
            title: music.title,
            artist: music.artist,
            albumArt: music.albumArt,
          } : null,
          createdAt: new Date(post._creationTime).toISOString(),
          savedAt: new Date(record._creationTime).toISOString(),
        };
      }),
    );

    // Filter out null values
    return postsWithDetails.filter((p) => p !== null);
  },
});
