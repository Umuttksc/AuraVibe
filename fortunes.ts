import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

export const getFortunes = query({
  args: {
    startDate: v.optional(v.string()), // ISO date string (YYYY-MM-DD)
    endDate: v.optional(v.string()),   // ISO date string (YYYY-MM-DD)
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const fortunes = await ctx.db
      .query("fortunes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Filter by date if provided
    let filteredFortunes = fortunes;
    if (args.startDate || args.endDate) {
      filteredFortunes = fortunes.filter((fortune) => {
        const fortuneDate = fortune.date; // ISO date string YYYY-MM-DD
        if (args.startDate && fortuneDate < args.startDate) return false;
        if (args.endDate && fortuneDate > args.endDate) return false;
        return true;
      });
    }

    // Get image URLs for fortunes that have images
    const fortunesWithImages = await Promise.all(
      filteredFortunes.map(async (fortune) => {
        let imageUrl = null;
        if ((fortune.fortuneType === "coffee" || fortune.fortuneType === "palm" || fortune.fortuneType === "aura") && fortune.imageId) {
          imageUrl = await ctx.storage.getUrl(fortune.imageId);
        }
        return {
          ...fortune,
          imageUrl,
        };
      })
    );

    return fortunesWithImages;
  },
});

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

export const addFortune = mutation({
  args: {
    fortuneType: v.union(
      v.literal("coffee"),
      v.literal("tarot"),
      v.literal("palm"),
      v.literal("birthchart"),
      v.literal("aura")
    ),
    imageId: v.optional(v.id("_storage")),
    category: v.union(
      v.literal("love"),
      v.literal("general"),
      v.literal("career"),
      v.literal("health"),
      v.literal("money")
    ),
    date: v.string(),
    tarotCards: v.optional(v.array(v.string())),
    // Birth chart fields
    birthDate: v.optional(v.string()),
    birthTime: v.optional(v.string()),
    birthPlace: v.optional(v.string()),
    // Payment tracking
    paymentId: v.optional(v.id("fortunePayments")),
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const id = await ctx.db.insert("fortunes", {
      userId: user._id,
      fortuneType: args.fortuneType,
      imageId: args.imageId,
      category: args.category,
      date: args.date,
      isInterpreted: false,
      tarotCards: args.tarotCards,
      birthDate: args.birthDate,
      birthTime: args.birthTime,
      birthPlace: args.birthPlace,
    });

    // If this fortune used a paid credit, mark the payment as used
    if (args.paymentId) {
      await ctx.db.patch(args.paymentId, {
        fortuneId: id,
      });
    }

    return id;
  },
});

export const updateFortune = mutation({
  args: {
    fortuneId: v.id("fortunes"),
    interpretation: v.optional(v.string()),
    isInterpreted: v.optional(v.boolean()),
    tarotCards: v.optional(v.array(v.string())),
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const fortune = await ctx.db.get(args.fortuneId);
    if (!fortune) {
      throw new ConvexError({
        message: "Fortune not found",
        code: "NOT_FOUND",
      });
    }

    if (fortune.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    const { fortuneId, ...updates } = args;
    await ctx.db.patch(fortuneId, updates);
  },
});

// Toggle fortune hidden status (user can hide/show fortune from their profile)
export const toggleFortuneHidden = mutation({
  args: { fortuneId: v.id("fortunes") },
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

    const fortune = await ctx.db.get(args.fortuneId);
    if (!fortune) {
      throw new ConvexError({
        message: "Fortune not found",
        code: "NOT_FOUND",
      });
    }

    if (fortune.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.fortuneId, {
      isHidden: !fortune.isHidden,
    });

    return { isHidden: !fortune.isHidden };
  },
});

// Toggle fortune favorite status
export const toggleFortuneFavorite = mutation({
  args: { fortuneId: v.id("fortunes") },
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

    const fortune = await ctx.db.get(args.fortuneId);
    if (!fortune) {
      throw new ConvexError({
        message: "Fortune not found",
        code: "NOT_FOUND",
      });
    }

    if (fortune.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.fortuneId, {
      isFavorite: !fortune.isFavorite,
    });

    return { isFavorite: !fortune.isFavorite };
  },
});

// Update fortune notes
export const updateFortuneNotes = mutation({
  args: {
    fortuneId: v.id("fortunes"),
    notes: v.string(),
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const fortune = await ctx.db.get(args.fortuneId);
    if (!fortune) {
      throw new ConvexError({
        message: "Fortune not found",
        code: "NOT_FOUND",
      });
    }

    if (fortune.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.patch(args.fortuneId, {
      notes: args.notes,
    });
  },
});

// Toggle fortune public visibility
export const toggleFortunePublic = mutation({
  args: { fortuneId: v.id("fortunes") },
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

    const fortune = await ctx.db.get(args.fortuneId);
    if (!fortune) {
      throw new ConvexError({
        message: "Fortune not found",
        code: "NOT_FOUND",
      });
    }

    if (fortune.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    const newIsPublic = !fortune.isPublic;
    const now = Date.now();

    await ctx.db.patch(args.fortuneId, {
      isPublic: newIsPublic,
      publicSince: newIsPublic ? now : undefined,
      likeCount: newIsPublic ? (fortune.likeCount || 0) : 0,
      commentCount: newIsPublic ? (fortune.commentCount || 0) : 0,
      viewCount: newIsPublic ? (fortune.viewCount || 0) : 0,
      reactionCount: newIsPublic ? (fortune.reactionCount || 0) : 0,
    });

    return { isPublic: newIsPublic };
  },
});

// Share fortune as a post
export const shareFortuneAsPost = mutation({
  args: {
    fortuneId: v.id("fortunes"),
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const fortune = await ctx.db.get(args.fortuneId);
    if (!fortune) {
      throw new ConvexError({
        message: "Fortune not found",
        code: "NOT_FOUND",
      });
    }

    if (fortune.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    if (!fortune.isInterpreted || !fortune.interpretation) {
      throw new ConvexError({
        message: "Fortune must be interpreted before sharing",
        code: "BAD_REQUEST",
      });
    }

    // Check if already shared
    if (fortune.sharedPostId) {
      throw new ConvexError({
        message: "Fortune already shared as post",
        code: "CONFLICT",
      });
    }

    // Create post content
    const fortuneTypeEmoji = fortune.fortuneType === "coffee" ? "☕" : "🔮";
    const categoryEmojis: Record<string, string> = {
      love: "❤️",
      general: "🔮",
      career: "💼",
      health: "🏥",
      money: "💰",
    };
    const categoryLabels: Record<string, string> = {
      love: "Aşk Hayatı",
      general: "Genel",
      career: "İş ve Kariyer",
      health: "Sağlık",
      money: "Para ve Finans",
    };

    const postContent = `${fortuneTypeEmoji} ${fortune.fortuneType === "coffee" ? "Kahve Falı" : "Tarot"} ${categoryEmojis[fortune.category]} ${categoryLabels[fortune.category]}

${fortune.interpretation}

#AuraFal #${fortune.fortuneType === "coffee" ? "KahveFalı" : "Tarot"} #${fortune.category}`;

    // Create the post
    const postId = await ctx.db.insert("posts", {
      authorId: user._id,
      content: postContent,
      imageId: fortune.imageId, // Include coffee cup image if available
      likeCount: 0,
      commentCount: 0,
    });

    // Update fortune with post link
    await ctx.db.patch(args.fortuneId, {
      sharedPostId: postId,
      isPublic: true, // Make fortune public when shared
    });

    return { postId };
  },
});

// Get user's public fortunes (for profile display)
export const getPublicFortunes = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    const fortunes = await ctx.db
      .query("fortunes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isPublic"), true),
          q.eq(q.field("isInterpreted"), true),
          q.neq(q.field("isHidden"), true) // Exclude hidden fortunes
        )
      )
      .order("desc")
      .collect();

    // Filter out fortunes older than 24 hours
    const activeFortunes = fortunes.filter(f => {
      if (!f.publicSince) return true; // Keep old fortunes without publicSince
      return f.publicSince > twentyFourHoursAgo;
    });

    // Get image URLs and user info
    const fortunesWithImages = await Promise.all(
      activeFortunes.map(async (fortune) => {
        let imageUrl = null;
        if ((fortune.fortuneType === "coffee" || fortune.fortuneType === "palm" || fortune.fortuneType === "aura") && fortune.imageId) {
          imageUrl = await ctx.storage.getUrl(fortune.imageId);
        }
        
        const user = await ctx.db.get(fortune.userId);
        let profilePictureUrl = null;
        if (user?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(user.profilePicture);
        }
        
        return {
          ...fortune,
          imageUrl,
          author: user ? { ...user, profilePictureUrl } : null,
        };
      })
    );

    return fortunesWithImages;
  },
});

// Toggle fortune like
export const toggleFortuneLike = mutation({
  args: { fortuneId: v.id("fortunes") },
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

    const fortune = await ctx.db.get(args.fortuneId);
    if (!fortune) {
      throw new ConvexError({
        message: "Fortune not found",
        code: "NOT_FOUND",
      });
    }

    const existingLike = await ctx.db
      .query("fortuneLikes")
      .withIndex("by_fortune_and_user", (q) =>
        q.eq("fortuneId", args.fortuneId).eq("userId", user._id)
      )
      .unique();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.fortuneId, {
        likeCount: Math.max(0, (fortune.likeCount || 0) - 1),
      });
      return { isLiked: false };
    } else {
      await ctx.db.insert("fortuneLikes", {
        fortuneId: args.fortuneId,
        userId: user._id,
      });
      await ctx.db.patch(args.fortuneId, {
        likeCount: (fortune.likeCount || 0) + 1,
      });
      return { isLiked: true };
    }
  },
});

// Add fortune comment
export const addFortuneComment = mutation({
  args: {
    fortuneId: v.id("fortunes"),
    content: v.string(),
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
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    const fortune = await ctx.db.get(args.fortuneId);
    if (!fortune) {
      throw new ConvexError({
        message: "Fortune not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.insert("fortuneComments", {
      fortuneId: args.fortuneId,
      authorId: user._id,
      content: args.content,
    });

    await ctx.db.patch(args.fortuneId, {
      commentCount: (fortune.commentCount || 0) + 1,
    });
  },
});

// Delete fortune comment
export const deleteFortuneComment = mutation({
  args: { commentId: v.id("fortuneComments") },
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

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError({
        message: "Comment not found",
        code: "NOT_FOUND",
      });
    }

    const fortune = await ctx.db.get(comment.fortuneId);
    if (!fortune) {
      throw new ConvexError({
        message: "Fortune not found",
        code: "NOT_FOUND",
      });
    }

    // Check if user is comment author or fortune owner
    if (comment.authorId !== user._id && fortune.userId !== user._id) {
      throw new ConvexError({
        message: "Unauthorized",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.commentId);
    await ctx.db.patch(comment.fortuneId, {
      commentCount: Math.max(0, (fortune.commentCount || 0) - 1),
    });
  },
});

// Toggle fortune comment like
export const toggleFortuneCommentLike = mutation({
  args: { commentId: v.id("fortuneComments") },
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

    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new ConvexError({
        message: "Comment not found",
        code: "NOT_FOUND",
      });
    }

    const existingLike = await ctx.db
      .query("fortuneCommentLikes")
      .withIndex("by_comment_and_user", (q) =>
        q.eq("commentId", args.commentId).eq("userId", user._id)
      )
      .unique();

    if (existingLike) {
      await ctx.db.delete(existingLike._id);
      await ctx.db.patch(args.commentId, {
        likeCount: Math.max(0, (comment.likeCount || 0) - 1),
      });
      return { isLiked: false };
    } else {
      await ctx.db.insert("fortuneCommentLikes", {
        commentId: args.commentId,
        userId: user._id,
      });
      await ctx.db.patch(args.commentId, {
        likeCount: (comment.likeCount || 0) + 1,
      });
      return { isLiked: true };
    }
  },
});

// Get fortune comment likes
export const getFortuneCommentLikes = query({
  args: { commentId: v.id("fortuneComments") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("fortuneCommentLikes")
      .withIndex("by_comment", (q) => q.eq("commentId", args.commentId))
      .collect();

    return likes;
  },
});

// Get fortune comments
export const getFortuneComments = query({
  args: { fortuneId: v.id("fortunes") },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("fortuneComments")
      .withIndex("by_fortune", (q) => q.eq("fortuneId", args.fortuneId))
      .order("desc")
      .collect();

    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.authorId);
        let profilePictureUrl = null;
        if (user?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(user.profilePicture);
        }
        return {
          ...comment,
          author: user ? { ...user, profilePictureUrl } : null,
        };
      })
    );

    return commentsWithUsers;
  },
});

// Add fortune view
export const addFortuneView = mutation({
  args: { fortuneId: v.id("fortunes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) {
      return;
    }

    const fortune = await ctx.db.get(args.fortuneId);
    if (!fortune || fortune.userId === user._id) {
      return;
    }

    const existingView = await ctx.db
      .query("fortuneViews")
      .withIndex("by_fortune_and_viewer", (q) =>
        q.eq("fortuneId", args.fortuneId).eq("viewerId", user._id)
      )
      .unique();

    if (!existingView) {
      await ctx.db.insert("fortuneViews", {
        fortuneId: args.fortuneId,
        viewerId: user._id,
      });
      await ctx.db.patch(args.fortuneId, {
        viewCount: (fortune.viewCount || 0) + 1,
      });
    }
  },
});

// Get fortune views
export const getFortuneViews = query({
  args: { fortuneId: v.id("fortunes") },
  handler: async (ctx, args) => {
    const views = await ctx.db
      .query("fortuneViews")
      .withIndex("by_fortune", (q) => q.eq("fortuneId", args.fortuneId))
      .collect();

    const usersWithViews = await Promise.all(
      views.map(async (view) => {
        const user = await ctx.db.get(view.viewerId);
        let profilePictureUrl = null;
        if (user?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(user.profilePicture);
        }
        return {
          ...view,
          viewer: user ? { ...user, profilePictureUrl } : null,
        };
      })
    );

    return usersWithViews;
  },
});

// Get fortune likes
export const getFortuneLikes = query({
  args: { fortuneId: v.id("fortunes") },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("fortuneLikes")
      .withIndex("by_fortune", (q) => q.eq("fortuneId", args.fortuneId))
      .collect();

    const usersWithLikes = await Promise.all(
      likes.map(async (like) => {
        const user = await ctx.db.get(like.userId);
        let profilePictureUrl = null;
        if (user?.profilePicture) {
          profilePictureUrl = await ctx.storage.getUrl(user.profilePicture);
        }
        return {
          ...like,
          user: user ? { ...user, profilePictureUrl } : null,
        };
      })
    );

    return usersWithLikes;
  },
});

