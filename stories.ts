import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// Generate upload URL for story image
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Create a new story
export const createStory = mutation({
  args: {
    imageId: v.id("_storage"),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    videoDuration: v.optional(v.number()),
    musicId: v.optional(v.id("music")),
  },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Stories expire after 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    const storyId = await ctx.db.insert("stories", {
      authorId: user._id,
      imageId: args.imageId,
      mediaType: args.mediaType,
      videoDuration: args.videoDuration,
      musicId: args.musicId,
      viewCount: 0,
      replyCount: 0,
      reactionCount: 0,
      expiresAt,
    });

    return storyId;
  },
});

// Get all active stories (not expired) grouped by user
export const getActiveStories = query({
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

    const now = Date.now();

    // Get all active stories
    const allStories = await ctx.db.query("stories").collect();
    const activeStories = allStories.filter((story) => story.expiresAt > now);

    // Group stories by user
    const userStoriesMap = new Map<
      Id<"users">,
      Array<{
        _id: Id<"stories">;
        _creationTime: number;
        imageId: Id<"_storage"> | undefined;
        viewCount: number;
        expiresAt: number;
        hasViewed: boolean;
      }>
    >();

    // Check which stories current user has viewed
    for (const story of activeStories) {
      const hasViewed = await ctx.db
        .query("storyViews")
        .withIndex("by_story_and_viewer", (q) =>
          q.eq("storyId", story._id).eq("viewerId", currentUser._id),
        )
        .unique();

      const userStories = userStoriesMap.get(story.authorId) || [];
      userStories.push({
        _id: story._id,
        _creationTime: story._creationTime,
        imageId: story.imageId || story.media?.[0]?.storageId,
        viewCount: story.viewCount,
        expiresAt: story.expiresAt,
        hasViewed: !!hasViewed,
      });
      userStoriesMap.set(story.authorId, userStories);
    }

    // Get user info for each author
    const result = [];
    for (const [authorId, stories] of userStoriesMap) {
      const author = await ctx.db.get(authorId);
      if (author) {
        const profilePictureUrl = author.profilePicture
          ? await ctx.storage.getUrl(author.profilePicture)
          : null;

        result.push({
          userId: authorId,
          username: author.username || author.name || "User",
          profilePictureUrl,
          stories: stories.map((s) => ({
            storyId: s._id,
            creationTime: new Date(s._creationTime).toISOString(),
            imageId: s.imageId,
            viewCount: s.viewCount,
            expiresAt: s.expiresAt,
            hasViewed: s.hasViewed,
          })),
          hasUnviewed: stories.some((s) => !s.hasViewed),
        });
      }
    }

    // Sort: current user first, then by unviewed, then by most recent story
    result.sort((a, b) => {
      if (a.userId === currentUser._id) return -1;
      if (b.userId === currentUser._id) return 1;
      if (a.hasUnviewed !== b.hasUnviewed) {
        return a.hasUnviewed ? -1 : 1;
      }
      const aLatest = Math.max(...a.stories.map((s) => s.expiresAt));
      const bLatest = Math.max(...b.stories.map((s) => s.expiresAt));
      return bLatest - aLatest;
    });

    return result;
  },
});

// Get a specific story with details
export const getStory = query({
  args: { storyId: v.id("stories") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const story = await ctx.db.get(args.storyId);
    if (!story) {
      throw new ConvexError({
        message: "Story not found",
        code: "NOT_FOUND",
      });
    }

    // Check if expired
    if (story.expiresAt < Date.now()) {
      throw new ConvexError({
        message: "Story has expired",
        code: "NOT_FOUND",
      });
    }

    const author = await ctx.db.get(story.authorId);
    if (!author) {
      throw new ConvexError({
        message: "Author not found",
        code: "NOT_FOUND",
      });
    }

    // Get media URL - prioritize new media array, fallback to legacy imageId
    const firstMediaId = story.media?.[0]?.storageId || story.imageId;
    const imageUrl = firstMediaId ? await ctx.storage.getUrl(firstMediaId) : null;
    const profilePictureUrl = author.profilePicture
      ? await ctx.storage.getUrl(author.profilePicture)
      : null;

    return {
      _id: story._id,
      author: {
        _id: author._id,
        username: author.username || author.name || "User",
        profilePictureUrl,
      },
      imageUrl,
      mediaType: story.mediaType || "image",
      videoDuration: story.videoDuration,
      viewCount: story.viewCount,
      creationTime: new Date(story._creationTime).toISOString(),
      expiresAt: story.expiresAt,
    };
  },
});

// Mark a story as viewed
export const markAsViewed = mutation({
  args: { storyId: v.id("stories") },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const story = await ctx.db.get(args.storyId);
    if (!story) {
      return;
    }

    // Check if already viewed
    const existingView = await ctx.db
      .query("storyViews")
      .withIndex("by_story_and_viewer", (q) =>
        q.eq("storyId", args.storyId).eq("viewerId", user._id),
      )
      .unique();

    if (!existingView) {
      // Add view
      await ctx.db.insert("storyViews", {
        storyId: args.storyId,
        viewerId: user._id,
      });

      // Increment view count
      await ctx.db.patch(args.storyId, {
        viewCount: story.viewCount + 1,
      });
    }
  },
});

// Delete a story
export const deleteStory = mutation({
  args: { storyId: v.id("stories") },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const story = await ctx.db.get(args.storyId);
    if (!story) {
      throw new ConvexError({
        message: "Story not found",
        code: "NOT_FOUND",
      });
    }

    // Only author can delete
    if (story.authorId !== user._id) {
      throw new ConvexError({
        message: "You can only delete your own stories",
        code: "FORBIDDEN",
      });
    }

    // Delete all views
    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    for (const view of views) {
      await ctx.db.delete(view._id);
    }

    // Delete story
    await ctx.db.delete(args.storyId);
  },
});

// Get viewers of a story (only for story author)
export const getStoryViewers = query({
  args: { storyId: v.id("stories") },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const story = await ctx.db.get(args.storyId);
    if (!story) {
      throw new ConvexError({
        message: "Story not found",
        code: "NOT_FOUND",
      });
    }

    // Only author can see viewers
    if (story.authorId !== user._id) {
      throw new ConvexError({
        message: "You can only view your own story viewers",
        code: "FORBIDDEN",
      });
    }

    const views = await ctx.db
      .query("storyViews")
      .withIndex("by_story", (q) => q.eq("storyId", args.storyId))
      .collect();

    const viewers = [];
    for (const view of views) {
      const viewer = await ctx.db.get(view.viewerId);
      if (viewer) {
        const profilePictureUrl = viewer.profilePicture
          ? await ctx.storage.getUrl(viewer.profilePicture)
          : null;

        viewers.push({
          _id: viewer._id,
          username: viewer.username || viewer.name || "User",
          profilePictureUrl,
          viewedAt: new Date(view._creationTime).toISOString(),
        });
      }
    }

    return viewers;
  },
});
