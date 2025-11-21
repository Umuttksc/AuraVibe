import { ConvexError, v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "./_generated/server";

export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    // Check if we've already stored this identity before.
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (user !== null) {
      return user._id;
    }

    // Check if this is the first user
    const allUsers = await ctx.db.query("users").collect();
    const isFirstUser = allUsers.length === 0;

    // If it's a new identity, create a new User.
    const newUserId = await ctx.db.insert("users", {
      name: identity.name,
      email: identity.email,
      tokenIdentifier: identity.tokenIdentifier,
      role: isFirstUser ? "admin" : "user",
      isSuperAdmin: isFirstUser,
      isBlocked: false,
      // Give welcome bonus tokens to first user (super admin)
      bonusTokens: isFirstUser ? 1000 : 0,
      giftTokens: 0,
      // Give full admin permissions to first user
      adminPermissions: isFirstUser ? {
        canManageUsers: true,
        canGrantTokens: true,
        canManageReports: true,
        canManageContent: true,
      } : undefined,
    });

    // Auto-follow auravibetr account
    const auravibeAccount = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", "auravibetr"))
      .unique();
    
    if (auravibeAccount) {
      await ctx.db.insert("follows", {
        followerId: newUserId,
        followingId: auravibeAccount._id,
      });
    }

    return newUserId;
  },
});

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    
    if (!user) {
      return null;
    }

    // Get storage URLs for profile picture and cover photo
    const profilePictureUrl = user.profilePicture
      ? await ctx.storage.getUrl(user.profilePicture)
      : null;
    
    const coverPhotoUrl = user.coverPhoto
      ? await ctx.storage.getUrl(user.coverPhoto)
      : null;

    return {
      ...user,
      profilePictureUrl,
      coverPhotoUrl,
    };
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    username: v.optional(v.string()),
    bio: v.optional(v.string()),
    profilePicture: v.optional(v.id("_storage")),
    coverPhoto: v.optional(v.id("_storage")),
    gender: v.optional(v.union(v.literal("female"), v.literal("male"), v.literal("other"))),
    location: v.optional(v.string()),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    website: v.optional(v.string()),
    maritalStatus: v.optional(v.union(
      v.literal("single"),
      v.literal("in_relationship"),
      v.literal("married"),
      v.literal("divorced"),
      v.literal("widowed")
    )),
    showMaritalStatus: v.optional(v.boolean()),
    isPrivate: v.optional(v.boolean()),
    allowBookQuestions: v.optional(v.boolean()),
    showGiftLevel: v.optional(v.boolean()),
  },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if username is taken by another user
    if (args.username !== undefined && args.username !== user.username) {
      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .unique();
      
      if (existingUser) {
        throw new ConvexError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }
    }

    await ctx.db.patch(user._id, {
      ...args,
    });

    return user._id;
  },
});

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    return user;
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    
    let profilePictureUrl = null;
    if (user.profilePicture) {
      profilePictureUrl = await ctx.storage.getUrl(user.profilePicture);
    }
    
    let coverPhotoUrl = null;
    if (user.coverPhoto) {
      coverPhotoUrl = await ctx.storage.getUrl(user.coverPhoto);
    }
    
    return {
      ...user,
      profilePictureUrl,
      coverPhotoUrl,
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const getSuggestedUsers = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    let currentUserId = null;
    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      currentUserId = currentUser?._id;
    }

    // Get all users
    const allUsers = await ctx.db.query("users").collect();
    
    // Get follower counts for each user
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const followers = await ctx.db
          .query("follows")
          .withIndex("by_following", (q) => q.eq("followingId", user._id))
          .collect();
        
        let isFollowing = false;
        if (currentUserId) {
          const follow = await ctx.db
            .query("follows")
            .withIndex("by_follower_and_following", (q) =>
              q.eq("followerId", currentUserId).eq("followingId", user._id)
            )
            .unique();
          isFollowing = !!follow;
        }

        return {
          ...user,
          followerCount: followers.length,
          isFollowing,
        };
      })
    );

    // Filter out current user and sort by follower count
    const filteredUsers = usersWithStats
      .filter((user) => user._id !== currentUserId)
      .sort((a, b) => b.followerCount - a.followerCount)
      .slice(0, args.limit);

    return filteredUsers;
  },
});

export const searchUsers = query({
  args: { searchQuery: v.string() },
  handler: async (ctx, args) => {
    if (!args.searchQuery.trim()) {
      return [];
    }

    const identity = await ctx.auth.getUserIdentity();
    let currentUserId = null;
    if (identity) {
      const currentUser = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();
      currentUserId = currentUser?._id;
    }

    const allUsers = await ctx.db.query("users").collect();
    const searchLower = args.searchQuery.toLowerCase();
    
    const filteredUsers = allUsers.filter((user) => {
      const name = user.name?.toLowerCase() || "";
      const username = user.username?.toLowerCase() || "";
      const bio = user.bio?.toLowerCase() || "";
      return name.includes(searchLower) || username.includes(searchLower) || bio.includes(searchLower);
    });

    // Add following status
    const usersWithFollowStatus = await Promise.all(
      filteredUsers.map(async (user) => {
        let isFollowing = false;
        if (currentUserId) {
          const follow = await ctx.db
            .query("follows")
            .withIndex("by_follower_and_following", (q) =>
              q.eq("followerId", currentUserId).eq("followingId", user._id)
            )
            .unique();
          isFollowing = !!follow;
        }

        const followers = await ctx.db
          .query("follows")
          .withIndex("by_following", (q) => q.eq("followingId", user._id))
          .collect();

        return {
          ...user,
          isFollowing,
          followerCount: followers.length,
        };
      })
    );

    return usersWithFollowStatus.slice(0, 20);
  },
});

// Check if username is available
export const checkUsernameAvailability = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const username = args.username.trim().toLowerCase();
    
    if (username.length < 3) {
      return { available: false, message: "Kullanıcı adı en az 3 karakter olmalı" };
    }
    
    if (username.length > 20) {
      return { available: false, message: "Kullanıcı adı en fazla 20 karakter olabilir" };
    }
    
    if (!/^[a-z0-9_]+$/.test(username)) {
      return { available: false, message: "Sadece küçük harf, rakam ve alt çizgi kullanılabilir" };
    }
    
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    
    if (existingUser) {
      return { available: false, message: "Bu kullanıcı adı zaten alınmış" };
    }
    
    return { available: true, message: "Kullanıcı adı müsait" };
  },
});

// Suggest alternative usernames
export const getOnlineUsers = query({
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

    // Get users we're following
    const following = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", currentUser._id))
      .collect();

    const followingIds = following.map((f) => f.followingId);

    // Get some random users (up to 20 total)
    const allUsers = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("_id"), currentUser._id))
      .filter((q) => q.neq(q.field("isBlocked"), true))
      .take(20);

    // Build online users list with avatar URLs
    const onlineUsers = await Promise.all(
      allUsers.map(async (user) => {
        const avatarUrl = user.profilePicture
          ? await ctx.storage.getUrl(user.profilePicture)
          : null;

        return {
          _id: user._id,
          name: user.name,
          username: user.username,
          avatar: avatarUrl,
          isOnline: true, // Simulated - in real app would check last activity
          isFollowing: followingIds.includes(user._id),
        };
      })
    );

    return onlineUsers;
  },
});

export const suggestAlternativeUsernames = query({
  args: { baseUsername: v.string() },
  handler: async (ctx, args) => {
    const base = args.baseUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const suggestions: string[] = [];
    
    // Generate alternatives
    const alternatives = [
      base,
      `${base}_${Math.floor(Math.random() * 999)}`,
      `${base}_${Math.floor(Math.random() * 9999)}`,
      `${base}_official`,
      `real_${base}`,
      `${base}_tr`,
    ];
    
    // Check each alternative
    for (const alt of alternatives) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", alt))
        .unique();
      
      if (!existing && alt.length >= 3 && alt.length <= 20) {
        suggestions.push(alt);
      }
      
      if (suggestions.length >= 3) break;
    }
    
    return suggestions;
  },
});

// Set username for the first time
export const setUsername = mutation({
  args: { username: v.string() },
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
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if user already has a username
    if (user.username) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Username already set",
      });
    }

    const username = args.username.trim().toLowerCase();
    
    // Validate username
    if (username.length < 3 || username.length > 20) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Kullanıcı adı 3-20 karakter arasında olmalı",
      });
    }
    
    if (!/^[a-z0-9_]+$/.test(username)) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Sadece küçük harf, rakam ve alt çizgi kullanılabilir",
      });
    }

    // Check if username is taken
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    
    if (existingUser) {
      throw new ConvexError({
        code: "CONFLICT",
        message: "Bu kullanıcı adı zaten alınmış",
      });
    }

    // Set username
    await ctx.db.patch(user._id, { username });

    return user._id;
  },
});

// Internal: Get user by token identifier
export const getUserByTokenIdentifier = internalQuery({
  args: {
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    
    return user;
  },
});

// Internal: Update Stripe customer ID
export const updateStripeCustomerId = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
    });
  },
});

// Toggle private profile
export const togglePrivateProfile = mutation({
  args: {},
  handler: async (ctx) => {
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
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const newPrivateStatus = !user.isPrivate;

    await ctx.db.patch(user._id, {
      isPrivate: newPrivateStatus,
    });

    return { isPrivate: newPrivateStatus };
  },
});
