import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api.js";
import { getBlockedUserIds, getMutedUserIds } from "./helpers.js";

export const createPost = mutation({
  args: {
    content: v.string(),
    imageId: v.optional(v.id("_storage")),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    musicId: v.optional(v.id("music")),
    media: v.optional(v.array(v.object({
      storageId: v.id("_storage"),
      type: v.union(v.literal("image"), v.literal("video")),
    }))),
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

    // Convert media array to proper format if provided
    const mediaArray = args.media?.map(m => ({
      storageId: m.storageId,
      type: m.type,
      url: null, // URL will be set when queried
    }));

    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      content: args.content,
      imageId: args.imageId,
      mediaType: args.mediaType,
      musicId: args.musicId,
      media: mediaArray,
      likeCount: 0,
      commentCount: 0,
    });

    // Extract and store hashtags
    await ctx.runMutation(internal.hashtags.updateHashtagsForPost, {
      postId,
      content: args.content,
    });

    // Check and award achievements
    await ctx.runMutation(internal.achievements.checkAndAwardAchievements, {
      userId: user._id,
      type: "post",
    });

    return postId;
  },
});

// Following feed - posts from users you follow
export const getFollowingPosts = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    _refresh: v.optional(v.number()), // Optional param to trigger refresh
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Get users this user follows
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .collect();

    const followedUserIds = new Set(follows.map((f) => f.followingId));

    // Get blocked and muted user IDs
    const [blockedUserIds, mutedUserIds] = await Promise.all([
      getBlockedUserIds(ctx, currentUser._id),
      getMutedUserIds(ctx, currentUser._id),
    ]);

    const filteredUserIds = new Set([...blockedUserIds, ...mutedUserIds]);

    // Get all posts and filter by followed users
    const allPosts = await ctx.db
      .query("posts")
      .order("desc")
      .collect();

    const followingPosts = allPosts.filter(
      (post) =>
        followedUserIds.has(post.authorId) && !filteredUserIds.has(post.authorId)
    );

    // Manual pagination
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = followingPosts.slice(startIndex, endIndex);

    const postsWithDetails = await Promise.all(
      paginatedPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        
        let profilePictureUrl = null;
        if (author?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(author.profilePicture);
        }
        
        let isLikedByCurrentUser = false;
        if (currentUser) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_post_and_user", (q) =>
              q.eq("postId", post._id).eq("userId", currentUser._id),
            )
            .first();
          isLikedByCurrentUser = !!like;
        }

        let musicTrack = null;
        if (post.musicId) {
          musicTrack = await ctx.db.get(post.musicId);
        }

        return {
          ...post,
          author: author
            ? {
                ...author,
                profilePictureUrl,
              }
            : null,
          isLikedByCurrentUser,
          musicTrack,
          createdAt: new Date(post._creationTime).toISOString(),
        };
      })
    );

    return {
      page: postsWithDetails,
      isDone: endIndex >= followingPosts.length,
      continueCursor:
        endIndex >= followingPosts.length ? "" : endIndex.toString(),
    };
  },
});

// For You feed - personalized based on follows and engagement
export const getForYouPosts = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    _refresh: v.optional(v.number()), // Optional param to trigger refresh
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    let currentUser = null;
    let followedUserIds = new Set<string>();
    let blockedUserIds: string[] = [];
    let mutedUserIds: string[] = [];

    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();

      if (user) {
        currentUser = user;
        // Get followed users
        const follows = await ctx.db
          .query("follows")
          .withIndex("by_follower", (q) => q.eq("followerId", user._id))
          .collect();
        followedUserIds = new Set(follows.map((f) => f.followingId));

        // Get blocked/muted users
        [blockedUserIds, mutedUserIds] = await Promise.all([
          getBlockedUserIds(ctx, currentUser._id),
          getMutedUserIds(ctx, currentUser._id),
        ]);
      }
    }

    const filteredUserIds = new Set([...blockedUserIds, ...mutedUserIds]);

    // Get user's interaction history for personalization
    const userLikedPostIds = new Set<string>();
    const userCommentedPostIds = new Set<string>();
    const usersILiked = new Set<string>();

    if (currentUser) {
      const userLikes = await ctx.db
        .query("likes")
        .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
        .take(100);
      
      const userComments = await ctx.db
        .query("comments")
        .withIndex("by_author", (q) => q.eq("authorId", currentUser._id))
        .take(100);

      // Build sets from user interactions
      for (const like of userLikes) {
        userLikedPostIds.add(like.postId);
        const post = await ctx.db.get(like.postId);
        if (post) {
          usersILiked.add(post.authorId);
        }
      }

      for (const comment of userComments) {
        userCommentedPostIds.add(comment.postId);
      }
    }

    // Get all posts
    const allPosts = await ctx.db
      .query("posts")
      .order("desc")
      .take(800); // Get more posts for better ranking

    // Advanced personalized scoring algorithm
    const now = Date.now();
    const seenAuthors = new Map<string, number>();
    
    const scoredPosts = allPosts
      .filter((post) => !filteredUserIds.has(post.authorId))
      .map((post) => {
        let score = 0;
        const ageInHours = (now - post._creationTime) / (1000 * 60 * 60);

        // 1. FOLLOWS BOOST - Highest priority
        if (followedUserIds.has(post.authorId)) {
          score += 2000;
        }

        // 2. PERSONALIZATION - Content from authors user has liked
        if (usersILiked.has(post.authorId)) {
          score += 800;
        }

        // 3. ENGAGEMENT QUALITY
        const totalEngagement = post.likeCount + post.commentCount;
        const engagementRatio = totalEngagement / Math.max(1, ageInHours);
        
        if (engagementRatio > 10) score += 300;
        else if (engagementRatio > 5) score += 150;
        else if (engagementRatio > 2) score += 75;
        
        score += post.likeCount * 3;
        score += post.commentCount * 5;

        // 4. RECENCY BOOST - Better time decay
        if (ageInHours < 0.5) score += 200;
        else if (ageInHours < 2) score += 150;
        else if (ageInHours < 6) score += 100;
        else if (ageInHours < 12) score += 60;
        else if (ageInHours < 24) score += 30;
        else if (ageInHours < 48) score += 10;
        else if (ageInHours < 72) score += 5;

        // 5. TRENDING NEW CONTENT
        const isVeryNew = ageInHours < 3;
        if (isVeryNew && totalEngagement > 0) {
          score += 100;
        }

        // 6. DIVERSITY - Don't show too many from same author
        const authorPostCount = seenAuthors.get(post.authorId) || 0;
        seenAuthors.set(post.authorId, authorPostCount + 1);
        if (authorPostCount > 0) {
          score -= authorPostCount * 150;
        }

        // 7. MEDIA BONUS
        if (post.imageId) score += 50;
        if (post.musicId) score += 30;

        // 8. AGE PENALTIES
        if (ageInHours > 72) score -= 30;
        if (ageInHours > 168) score -= 100;
        if (ageInHours > 336) score -= 300;

        // 9. AVOID ALREADY SEEN
        if (userLikedPostIds.has(post._id) || userCommentedPostIds.has(post._id)) {
          score -= 1000;
        }

        return { post, score };
      })
      .sort((a, b) => b.score - a.score);

    // Manual pagination
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = scoredPosts.slice(startIndex, endIndex).map((sp) => sp.post);

    const postsWithDetails = await Promise.all(
      paginatedPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        
        let profilePictureUrl = null;
        if (author?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(author.profilePicture);
        }
        
        let isLikedByCurrentUser = false;
        if (currentUser) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_post_and_user", (q) =>
              q.eq("postId", post._id).eq("userId", currentUser._id),
            )
            .first();
          isLikedByCurrentUser = !!like;
        }

        let musicTrack = null;
        if (post.musicId) {
          musicTrack = await ctx.db.get(post.musicId);
        }

        return {
          ...post,
          author: author
            ? {
                ...author,
                profilePictureUrl,
              }
            : null,
          isLikedByCurrentUser,
          musicTrack,
          createdAt: new Date(post._creationTime).toISOString(),
        };
      })
    );

    return {
      page: postsWithDetails,
      isDone: endIndex >= scoredPosts.length,
      continueCursor:
        endIndex >= scoredPosts.length ? "" : endIndex.toString(),
    };
  },
});

// Trending feed - most popular recent posts
export const getTrendingPosts = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    _refresh: v.optional(v.number()), // Optional param to trigger refresh
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    let currentUser = null;
    let blockedUserIds: string[] = [];
    let mutedUserIds: string[] = [];

    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();

      if (currentUser) {
        [blockedUserIds, mutedUserIds] = await Promise.all([
          getBlockedUserIds(ctx, currentUser._id),
          getMutedUserIds(ctx, currentUser._id),
        ]);
      }
    }

    const filteredUserIds = new Set([...blockedUserIds, ...mutedUserIds]);

    // Get recent posts (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const allPosts = await ctx.db
      .query("posts")
      .order("desc")
      .take(1000);

    const recentPosts = allPosts.filter(
      (post) =>
        post._creationTime >= sevenDaysAgo && !filteredUserIds.has(post.authorId)
    );

    // Sort by engagement
    const trendingPosts = recentPosts.sort((a, b) => {
      const scoreA = a.likeCount * 2 + a.commentCount * 3;
      const scoreB = b.likeCount * 2 + b.commentCount * 3;
      return scoreB - scoreA;
    });

    // Manual pagination
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = trendingPosts.slice(startIndex, endIndex);

    const postsWithDetails = await Promise.all(
      paginatedPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        
        let profilePictureUrl = null;
        if (author?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(author.profilePicture);
        }
        
        let isLikedByCurrentUser = false;
        if (currentUser) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_post_and_user", (q) =>
              q.eq("postId", post._id).eq("userId", currentUser._id),
            )
            .first();
          isLikedByCurrentUser = !!like;
        }

        let musicTrack = null;
        if (post.musicId) {
          musicTrack = await ctx.db.get(post.musicId);
        }

        return {
          ...post,
          author: author
            ? {
                ...author,
                profilePictureUrl,
              }
            : null,
          isLikedByCurrentUser,
          musicTrack,
          createdAt: new Date(post._creationTime).toISOString(),
        };
      })
    );

    return {
      page: postsWithDetails,
      isDone: endIndex >= trendingPosts.length,
      continueCursor:
        endIndex >= trendingPosts.length ? "" : endIndex.toString(),
    };
  },
});

// Keep original getPosts for backwards compatibility
export const getPosts = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    // Get blocked and muted user IDs
    let blockedUserIds: string[] = [];
    let mutedUserIds: string[] = [];
    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      
      if (currentUser) {
        [blockedUserIds, mutedUserIds] = await Promise.all([
          getBlockedUserIds(ctx, currentUser._id),
          getMutedUserIds(ctx, currentUser._id),
        ]);
      }
    }

    const posts = await ctx.db
      .query("posts")
      .order("desc")
      .paginate(args.paginationOpts);

    // Filter out blocked and muted users
    const filteredUserIds = new Set([...blockedUserIds, ...mutedUserIds]);
    const filteredPosts = posts.page.filter(
      (post) => !filteredUserIds.has(post.authorId)
    );

    const postsWithDetails = await Promise.all(
      filteredPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        
        // Get author profile picture URL
        let profilePictureUrl = null;
        if (author?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(author.profilePicture);
        }
        
        let isLikedByCurrentUser = false;
        if (identity) {
          const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
              q.eq("tokenIdentifier", identity.tokenIdentifier),
            )
            .unique();
          
          if (currentUser) {
            const like = await ctx.db
              .query("likes")
              .withIndex("by_post_and_user", (q) =>
                q.eq("postId", post._id).eq("userId", currentUser._id),
              )
              .unique();
            isLikedByCurrentUser = !!like;
          }
        }

        return {
          ...post,
          author: author ? { ...author, profilePictureUrl } : null,
          isLikedByCurrentUser,
          createdAt: new Date(post._creationTime).toISOString(),
        };
      }),
    );

    return {
      ...posts,
      page: postsWithDetails,
    };
  },
});

export const getPostById = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Post not found",
      });
    }

    const author = await ctx.db.get(post.authorId);
    
    // Get author profile picture URL
    let profilePictureUrl = null;
    if (author?.profilePicture) {
      profilePictureUrl = await ctx.storage.getUrl(author.profilePicture);
    }

    // Get post media URLs
    let imageUrl = null;
    if (post.imageId) {
      imageUrl = await ctx.storage.getUrl(post.imageId);
    }

    let media = null;
    if (post.media && post.media.length > 0) {
      media = await Promise.all(
        post.media.map(async (item) => ({
          ...item,
          url: await ctx.storage.getUrl(item.storageId),
        }))
      );
    }

    const identity = await ctx.auth.getUserIdentity();
    
    let isLikedByCurrentUser = false;
    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      
      if (currentUser) {
        const like = await ctx.db
          .query("likes")
          .withIndex("by_post_and_user", (q) =>
            q.eq("postId", post._id).eq("userId", currentUser._id),
          )
          .unique();
        isLikedByCurrentUser = !!like;
      }
    }

    return {
      ...post,
      imageUrl,
      media,
      author: author ? { ...author, profilePictureUrl } : null,
      isLikedByCurrentUser,
      createdAt: new Date(post._creationTime).toISOString(),
    };
  },
});

export const toggleLike = mutation({
  args: { postId: v.id("posts") },
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

    const existingLike = await ctx.db
      .query("likes")
      .withIndex("by_post_and_user", (q) =>
        q.eq("postId", args.postId).eq("userId", user._id),
      )
      .unique();

    if (existingLike) {
      // Unlike
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.postId, {
        likeCount: Math.max(0, post.likeCount - 1),
      });
      return { liked: false };
    } else {
      // Like
      await ctx.db.insert("likes", {
        postId: args.postId,
        userId: user._id,
      });
      await ctx.db.patch(args.postId, {
        likeCount: post.likeCount + 1,
      });

      // Create notification for post author (don't notify yourself)
      if (post.authorId !== user._id) {
        await ctx.db.insert("notifications", {
          userId: post.authorId,
          type: "like",
          actorId: user._id,
          postId: args.postId,
          isRead: false,
        });
      }

      // Check and award like achievements for post author
      await ctx.runMutation(internal.achievements.checkAndAwardAchievements, {
        userId: post.authorId,
        type: "like",
      });

      return { liked: true };
    }
  },
});

export const editPost = mutation({
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

    if (post.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only edit your own posts",
      });
    }

    // Store previous content in edit history
    await ctx.db.insert("postEditHistory", {
      postId: args.postId,
      previousContent: post.content,
      editedAt: Date.now(),
    });

    // Update the post
    await ctx.db.patch(args.postId, {
      content: args.content,
      isEdited: true,
      lastEditedAt: Date.now(),
    });

    // Update hashtags
    await ctx.runMutation(internal.hashtags.updateHashtagsForPost, {
      postId: args.postId,
      content: args.content,
    });

    return { success: true };
  },
});

export const getPostEditHistory = query({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const history = await ctx.db
      .query("postEditHistory")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .order("desc")
      .collect();

    return history.map((edit) => ({
      ...edit,
      editedAt: new Date(edit.editedAt).toISOString(),
    }));
  },
});

export const deletePost = mutation({
  args: { postId: v.id("posts") },
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

    if (post.authorId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "You can only delete your own posts",
      });
    }

    // Delete all likes for this post
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    
    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    // Delete all comments for this post
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    
    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete edit history
    const editHistory = await ctx.db
      .query("postEditHistory")
      .withIndex("by_post", (q) => q.eq("postId", args.postId))
      .collect();
    
    for (const edit of editHistory) {
      await ctx.db.delete(edit._id);
    }

    // Delete the post
    await ctx.db.delete(args.postId);
  },
});

export const getUserPosts = query({
  args: { userId: v.id("users"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    // Get all user posts (we'll sort them in memory to prioritize pinned)
    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .order("desc")
      .collect();

    // Sort: pinned posts first (by pinnedAt desc), then regular posts by creation time
    const sortedPosts = allPosts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.isPinned && b.isPinned) {
        return (b.pinnedAt || 0) - (a.pinnedAt || 0);
      }
      return b._creationTime - a._creationTime;
    });

    // Manual pagination
    const cursor = args.paginationOpts.cursor 
      ? parseInt(args.paginationOpts.cursor) 
      : 0;
    const limit = args.paginationOpts.numItems;
    const paginatedPosts = sortedPosts.slice(cursor, cursor + limit);
    const isDone = cursor + limit >= sortedPosts.length;

    const postsWithDetails = await Promise.all(
      paginatedPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        
        // Get author profile picture URL
        let profilePictureUrl = null;
        if (author?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(author.profilePicture);
        }

        // Get post media URLs
        let imageUrl = null;
        if (post.imageId) {
          imageUrl = await ctx.storage.getUrl(post.imageId);
        }

        let media = null;
        if (post.media && post.media.length > 0) {
          media = await Promise.all(
            post.media.map(async (item) => ({
              ...item,
              url: await ctx.storage.getUrl(item.storageId),
            }))
          );
        }
        
        const identity = await ctx.auth.getUserIdentity();
        
        let isLikedByCurrentUser = false;
        if (identity) {
          const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
              q.eq("tokenIdentifier", identity.tokenIdentifier),
            )
            .unique();
          
          if (currentUser) {
            const like = await ctx.db
              .query("likes")
              .withIndex("by_post_and_user", (q) =>
                q.eq("postId", post._id).eq("userId", currentUser._id),
              )
              .unique();
            isLikedByCurrentUser = !!like;
          }
        }

        return {
          ...post,
          imageUrl,
          media,
          author: author ? { ...author, profilePictureUrl } : null,
          isLikedByCurrentUser,
          createdAt: new Date(post._creationTime).toISOString(),
        };
      }),
    );

    return {
      page: postsWithDetails,
      isDone,
      continueCursor: String(cursor + limit),
    };
  },
});

export const togglePinPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
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

    // Only post author can pin/unpin
    if (post.authorId !== currentUser._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Only post author can pin posts",
      });
    }

    if (post.isPinned) {
      // Unpin the post
      await ctx.db.patch(args.postId, {
        isPinned: false,
        pinnedAt: undefined,
      });
      return { isPinned: false };
    } else {
      // Check if user already has 3 pinned posts
      const pinnedPosts = await ctx.db
        .query("posts")
        .withIndex("by_author_and_pinned", (q) =>
          q.eq("authorId", currentUser._id).eq("isPinned", true)
        )
        .collect();

      if (pinnedPosts.length >= 3) {
        throw new ConvexError({
          code: "BAD_REQUEST",
          message: "Maximum 3 posts can be pinned. Unpin a post first.",
        });
      }

      // Pin the post
      await ctx.db.patch(args.postId, {
        isPinned: true,
        pinnedAt: Date.now(),
      });
      return { isPinned: true };
    }
  },
});

export const searchPosts = query({
  args: { searchQuery: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const allPosts = await ctx.db.query("posts").collect();
    const filteredPosts = allPosts.filter((post) =>
      post.content.toLowerCase().includes(args.searchQuery.toLowerCase())
    );

    // Manual pagination
    const startIndex = args.paginationOpts.cursor ? parseInt(args.paginationOpts.cursor) : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    const postsWithDetails = await Promise.all(
      paginatedPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        
        // Get author profile picture URL
        let profilePictureUrl = null;
        if (author?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(author.profilePicture);
        }
        
        const identity = await ctx.auth.getUserIdentity();
        
        let isLikedByCurrentUser = false;
        if (identity) {
          const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
              q.eq("tokenIdentifier", identity.tokenIdentifier),
            )
            .unique();
          
          if (currentUser) {
            const like = await ctx.db
              .query("likes")
              .withIndex("by_post_and_user", (q) =>
                q.eq("postId", post._id).eq("userId", currentUser._id),
              )
              .unique();
            isLikedByCurrentUser = !!like;
          }
        }

        return {
          ...post,
          author: author ? { ...author, profilePictureUrl } : null,
          isLikedByCurrentUser,
          createdAt: new Date(post._creationTime).toISOString(),
        };
      }),
    );

    return {
      page: postsWithDetails,
      isDone: endIndex >= filteredPosts.length,
      continueCursor: endIndex >= filteredPosts.length ? "" : endIndex.toString(),
    };
  },
});
