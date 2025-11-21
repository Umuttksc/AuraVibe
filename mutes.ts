import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const muteUser = mutation({
  args: { mutedId: v.id("users") },
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

    // Can't mute yourself
    if (user._id === args.mutedId) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Cannot mute yourself",
      });
    }

    // Check if already muted
    const existingMute = await ctx.db
      .query("mutes")
      .withIndex("by_muter_and_muted", (q) =>
        q.eq("muterId", user._id).eq("mutedId", args.mutedId)
      )
      .unique();

    if (existingMute) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "User already muted",
      });
    }

    // Create mute
    await ctx.db.insert("mutes", {
      muterId: user._id,
      mutedId: args.mutedId,
    });
  },
});

export const unmuteUser = mutation({
  args: { mutedId: v.id("users") },
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

    const mute = await ctx.db
      .query("mutes")
      .withIndex("by_muter_and_muted", (q) =>
        q.eq("muterId", user._id).eq("mutedId", args.mutedId)
      )
      .unique();

    if (!mute) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not muted",
      });
    }

    await ctx.db.delete(mute._id);
  },
});

export const getMutedUsers = query({
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

    const mutes = await ctx.db
      .query("mutes")
      .withIndex("by_muter", (q) => q.eq("muterId", user._id))
      .collect();

    const mutedUsers = await Promise.all(
      mutes.map(async (mute) => {
        const mutedUser = await ctx.db.get(mute.mutedId);
        if (!mutedUser) return null;

        let profilePictureUrl = null;
        if (mutedUser.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(mutedUser.profilePicture);
        }

        return {
          _id: mutedUser._id,
          name: mutedUser.name,
          username: mutedUser.username,
          profilePictureUrl,
          muteId: mute._id,
          mutedAt: new Date(mute._creationTime).toISOString(),
        };
      })
    );

    return mutedUsers.filter((user) => user !== null);
  },
});

export const isUserMuted = query({
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

    const mute = await ctx.db
      .query("mutes")
      .withIndex("by_muter_and_muted", (q) =>
        q.eq("muterId", user._id).eq("mutedId", args.userId)
      )
      .unique();

    return !!mute;
  },
});
