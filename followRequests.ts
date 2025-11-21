import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Send follow request to a private profile
export const sendFollowRequest = mutation({
  args: { targetUserId: v.id("users") },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Check if target user exists
    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser) {
      throw new ConvexError({
        message: "Target user not found",
        code: "NOT_FOUND",
      });
    }

    // Can't send request to yourself
    if (user._id === args.targetUserId) {
      throw new ConvexError({
        message: "Cannot send follow request to yourself",
        code: "BAD_REQUEST",
      });
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_following", (q) =>
        q.eq("followerId", user._id).eq("followingId", args.targetUserId)
      )
      .unique();

    if (existingFollow) {
      throw new ConvexError({
        message: "Already following this user",
        code: "CONFLICT",
      });
    }

    // Check if request already exists
    const existingRequest = await ctx.db
      .query("followRequests")
      .withIndex("by_requester_and_target", (q) =>
        q.eq("requesterId", user._id).eq("targetId", args.targetUserId)
      )
      .unique();

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        throw new ConvexError({
          message: "Follow request already sent",
          code: "CONFLICT",
        });
      }
      // Update existing rejected/accepted request to pending
      await ctx.db.patch(existingRequest._id, { status: "pending" });
      
      // Create notification
      await ctx.db.insert("notifications", {
        userId: args.targetUserId,
        type: "follow_request",
        actorId: user._id,
        followRequestId: existingRequest._id,
        isRead: false,
      });
      
      return existingRequest._id;
    }

    // Create new follow request
    const requestId = await ctx.db.insert("followRequests", {
      requesterId: user._id,
      targetId: args.targetUserId,
      status: "pending",
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.targetUserId,
      type: "follow_request",
      actorId: user._id,
      followRequestId: requestId,
      isRead: false,
    });

    return requestId;
  },
});

// Accept follow request
export const acceptFollowRequest = mutation({
  args: { requestId: v.id("followRequests") },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        message: "Follow request not found",
        code: "NOT_FOUND",
      });
    }

    // Verify user is the target
    if (request.targetId !== user._id) {
      throw new ConvexError({
        message: "Not authorized to accept this request",
        code: "FORBIDDEN",
      });
    }

    // Update request status
    await ctx.db.patch(args.requestId, { status: "accepted" });

    // Create follow relationship
    await ctx.db.insert("follows", {
      followerId: request.requesterId,
      followingId: request.targetId,
    });

    // Create notification for requester
    await ctx.db.insert("notifications", {
      userId: request.requesterId,
      type: "follow",
      actorId: user._id,
      isRead: false,
    });
  },
});

// Reject follow request
export const rejectFollowRequest = mutation({
  args: { requestId: v.id("followRequests") },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        message: "Follow request not found",
        code: "NOT_FOUND",
      });
    }

    // Verify user is the target
    if (request.targetId !== user._id) {
      throw new ConvexError({
        message: "Not authorized to reject this request",
        code: "FORBIDDEN",
      });
    }

    // Update request status
    await ctx.db.patch(args.requestId, { status: "rejected" });
  },
});

// Cancel follow request (by requester)
export const cancelFollowRequest = mutation({
  args: { requestId: v.id("followRequests") },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        message: "Follow request not found",
        code: "NOT_FOUND",
      });
    }

    // Verify user is the requester
    if (request.requesterId !== user._id) {
      throw new ConvexError({
        message: "Not authorized to cancel this request",
        code: "FORBIDDEN",
      });
    }

    // Delete the request
    await ctx.db.delete(args.requestId);
  },
});

// Get pending follow requests for current user
export const getPendingFollowRequests = query({
  args: {},
  handler: async (ctx) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const requests = await ctx.db
      .query("followRequests")
      .withIndex("by_target_and_status", (q) =>
        q.eq("targetId", user._id).eq("status", "pending")
      )
      .collect();

    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const requester = await ctx.db.get(request.requesterId);
        let profilePictureUrl = null;
        if (requester?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(requester.profilePicture);
        }
        return {
          ...request,
          requester: requester ? { ...requester, profilePictureUrl } : null,
        };
      })
    );

    return requestsWithUsers;
  },
});

// Check if follow request exists
export const getFollowRequestStatus = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return null;
    }

    const request = await ctx.db
      .query("followRequests")
      .withIndex("by_requester_and_target", (q) =>
        q.eq("requesterId", user._id).eq("targetId", args.targetUserId)
      )
      .unique();

    return request;
  },
});
