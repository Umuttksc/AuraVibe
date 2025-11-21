import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./helpers";

// Track profile view
export const trackProfileView = mutation({
  args: { profileUserId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let viewerUserId = null;

    if (identity) {
      const viewer = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      viewerUserId = viewer?._id;
    }

    // Don't track if viewing own profile
    if (viewerUserId === args.profileUserId) {
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if already viewed today by this viewer
    if (viewerUserId) {
      const existingView = await ctx.db
        .query("profileViews")
        .withIndex("by_profile_and_date", (q) =>
          q.eq("profileUserId", args.profileUserId).eq("date", today)
        )
        .filter((q) => q.eq(q.field("viewerUserId"), viewerUserId))
        .first();

      if (existingView) {
        return; // Already tracked today
      }
    }

    // Track the view
    await ctx.db.insert("profileViews", {
      profileUserId: args.profileUserId,
      viewerUserId: viewerUserId || undefined,
      date: today,
    });
  },
});

// Track post view
export const trackPostView = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    let viewerUserId = null;

    if (identity) {
      const viewer = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier)
        )
        .unique();
      viewerUserId = viewer?._id;
    }

    // Check if already viewed by this viewer
    if (viewerUserId) {
      const existingView = await ctx.db
        .query("postViews")
        .withIndex("by_post_and_viewer", (q) =>
          q.eq("postId", args.postId).eq("viewerUserId", viewerUserId)
        )
        .unique();

      if (existingView) {
        return; // Already tracked
      }
    }

    // Track the view
    await ctx.db.insert("postViews", {
      postId: args.postId,
      viewerUserId: viewerUserId || undefined,
    });
  },
});

// Get profile analytics for current user
export const getProfileAnalytics = query({
  args: { days: v.optional(v.number()) }, // Number of days to look back (default 30)
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const days = args.days || 30;

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all profile views
    const allViews = await ctx.db
      .query("profileViews")
      .withIndex("by_profile", (q) => q.eq("profileUserId", user._id))
      .collect();

    // Filter views by date range
    const recentViews = allViews.filter((view) => {
      const viewDate = new Date(view.date);
      return viewDate >= startDate && viewDate <= endDate;
    });

    // Group views by date
    const viewsByDate: Record<string, number> = {};
    recentViews.forEach((view) => {
      viewsByDate[view.date] = (viewsByDate[view.date] || 0) + 1;
    });

    // Get unique viewers
    const uniqueViewers = new Set(
      recentViews.filter((v) => v.viewerUserId).map((v) => v.viewerUserId)
    ).size;

    // Get follower count
    const followers = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();

    // Get following count
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", user._id))
      .collect();

    // Get posts count and engagement
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    const totalLikes = posts.reduce((sum, post) => sum + post.likeCount, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.commentCount, 0);

    // Get post views count
    const postViews = await Promise.all(
      posts.map(async (post) => {
        const views = await ctx.db
          .query("postViews")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();
        return views.length;
      })
    );
    const totalPostViews = postViews.reduce((sum, count) => sum + count, 0);

    return {
      profileViews: {
        total: recentViews.length,
        unique: uniqueViewers,
        byDate: viewsByDate,
      },
      followers: {
        count: followers.length,
      },
      following: {
        count: following.length,
      },
      posts: {
        count: posts.length,
        totalLikes,
        totalComments,
        totalViews: totalPostViews,
        avgLikesPerPost: posts.length > 0 ? totalLikes / posts.length : 0,
        avgCommentsPerPost: posts.length > 0 ? totalComments / posts.length : 0,
        avgViewsPerPost: posts.length > 0 ? totalPostViews / posts.length : 0,
      },
      engagement: {
        totalInteractions: totalLikes + totalComments,
        engagementRate:
          totalPostViews > 0
            ? ((totalLikes + totalComments) / totalPostViews) * 100
            : 0,
      },
    };
  },
});

// Get top posts by engagement
export const getTopPosts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = args.limit || 5;

    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    // Sort by engagement (likes + comments)
    const sortedPosts = posts
      .map((post) => ({
        ...post,
        engagement: post.likeCount + post.commentCount * 2, // Comments worth 2x
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, limit);

    // Enrich with view counts
    const enrichedPosts = await Promise.all(
      sortedPosts.map(async (post) => {
        const views = await ctx.db
          .query("postViews")
          .withIndex("by_post", (q) => q.eq("postId", post._id))
          .collect();

        let imageUrl = null;
        if (post.imageId) {
          imageUrl = await ctx.storage.getUrl(post.imageId);
        }

        return {
          _id: post._id,
          content: post.content.substring(0, 100), // First 100 chars
          imageUrl,
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          viewCount: views.length,
          engagement: post.engagement,
          createdAt: new Date(post._creationTime).toISOString(),
        };
      })
    );

    return enrichedPosts;
  },
});

// Get follower growth over time
export const getFollowerGrowth = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const days = args.days || 30;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all follows for this user
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id))
      .collect();

    // Group by date
    const growthByDate: Record<string, number> = {};
    follows.forEach((follow) => {
      const date = new Date(follow._creationTime).toISOString().split("T")[0];
      const followDate = new Date(date);
      
      if (followDate >= startDate && followDate <= endDate) {
        growthByDate[date] = (growthByDate[date] || 0) + 1;
      }
    });

    // Calculate cumulative growth
    const dates = Object.keys(growthByDate).sort();
    let cumulative = 0;
    const cumulativeGrowth: Record<string, number> = {};
    
    dates.forEach((date) => {
      cumulative += growthByDate[date];
      cumulativeGrowth[date] = cumulative;
    });

    return {
      byDate: growthByDate,
      cumulative: cumulativeGrowth,
      totalNew: Object.values(growthByDate).reduce((sum, count) => sum + count, 0),
    };
  },
});

// Get recent profile visitors
export const getRecentVisitors = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = args.limit || 10;

    const views = await ctx.db
      .query("profileViews")
      .withIndex("by_profile", (q) => q.eq("profileUserId", user._id))
      .order("desc")
      .take(100);

    // Get unique recent visitors
    const visitorIds = new Set<string>();
    const uniqueViews = views.filter((view) => {
      if (!view.viewerUserId || visitorIds.has(view.viewerUserId)) {
        return false;
      }
      visitorIds.add(view.viewerUserId);
      return true;
    }).slice(0, limit);

    // Enrich with user details
    const visitors = await Promise.all(
      uniqueViews.map(async (view) => {
        if (!view.viewerUserId) return null;
        
        const visitor = await ctx.db.get(view.viewerUserId);
        if (!visitor) return null;

        let profilePictureUrl = null;
        if (visitor.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(visitor.profilePicture);
        }

        return {
          _id: visitor._id,
          name: visitor.name,
          username: visitor.username,
          profilePictureUrl,
          isVerified: visitor.isVerified,
          viewedAt: new Date(view._creationTime).toISOString(),
        };
      })
    );

    return visitors.filter((v) => v !== null);
  },
});

// Get content performance summary
export const getContentPerformance = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);

    // Get posts from last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const allPosts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", user._id))
      .collect();

    const recentPosts = allPosts.filter((post) => post._creationTime > thirtyDaysAgo);

    // Posts with media vs without
    const postsWithMedia = recentPosts.filter((p) => p.imageId);
    const postsWithoutMedia = recentPosts.filter((p) => !p.imageId);

    const avgLikesWithMedia = postsWithMedia.length > 0
      ? postsWithMedia.reduce((sum, p) => sum + p.likeCount, 0) / postsWithMedia.length
      : 0;

    const avgLikesWithoutMedia = postsWithoutMedia.length > 0
      ? postsWithoutMedia.reduce((sum, p) => sum + p.likeCount, 0) / postsWithoutMedia.length
      : 0;

    // Best posting time (by hour)
    const postsByHour: Record<number, { count: number; totalLikes: number }> = {};
    recentPosts.forEach((post) => {
      const hour = new Date(post._creationTime).getHours();
      if (!postsByHour[hour]) {
        postsByHour[hour] = { count: 0, totalLikes: 0 };
      }
      postsByHour[hour].count++;
      postsByHour[hour].totalLikes += post.likeCount;
    });

    const bestHour = Object.entries(postsByHour)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avgLikes: data.totalLikes / data.count,
      }))
      .sort((a, b) => b.avgLikes - a.avgLikes)[0];

    return {
      last30Days: {
        totalPosts: recentPosts.length,
        withMedia: postsWithMedia.length,
        withoutMedia: postsWithoutMedia.length,
        avgLikesWithMedia,
        avgLikesWithoutMedia,
      },
      bestPostingHour: bestHour?.hour,
    };
  },
});
