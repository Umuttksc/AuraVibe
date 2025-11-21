import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Start a video call
export const startCall = mutation({
  args: {
    conversationId: v.id("conversations"),
    receiverId: v.id("users"),
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

    // Check if there's already an active call
    const existingCall = await ctx.db
      .query("videoCalls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "calling"),
          q.eq(q.field("status"), "ringing"),
          q.eq(q.field("status"), "accepted")
        )
      )
      .first();

    if (existingCall) {
      throw new ConvexError({
        message: "Bir arama zaten devam ediyor",
        code: "CONFLICT",
      });
    }

    // Create call
    const callId = await ctx.db.insert("videoCalls", {
      callerId: currentUser._id,
      receiverId: args.receiverId,
      conversationId: args.conversationId,
      status: "calling",
    });

    return callId;
  },
});

// Answer a video call
export const answerCall = mutation({
  args: {
    callId: v.id("videoCalls"),
    accept: v.boolean(),
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

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new ConvexError({
        message: "Arama bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Verify user is the receiver
    if (call.receiverId !== currentUser._id) {
      throw new ConvexError({
        message: "Bu aramayı cevaplayamazsınız",
        code: "FORBIDDEN",
      });
    }

    if (args.accept) {
      await ctx.db.patch(args.callId, {
        status: "accepted",
        startedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.callId, {
        status: "rejected",
        endedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// End a video call
export const endCall = mutation({
  args: {
    callId: v.id("videoCalls"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new ConvexError({
        message: "Arama bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const duration = call.startedAt ? Math.floor((Date.now() - call.startedAt) / 1000) : 0;

    await ctx.db.patch(args.callId, {
      status: "ended",
      endedAt: Date.now(),
      duration,
    });

    return { success: true, duration };
  },
});

// Get active call for a conversation
export const getActiveCall = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const call = await ctx.db
      .query("videoCalls")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "calling"),
          q.eq(q.field("status"), "ringing"),
          q.eq(q.field("status"), "accepted")
        )
      )
      .order("desc")
      .first();

    if (!call) return null;

    const caller = await ctx.db.get(call.callerId);
    const receiver = await ctx.db.get(call.receiverId);

    return {
      _id: call._id,
      caller: {
        _id: caller?._id,
        name: caller?.name || caller?.username || "User",
      },
      receiver: {
        _id: receiver?._id,
        name: receiver?.name || receiver?.username || "User",
      },
      status: call.status,
      startedAt: call.startedAt,
    };
  },
});

// Get incoming calls for current user
export const getIncomingCalls = query({
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

    const calls = await ctx.db
      .query("videoCalls")
      .withIndex("by_receiver", (q) => q.eq("receiverId", currentUser._id))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "calling"), q.eq(q.field("status"), "ringing"))
      )
      .order("desc")
      .take(5);

    const callsWithDetails = await Promise.all(
      calls.map(async (call) => {
        const caller = await ctx.db.get(call.callerId);
        const callerProfilePicture = caller?.profilePicture
          ? await ctx.storage.getUrl(caller.profilePicture)
          : null;

        return {
          _id: call._id,
          caller: {
            _id: caller?._id,
            name: caller?.name || caller?.username || "User",
            profilePictureUrl: callerProfilePicture,
          },
          conversationId: call.conversationId,
          createdAt: new Date(call._creationTime).toISOString(),
        };
      })
    );

    return callsWithDetails;
  },
});

// WebRTC Signaling mutations

// Set offer from caller
export const setOffer = mutation({
  args: {
    callId: v.id("videoCalls"),
    offer: v.string(), // JSON stringified RTCSessionDescription
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new ConvexError({
        message: "Arama bulunamadı",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.callId, {
      offer: args.offer,
    });

    return { success: true };
  },
});

// Set answer from receiver
export const setAnswer = mutation({
  args: {
    callId: v.id("videoCalls"),
    answer: v.string(), // JSON stringified RTCSessionDescription
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new ConvexError({
        message: "Arama bulunamadı",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.callId, {
      answer: args.answer,
    });

    return { success: true };
  },
});

// Add ICE candidate
export const addIceCandidate = mutation({
  args: {
    callId: v.id("videoCalls"),
    candidate: v.string(), // JSON stringified RTCIceCandidate
    isCaller: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      throw new ConvexError({
        message: "Arama bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Add candidate to appropriate array
    if (args.isCaller) {
      const existing = call.callerIceCandidates || [];
      await ctx.db.patch(args.callId, {
        callerIceCandidates: [...existing, args.candidate],
      });
    } else {
      const existing = call.receiverIceCandidates || [];
      await ctx.db.patch(args.callId, {
        receiverIceCandidates: [...existing, args.candidate],
      });
    }

    return { success: true };
  },
});

// Get signaling data for a call
export const getCallSignaling = query({
  args: {
    callId: v.id("videoCalls"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const call = await ctx.db.get(args.callId);
    if (!call) {
      return null;
    }

    return {
      offer: call.offer,
      answer: call.answer,
      callerIceCandidates: call.callerIceCandidates || [],
      receiverIceCandidates: call.receiverIceCandidates || [],
    };
  },
});
