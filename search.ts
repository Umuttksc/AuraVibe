import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { getBlockedUserIds, getMutedUserIds } from "./helpers";

export const advancedSearchUsers = query({
  args: {
    searchQuery: v.string(),
    filters: v.optional(
      v.object({
        verifiedOnly: v.optional(v.boolean()),
        gender: v.optional(v.union(v.literal("female"), v.literal("male"), v.literal("other"))),
        location: v.optional(v.string()),
        hasProfilePicture: v.optional(v.boolean()),
        minFollowers: v.optional(v.number()),
      })
    ),
    sortBy: v.optional(
      v.union(
        v.literal("relevance"),
        v.literal("followers"),
        v.literal("recent")
      )
    ),
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) {
      return [];
    }

    const identity = await ctx.auth.getUserIdentity();
    let currentUserId = null;
    let blockedUserIds: string[] = [];
    let mutedUserIds: string[] = [];

    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      
      if (currentUser) {
        currentUserId = currentUser._id;
        [blockedUserIds, mutedUserIds] = await Promise.all([
          getBlockedUserIds(ctx, currentUser._id),
          getMutedUserIds(ctx, currentUser._id),
        ]);
      }
    }

    const allUsers = await ctx.db.query("users").collect();
    const searchLower = args.searchQuery.toLowerCase();

    // Filter users based on search query and filters
    let filteredUsers = allUsers.filter((user) => {
      // Skip blocked and muted users
      if (blockedUserIds.includes(user._id) || mutedUserIds.includes(user._id)) {
        return false;
      }

      // Search by name, username, or bio
      const matchesSearch =
        user.name?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.bio?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Apply filters
      if (args.filters?.verifiedOnly && !user.isVerified) return false;
      if (args.filters?.gender && user.gender !== args.filters.gender) return false;
      if (args.filters?.location && !user.location?.toLowerCase().includes(args.filters.location.toLowerCase())) return false;
      if (args.filters?.hasProfilePicture && !user.profilePicture) return false;

      return true;
    });

    // Get follower counts for all filtered users
    const usersWithCounts = await Promise.all(
      filteredUsers.map(async (user) => {
        const followerCount = await ctx.db
          .query("follows")
          .withIndex("by_following", (q) => q.eq("followingId", user._id))
          .collect();

        // Check if min followers filter applies
        if (args.filters?.minFollowers && followerCount.length < args.filters.minFollowers) {
          return null;
        }

        // Check if current user is following
        let isFollowing = false;
        if (currentUserId) {
          const follow = await ctx.db
            .query("follows")
            .withIndex("by_follower_and_following", (q) =>
              q.eq("followerId", currentUserId).eq("followingId", user._id)
            )
            .unique();
          isFollowing = !!follow;
        }

        // Get profile picture URL
        let profilePicture = null;
        if (user.profilePicture) {
          profilePicture = await ctx.storage.getUrl(user.profilePicture);
        }

        return {
          ...user,
          profilePicture,
          followerCount: followerCount.length,
          isFollowing,
        };
      })
    );

    // Remove null entries (users that didn't meet minFollowers)
    const validUsers = usersWithCounts.filter((u) => u !== null);

    // Sort users
    const sortBy = args.sortBy || "relevance";
    validUsers.sort((a, b) => {
      if (sortBy === "followers") {
        return b.followerCount - a.followerCount;
      } else if (sortBy === "recent") {
        return b._creationTime - a._creationTime;
      } else {
        // Relevance: exact username match > name match > bio match
        const aUsername = a.username?.toLowerCase() === searchLower ? 3 : 0;
        const bUsername = b.username?.toLowerCase() === searchLower ? 3 : 0;
        const aName = a.name?.toLowerCase().startsWith(searchLower) ? 2 : a.name?.toLowerCase().includes(searchLower) ? 1 : 0;
        const bName = b.name?.toLowerCase().startsWith(searchLower) ? 2 : b.name?.toLowerCase().includes(searchLower) ? 1 : 0;
        
        const aScore = aUsername + aName;
        const bScore = bUsername + bName;
        
        return bScore - aScore;
      }
    });

    return validUsers.slice(0, 50); // Limit to 50 results
  },
});

export const advancedSearchPosts = query({
  args: {
    searchQuery: v.string(),
    filters: v.optional(
      v.object({
        hasMedia: v.optional(v.boolean()),
        mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
        verifiedAuthorsOnly: v.optional(v.boolean()),
        hasMusic: v.optional(v.boolean()),
        minLikes: v.optional(v.number()),
      })
    ),
    sortBy: v.optional(
      v.union(
        v.literal("relevance"),
        v.literal("recent"),
        v.literal("popular")
      )
    ),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    const identity = await ctx.auth.getUserIdentity();
    let currentUserId = null;
    let blockedUserIds: string[] = [];
    let mutedUserIds: string[] = [];

    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      
      if (currentUser) {
        currentUserId = currentUser._id;
        [blockedUserIds, mutedUserIds] = await Promise.all([
          getBlockedUserIds(ctx, currentUser._id),
          getMutedUserIds(ctx, currentUser._id),
        ]);
      }
    }

    const allPosts = await ctx.db.query("posts").collect();
    const searchLower = args.searchQuery.toLowerCase();

    // Filter posts
    let filteredPosts = allPosts.filter((post) => {
      // Skip posts from blocked/muted users
      if (blockedUserIds.includes(post.authorId) || mutedUserIds.includes(post.authorId)) {
        return false;
      }

      // Search in content
      if (!post.content.toLowerCase().includes(searchLower)) return false;

      // Apply filters
      if (args.filters?.hasMedia && !post.imageId) return false;
      if (args.filters?.mediaType && post.mediaType !== args.filters.mediaType) return false;
      if (args.filters?.hasMusic && !post.musicId) return false;
      if (args.filters?.minLikes && post.likeCount < args.filters.minLikes) return false;

      return true;
    });

    // Filter by verified authors if needed
    if (args.filters?.verifiedAuthorsOnly) {
      const verifiedPosts = await Promise.all(
        filteredPosts.map(async (post) => {
          const author = await ctx.db.get(post.authorId);
          return author?.isVerified ? post : null;
        })
      );
      filteredPosts = verifiedPosts.filter((p) => p !== null);
    }

    // Sort posts
    const sortBy = args.sortBy || "relevance";
    filteredPosts.sort((a, b) => {
      if (sortBy === "recent") {
        return b._creationTime - a._creationTime;
      } else if (sortBy === "popular") {
        return b.likeCount - a.likeCount;
      } else {
        // Relevance: check if query appears earlier in content
        const aIndex = a.content.toLowerCase().indexOf(searchLower);
        const bIndex = b.content.toLowerCase().indexOf(searchLower);
        return aIndex - bIndex;
      }
    });

    // Manual pagination
    const startIndex = args.paginationOpts.cursor ? parseInt(args.paginationOpts.cursor) : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

    // Enrich posts with author details
    const postsWithDetails = await Promise.all(
      paginatedPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);

        let profilePictureUrl = null;
        if (author?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(author.profilePicture);
        }

        let isLikedByCurrentUser = false;
        if (currentUserId) {
          const like = await ctx.db
            .query("likes")
            .withIndex("by_post_and_user", (q) =>
              q.eq("postId", post._id).eq("userId", currentUserId)
            )
            .unique();
          isLikedByCurrentUser = !!like;
        }

        return {
          ...post,
          author: author ? { ...author, profilePictureUrl } : null,
          isLikedByCurrentUser,
          createdAt: new Date(post._creationTime).toISOString(),
        };
      })
    );

    return {
      page: postsWithDetails,
      isDone: endIndex >= filteredPosts.length,
      continueCursor: endIndex.toString(),
    };
  },
});

export const searchHashtags = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) {
      return [];
    }

    const searchLower = args.searchQuery.toLowerCase().replace(/^#/, "");
    
    const allHashtags = await ctx.db.query("hashtags").collect();
    const matchingHashtags = allHashtags
      .filter((hashtag) => hashtag.tag.toLowerCase().includes(searchLower))
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 20);

    return matchingHashtags.map((hashtag) => ({
      ...hashtag,
      lastUsedAt: new Date(hashtag.lastUsedAt).toISOString(),
    }));
  },
});
