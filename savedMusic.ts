import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Save music to user's library
export const saveToLibrary = mutation({
  args: {
    title: v.string(),
    artist: v.string(),
    audioUrl: v.string(),
    albumArt: v.optional(v.string()),
    duration: v.optional(v.number()),
    genre: v.optional(v.string()),
    source: v.string(),
    sourceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmalısınız",
        code: "UNAUTHENTICATED",
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
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Check if already saved (for external sources with sourceId)
    if (args.sourceId) {
      const existing = await ctx.db
        .query("savedMusic")
        .withIndex("by_user_and_source_id", (q) =>
          q.eq("userId", user._id).eq("sourceId", args.sourceId),
        )
        .first();

      if (existing) {
        throw new ConvexError({
          message: "Bu müzik zaten kütüphanenizde",
          code: "CONFLICT",
        });
      }
    }

    // Save to library
    await ctx.db.insert("savedMusic", {
      userId: user._id,
      title: args.title,
      artist: args.artist,
      audioUrl: args.audioUrl,
      albumArt: args.albumArt,
      duration: args.duration,
      genre: args.genre,
      source: args.source,
      sourceId: args.sourceId,
    });

    return { success: true };
  },
});

// Get user's saved music library
export const getSavedMusic = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    const savedMusic = await ctx.db
      .query("savedMusic")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return savedMusic;
  },
});

// Remove music from library
export const removeFromLibrary = mutation({
  args: {
    musicId: v.id("savedMusic"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmalısınız",
        code: "UNAUTHENTICATED",
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
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const music = await ctx.db.get(args.musicId);
    if (!music) {
      throw new ConvexError({
        message: "Müzik bulunamadı",
        code: "NOT_FOUND",
      });
    }

    if (music.userId !== user._id) {
      throw new ConvexError({
        message: "Bu müziği silemezsiniz",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.musicId);
    return { success: true };
  },
});

// Check if music is saved
export const isMusicSaved = query({
  args: {
    sourceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.sourceId) return false;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) return false;

    const saved = await ctx.db
      .query("savedMusic")
      .withIndex("by_user_and_source_id", (q) =>
        q.eq("userId", user._id).eq("sourceId", args.sourceId),
      )
      .first();

    return !!saved;
  },
});
