import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const blockUser = mutation({
  args: { blockedId: v.id("users") },
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

    // Can't block yourself
    if (user._id === args.blockedId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Cannot block yourself",
      });
    }

    // Check if already blocked
    const existingBlock = await ctx.db
      .query("blocks")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.blockedId)
      )
      .unique();

    if (existingBlock) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "User already blocked",
      });
    }

    // Create block
    await ctx.db.insert("blocks", {
      blockerId: user._id,
      blockedId: args.blockedId,
    });

    // Remove any existing follows between users
    const followingBlocked = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.blockedId)
      )
      .unique();

    if (followingBlocked) {
      await ctx.db.delete(followingBlocked._id);
    }

    const blockedFollowing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", args.blockedId).eq("followingId", user._id)
      )
      .unique();

    if (blockedFollowing) {
      await ctx.db.delete(blockedFollowing._id);
    }
  },
});

export const unblockUser = mutation({
  args: { blockedId: v.id("users") },
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

    const block = await ctx.db
      .query("blocks")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.blockedId)
      )
      .unique();

    if (!block) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not blocked",
      });
    }

    await ctx.db.delete(block._id);
  },
});

export const getBlockedUsers = query({
  args: {},
  handler: async (ctx) => {
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

    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_blocker", (q) => q.eq("blockerId", user._id))
      .collect();

    const blockedUsers = await Promise.all(
      blocks.map(async (block) => {
        const blockedUser = await ctx.db.get(block.blockedId);
        if (!blockedUser) return null;
        return {
          ...blockedUser,
          blockId: block._id,
          blockedAt: new Date(block._creationTime).toISOString(),
        };
      })
    );

    return blockedUsers.filter((user) => user !== null);
  },
});

export const isUserBlocked = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return false;
    }

    const block = await ctx.db
      .query("blocks")
      .withIndex("by_blocker_and_blocked", (q) =>
        q.eq("blockerId", user._id).eq("blockedId", args.userId)
      )
      .unique();

    return !!block;
  },
});
