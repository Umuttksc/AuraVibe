import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Helper function to extract hashtags from text
export function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[a-zA-ZğüşıöçĞÜŞİÖÇ0-9_]+/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  
  // Remove # and convert to lowercase, remove duplicates
  const tags = matches.map((tag) => tag.substring(1).toLowerCase());
  return Array.from(new Set(tags));
}

export const getTrendingHashtags = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const hashtags = await ctx.db.query("hashtags").collect();
    
    // Sort by usage count and recency
    const sortedHashtags = hashtags
      .sort((a, b) => {
        // Weight: 70% post count, 30% recency
        const aScore = a.postCount * 0.7 + (a.lastUsedAt / Date.now()) * 0.3;
        const bScore = b.postCount * 0.7 + (b.lastUsedAt / Date.now()) * 0.3;
        return bScore - aScore;
      })
      .slice(0, limit);

    return sortedHashtags.map((hashtag) => ({
      ...hashtag,
      tag: `#${hashtag.tag}`,
    }));
  },
});

export const getHashtagDetails = query({
  args: { tag: v.string() },
  handler: async (ctx, args) => {
    // Remove # if present
    const cleanTag = args.tag.replace("#", "").toLowerCase();
    
    const hashtag = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q) => q.eq("tag", cleanTag))
      .unique();

    if (!hashtag) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Hashtag not found",
      });
    }

    return {
      ...hashtag,
      tag: `#${hashtag.tag}`,
    };
  },
});

export const getPostsByHashtag = query({
  args: { tag: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    // Remove # if present
    const cleanTag = args.tag.replace("#", "").toLowerCase();
    
    const hashtag = await ctx.db
      .query("hashtags")
      .withIndex("by_tag", (q) => q.eq("tag", cleanTag))
      .unique();

    if (!hashtag) {
      return {
        page: [],
        isDone: true,
        continueCursor: "",
      };
    }

    // Get all post-hashtag relationships for this hashtag
    const postHashtags = await ctx.db
      .query("postHashtags")
      .withIndex("by_hashtag", (q) => q.eq("hashtagId", hashtag._id))
      .collect();

    // Get all posts
    const posts = await Promise.all(
      postHashtags.map(async (ph) => {
        const post = await ctx.db.get(ph.postId);
        return post;
      })
    );

    // Filter out null posts and sort by creation time
    const validPosts = posts
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .sort((a, b) => b._creationTime - a._creationTime);

    // Manual pagination
    const startIndex = args.paginationOpts.cursor
      ? parseInt(args.paginationOpts.cursor)
      : 0;
    const endIndex = startIndex + args.paginationOpts.numItems;
    const paginatedPosts = validPosts.slice(startIndex, endIndex);

    const postsWithDetails = await Promise.all(
      paginatedPosts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        const music = post.musicId ? await ctx.db.get(post.musicId) : null;
        const identity = await ctx.auth.getUserIdentity();

        let isLikedByCurrentUser = false;
        if (identity) {
          const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
              q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

          if (currentUser) {
            const like = await ctx.db
              .query("likes")
              .withIndex("by_post_and_user", (q) =>
                q.eq("postId", post._id).eq("userId", currentUser._id)
              )
              .unique();
            isLikedByCurrentUser = !!like;
          }
        }

        return {
          ...post,
          author,
          music,
          isLikedByCurrentUser,
          createdAt: new Date(post._creationTime).toISOString(),
        };
      })
    );

    return {
      page: postsWithDetails,
      isDone: endIndex >= validPosts.length,
      continueCursor:
        endIndex >= validPosts.length ? "" : endIndex.toString(),
    };
  },
});

export const updateHashtagsForPost = internalMutation({
  args: {
    postId: v.id("posts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const tags = extractHashtags(args.content);
    
    // Get or create hashtags
    const hashtagIds = await Promise.all(
      tags.map(async (tag) => {
        const existing = await ctx.db
          .query("hashtags")
          .withIndex("by_tag", (q) => q.eq("tag", tag))
          .unique();

        if (existing) {
          // Update count and last used time
          await ctx.db.patch(existing._id, {
            postCount: existing.postCount + 1,
            lastUsedAt: Date.now(),
          });
          return existing._id;
        } else {
          // Create new hashtag
          return await ctx.db.insert("hashtags", {
            tag,
            postCount: 1,
            lastUsedAt: Date.now(),
          });
        }
      })
    );

    // Create post-hashtag relationships
    await Promise.all(
      hashtagIds.map(async (hashtagId) => {
        // Check if relationship already exists
        const existing = await ctx.db
          .query("postHashtags")
          .withIndex("by_post_and_hashtag", (q) =>
            q.eq("postId", args.postId).eq("hashtagId", hashtagId)
          )
          .unique();

        if (!existing) {
          await ctx.db.insert("postHashtags", {
            postId: args.postId,
            hashtagId,
          });
        }
      })
    );
  },
});
