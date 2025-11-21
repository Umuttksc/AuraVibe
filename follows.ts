import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api.js";

// Follow a user
export const followUser = mutation({
  args: {
    userId: v.id("users"),
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

    // Can't follow yourself
    if (currentUser._id === args.userId) {
      throw new ConvexError({
        message: "Cannot follow yourself",
        code: "BAD_REQUEST",
      });
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId),
      )
      .unique();

    if (existingFollow) {
      throw new ConvexError({
        message: "Already following this user",
        code: "CONFLICT",
      });
    }

    // Create follow relationship
    await ctx.db.insert("follows", {
      followerId: currentUser._id,
      followingId: args.userId,
    });

    // Create notification for the followed user
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "follow",
      actorId: currentUser._id,
      isRead: false,
    });
  },
});

// Unfollow a user
export const unfollowUser = mutation({
  args: {
    userId: v.id("users"),
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

    // Find the follow relationship
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId),
      )
      .unique();

    if (!follow) {
      throw new ConvexError({
        message: "Not following this user",
        code: "NOT_FOUND",
      });
    }

    // Delete follow relationship
    await ctx.db.delete(follow._id);
  },
});

// Check if current user is following another user
export const isFollowing = query({
  args: {
    userId: v.id("users"),
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

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId),
      )
      .unique();

    return !!follow;
  },
});

// Get follower count
export const getFollowerCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    return followers.length;
  },
});

// Get following count
export const getFollowingCount = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    return following.length;
  },
});

// Get followers list
export const getFollowers = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", args.userId))
      .collect();

    const followers = [];
    for (const follow of follows) {
      const user = await ctx.db.get(follow.followerId);
      if (user) {
        const profilePictureUrl = user.profilePicture
          ? await ctx.storage.getUrl(user.profilePicture)
          : null;

        followers.push({
          _id: user._id,
          username: user.username || user.name || "User",
          name: user.name,
          profilePictureUrl,
        });
      }
    }

    return followers;
  },
});

// Get following list
export const getFollowing = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const following = [];
    for (const follow of follows) {
      const user = await ctx.db.get(follow.followingId);
      if (user) {
        const profilePictureUrl = user.profilePicture
          ? await ctx.storage.getUrl(user.profilePicture)
          : null;

        following.push({
          _id: user._id,
          username: user.username || user.name || "User",
          name: user.name,
          profilePictureUrl,
        });
      }
    }

    return following;
  },
});

// Get users who don't follow back
export const getNotFollowingBack = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get users I'm following
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const notFollowingBack = [];
    for (const follow of following) {
      const user = await ctx.db.get(follow.followingId);
      if (!user) continue;

      // Check if they follow me back
      const followsBack = await ctx.db
        .query("follows")
        .withIndex("by_follower_and_following", (q) =>
          q.eq("followerId", follow.followingId).eq("followingId", args.userId)
        )
        .unique();

      if (!followsBack) {
        const profilePictureUrl = user.profilePicture
          ? await ctx.storage.getUrl(user.profilePicture)
          : null;

        notFollowingBack.push({
          _id: user._id,
          username: user.username || user.name || "User",
          name: user.name,
          profilePictureUrl,
        });
      }
    }

    return notFollowingBack;
  },
});

// Get mutual followers (users who follow each other)
export const getMutualFollowers = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get users I'm following
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", args.userId))
      .collect();

    const mutualFollowers = [];
    for (const follow of following) {
      const user = await ctx.db.get(follow.followingId);
      if (!user) continue;

      // Check if they follow me back
      const followsBack = await ctx.db
        .query("follows")
        .withIndex("by_follower_and_following", (q) =>
          q.eq("followerId", follow.followingId).eq("followingId", args.userId)
        )
        .unique();

      if (followsBack) {
        const profilePictureUrl = user.profilePicture
          ? await ctx.storage.getUrl(user.profilePicture)
          : null;

        mutualFollowers.push({
          _id: user._id,
          username: user.username || user.name || "User",
          name: user.name,
          profilePictureUrl,
        });
      }
    }

    return mutualFollowers;
  },
});

// Get users who unfollowed me
export const getUnfollowers = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all unfollows where this user was unfollowed
    const unfollows = await ctx.db
      .query("unfollows")
      .withIndex("by_unfollowed", (q) => q.eq("unfollowedId", args.userId))
      .order("desc")
      .collect();

    const unfollowers = [];
    for (const unfollow of unfollows) {
      const user = await ctx.db.get(unfollow.followerId);
      if (!user) continue;

      // Check if they're currently following (in case they re-followed)
      const currentlyFollowing = await ctx.db
        .query("follows")
        .withIndex("by_follower_and_following", (q) =>
          q.eq("followerId", unfollow.followerId).eq("followingId", args.userId)
        )
        .unique();

      // Only include if they're NOT currently following
      if (!currentlyFollowing) {
        const profilePictureUrl = user.profilePicture
          ? await ctx.storage.getUrl(user.profilePicture)
          : null;

        unfollowers.push({
          _id: user._id,
          username: user.username || user.name || "User",
          name: user.name,
          profilePictureUrl,
          unfollowedAt: unfollow.unfollowedAt,
        });
      }
    }

    // Remove duplicates (keep most recent unfollow)
    const uniqueUnfollowers = Array.from(
      new Map(unfollowers.map(u => [u._id, u])).values()
    );

    return uniqueUnfollowers;
  },
});

// Toggle follow/unfollow
export const toggleFollow = mutation({
  args: {
    userId: v.id("users"),
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

    // Can't follow yourself
    if (currentUser._id === args.userId) {
      throw new ConvexError({
        message: "Cannot follow yourself",
        code: "BAD_REQUEST",
      });
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", currentUser._id).eq("followingId", args.userId),
      )
      .unique();

    if (existingFollow) {
      // Unfollow
      await ctx.db.delete(existingFollow._id);
      
      // Log the unfollow event
      await ctx.db.insert("unfollows", {
        followerId: currentUser._id,
        unfollowedId: args.userId,
        unfollowedAt: Date.now(),
      });
      
      return { isFollowing: false };
    } else {
      // Check if target user has private profile
      const targetUser = await ctx.db.get(args.userId);
      if (targetUser?.isPrivate) {
        // For private profiles, create a follow request instead
        const existingRequest = await ctx.db
          .query("followRequests")
          .withIndex("by_requester_and_target", (q) =>
            q.eq("requesterId", currentUser._id).eq("targetId", args.userId)
          )
          .unique();

        if (!existingRequest) {
          const requestId = await ctx.db.insert("followRequests", {
            requesterId: currentUser._id,
            targetId: args.userId,
            status: "pending",
          });

          // Create notification
          await ctx.db.insert("notifications", {
            userId: args.userId,
            type: "follow_request",
            actorId: currentUser._id,
            followRequestId: requestId,
            isRead: false,
          });
        }
        
        return { isFollowing: false, requestSent: true };
      }

      // For public profiles, follow directly
      await ctx.db.insert("follows", {
        followerId: currentUser._id,
        followingId: args.userId,
      });

      // Create notification for the followed user
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "follow",
        actorId: currentUser._id,
        isRead: false,
      });

      // Check and award follower achievements for the followed user
      await ctx.runMutation(internal.achievements.checkAndAwardAchievements, {
        userId: args.userId,
        type: "follower",
      });

      return { isFollowing: true };
    }
  },
});
