import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, checkAdminPermission } from "./helpers.js";

// Check if user is admin
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    return user?.role === "admin";
  },
});

// Check if user is super admin
export const isSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return false;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    return user?.isSuperAdmin === true;
  },
});

// Get dashboard statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const posts = await ctx.db.query("posts").collect();
    const stories = await ctx.db.query("stories").collect();
    const messages = await ctx.db.query("messages").collect();
    const conversations = await ctx.db.query("conversations").collect();

    // Calculate growth (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsers = users.filter(u => u._creationTime > sevenDaysAgo).length;
    const newPosts = posts.filter(p => p._creationTime > sevenDaysAgo).length;

    return {
      totalUsers: users.length,
      totalPosts: posts.length,
      totalStories: stories.length,
      totalMessages: messages.length,
      totalConversations: conversations.length,
      newUsersThisWeek: newUsers,
      newPostsThisWeek: newPosts,
      activeUsers: users.filter(u => !u.isBlocked).length,
      blockedUsers: users.filter(u => u.isBlocked).length,
    };
  },
});

// Get all users with pagination
export const getUsers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const users = await ctx.db
      .query("users")
      .order("desc")
      .take(args.limit || 50);

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const posts = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", user._id))
          .collect();

        const followers = await ctx.db
          .query("follows")
          .withIndex("by_following", (q) => q.eq("followingId", user._id))
          .collect();

        const following = await ctx.db
          .query("follows")
          .withIndex("by_follower", (q) => q.eq("followerId", user._id))
          .collect();

        return {
          ...user,
          postsCount: posts.length,
          followersCount: followers.length,
          followingCount: following.length,
        };
      })
    );

    return usersWithStats;
  },
});

// Get all admin users
export const getAdminUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    
    // Filter admin and super admin users
    const adminUsers = users.filter((u) => u.role === "admin" || u.isSuperAdmin);

    const adminsWithStats = await Promise.all(
      adminUsers.map(async (user) => {
        const posts = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", user._id))
          .collect();

        return {
          ...user,
          postsCount: posts.length,
        };
      })
    );

    return adminsWithStats;
  },
});

// Update user role (only super admin can make others admin)
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAdmin(ctx);
    
    // Only super admin can assign or remove admin role
    if (!currentUser.isSuperAdmin) {
      throw new ConvexError({
        message: "Sadece süper admin yetkileri değiştirebilir",
        code: "FORBIDDEN",
      });
    }

    const targetUser = await ctx.db.get(args.userId);
    
    // Cannot modify super admin
    if (targetUser?.isSuperAdmin) {
      throw new ConvexError({
        message: "Süper adminin rolü değiştirilemez",
        code: "FORBIDDEN",
      });
    }

    // When making someone admin, give them default permissions if they don't have any
    const updates: {
      role: "admin" | "user";
      adminPermissions?: {
        canManageUsers: boolean;
        canGrantTokens: boolean;
        canManageReports: boolean;
        canManageContent: boolean;
      };
    } = { role: args.role };

    if (args.role === "admin" && !targetUser?.adminPermissions) {
      updates.adminPermissions = {
        canManageUsers: true,
        canGrantTokens: true,
        canManageReports: true,
        canManageContent: true,
      };
    }

    await ctx.db.patch(args.userId, updates);
  },
});

// Block/unblock user
export const toggleBlockUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx, "canManageUsers");
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.userId, { 
      isBlocked: !user.isBlocked 
    });
  },
});

// Verify/unverify user
export const toggleVerifyUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx, "canManageUsers");
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(args.userId, { 
      isVerified: !user.isVerified 
    });
  },
});

// Delete user
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await checkAdminPermission(ctx, "canManageUsers");
    
    const targetUser = await ctx.db.get(args.userId);
    if (targetUser?.isSuperAdmin) {
      throw new ConvexError({
        message: "Baş admin silinemez",
        code: "FORBIDDEN",
      });
    }
    
    await ctx.db.delete(args.userId);
  },
});

// Get recent activity
export const getRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const recentPosts = await ctx.db
      .query("posts")
      .order("desc")
      .take(10);

    const recentUsers = await ctx.db
      .query("users")
      .order("desc")
      .take(10);

    const activities = [];

    for (const post of recentPosts) {
      const author = await ctx.db.get(post.authorId);
      activities.push({
        type: "post" as const,
        user: author?.username || author?.name || "Unknown",
        content: post.content.substring(0, 50),
        timestamp: post._creationTime,
      });
    }

    for (const user of recentUsers) {
      activities.push({
        type: "user" as const,
        user: user.username || user.name || "Unknown",
        content: "Yeni kullanıcı kaydı",
        timestamp: user._creationTime,
      });
    }

    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  },
});

// Get user details including messages
export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Get user's conversations
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const userConversations = conversations.filter(
      (c) => c.participant1Id === args.userId || c.participant2Id === args.userId
    );

    // Get messages from conversations
    const conversationIds = userConversations.map((c) => c._id);
    const allMessages = [];

    for (const convId of conversationIds) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", (q) => q.eq("conversationId", convId))
        .order("desc")
        .take(50);

      for (const message of messages) {
        const otherParticipantId = 
          userConversations.find((c) => c._id === convId)?.participant1Id === args.userId
            ? userConversations.find((c) => c._id === convId)?.participant2Id
            : userConversations.find((c) => c._id === convId)?.participant1Id;

        const otherUser = otherParticipantId ? await ctx.db.get(otherParticipantId) : null;

        allMessages.push({
          ...message,
          conversationWith: otherUser?.username || otherUser?.name || "Unknown",
          isSentByUser: message.senderId === args.userId,
        });
      }
    }

    // Get user's posts
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_author", (q) => q.eq("authorId", args.userId))
      .order("desc")
      .take(20);

    return {
      user,
      messages: allMessages.sort((a, b) => b._creationTime - a._creationTime),
      posts,
    };
  },
});

// Ads Management
export const getAllAds = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const ads = await ctx.db.query("ads").order("desc").collect();
    
    const adsWithImages = await Promise.all(
      ads.map(async (ad) => {
        const imageUrl = ad.imageId 
          ? await ctx.storage.getUrl(ad.imageId)
          : null;
        return {
          ...ad,
          imageUrl,
        };
      })
    );
    
    return adsWithImages;
  },
});

export const createAd = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    linkUrl: v.optional(v.string()),
    placement: v.union(
      v.literal("home_feed"),
      v.literal("profile_top"),
      v.literal("explore_top"),
      v.literal("story"),
    ),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    return await ctx.db.insert("ads", {
      ...args,
      impressions: 0,
      clicks: 0,
    });
  },
});

export const updateAd = mutation({
  args: {
    adId: v.id("ads"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    linkUrl: v.optional(v.string()),
    placement: v.optional(v.union(
      v.literal("home_feed"),
      v.literal("profile_top"),
      v.literal("explore_top"),
      v.literal("story"),
    )),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const { adId, ...updates } = args;
    await ctx.db.patch(adId, updates);
  },
});

export const deleteAd = mutation({
  args: { adId: v.id("ads") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.adId);
  },
});

export const generateAdUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

// Get multiple users' data for export
export const getUsersDataExport = query({
  args: {
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const usersData = await Promise.all(
      args.userIds.map(async (userId) => {
        const user = await ctx.db.get(userId);
        if (!user) return null;

        // Get posts count
        const posts = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", userId))
          .collect();

        // Get followers count
        const followers = await ctx.db
          .query("follows")
          .withIndex("by_following", (q) => q.eq("followingId", userId))
          .collect();

        // Get following count
        const following = await ctx.db
          .query("follows")
          .withIndex("by_follower", (q) => q.eq("followerId", userId))
          .collect();

        // Get conversations
        const allConversations = await ctx.db.query("conversations").collect();
        const userConversations = allConversations.filter(
          (c) => c.participant1Id === userId || c.participant2Id === userId
        );

        // Get messages count
        let totalMessages = 0;
        for (const conv of userConversations) {
          const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
            .collect();
          totalMessages += messages.length;
        }

        // Get last activity (most recent post or message)
        const recentPosts = await ctx.db
          .query("posts")
          .withIndex("by_author", (q) => q.eq("authorId", userId))
          .order("desc")
          .take(1);

        let lastActivity = user._creationTime;
        if (recentPosts.length > 0) {
          lastActivity = Math.max(lastActivity, recentPosts[0]._creationTime);
        }

        return {
          _id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          isSuperAdmin: user.isSuperAdmin,
          isBlocked: user.isBlocked,
          bio: user.bio,
          location: user.location,
          city: user.city,
          country: user.country,
          postsCount: posts.length,
          followersCount: followers.length,
          followingCount: following.length,
          conversationsCount: userConversations.length,
          totalMessages,
          createdAt: user._creationTime,
          lastActivity,
        };
      })
    );

    return usersData.filter((user) => user !== null);
  },
});

// Admin: Set user's gift level (ONLY SUPER ADMIN)
export const setUserGiftLevel = mutation({
  args: {
    userId: v.id("users"),
    level: v.number(),
  },
  handler: async (ctx, args) => {
    // Only super admin can set user levels
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED",
      });
    }
    
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!currentUser?.isSuperAdmin) {
      throw new ConvexError({
        message: "Sadece süper admin kullanıcı seviyesi ayarlayabilir",
        code: "FORBIDDEN",
      });
    }
    
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }
    
    // Ensure level is between 0 and 100
    const level = Math.max(0, Math.min(100, args.level));
    
    // Auto-verify users who reach level 50+
    const shouldAutoVerify = level >= 50 && !user.isVerified;
    
    await ctx.db.patch(args.userId, {
      giftLevel: level,
      ...(shouldAutoVerify && { isVerified: true }),
    });
    
    // Create notification for user
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "token_grant",
      actorId: args.userId,
      isRead: false,
      message: `Hediye seviyeniz ${level} olarak ayarlandı!${shouldAutoVerify ? " Otomatik olarak doğrulandınız." : ""}`,
    });
    
    return { success: true, newLevel: level, autoVerified: shouldAutoVerify };
  },
});

// Test: Set current user's gift level
export const setMyGiftLevel = mutation({
  args: {
    level: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED",
      });
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }
    
    // Auto-verify users who reach level 50+
    const shouldAutoVerify = args.level >= 50 && !user.isVerified;
    
    await ctx.db.patch(user._id, {
      giftLevel: args.level,
      ...(shouldAutoVerify && { isVerified: true }),
    });
    
    return { success: true, newLevel: args.level, autoVerified: shouldAutoVerify };
  },
});

// Update admin permissions (ONLY SUPER ADMIN)
export const updateAdminPermissions = mutation({
  args: {
    userId: v.id("users"),
    permissions: v.object({
      canManageUsers: v.boolean(),
      canGrantTokens: v.boolean(),
      canManageReports: v.boolean(),
      canManageContent: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED",
      });
    }
    
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!currentUser?.isSuperAdmin) {
      throw new ConvexError({
        message: "Sadece süper admin yetkileri değiştirebilir",
        code: "FORBIDDEN",
      });
    }
    
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }
    
    // Cannot modify super admin permissions
    if (targetUser.isSuperAdmin) {
      throw new ConvexError({
        message: "Süper adminin yetkileri değiştirilemez",
        code: "FORBIDDEN",
      });
    }
    
    // User must be admin
    if (targetUser.role !== "admin") {
      throw new ConvexError({
        message: "Sadece admin kullanıcıların yetkileri değiştirilebilir",
        code: "FORBIDDEN",
      });
    }
    
    await ctx.db.patch(args.userId, {
      adminPermissions: args.permissions,
    });
    
    return { success: true };
  },
});

// Banned words management
export const getBannedWords = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    
    const bannedWords = await ctx.db.query("bannedWords").collect();
    
    return bannedWords.sort((a, b) => a.word.localeCompare(b.word));
  },
});

export const addBannedWord = mutation({
  args: {
    word: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    
    // Check permission
    if (!user.isSuperAdmin) {
      const hasPermission = await checkAdminPermission(ctx, "canManageContent");
      if (!hasPermission) {
        throw new ConvexError({
          message: "Bu işlem için yetkiniz yok",
          code: "FORBIDDEN",
        });
      }
    }
    
    // Check if word already exists
    const existing = await ctx.db
      .query("bannedWords")
      .collect();
    
    const wordExists = existing.some(
      (w) => w.word.toLowerCase() === args.word.toLowerCase()
    );
    
    if (wordExists) {
      throw new ConvexError({
        message: "Bu kelime zaten yasaklı listede",
        code: "BAD_REQUEST",
      });
    }
    
    const wordId = await ctx.db.insert("bannedWords", {
      word: args.word,
      isActive: true,
    });
    
    return wordId;
  },
});

export const toggleBannedWord = mutation({
  args: {
    wordId: v.id("bannedWords"),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    
    // Check permission
    if (!user.isSuperAdmin) {
      const hasPermission = await checkAdminPermission(ctx, "canManageContent");
      if (!hasPermission) {
        throw new ConvexError({
          message: "Bu işlem için yetkiniz yok",
          code: "FORBIDDEN",
        });
      }
    }
    
    const word = await ctx.db.get(args.wordId);
    if (!word) {
      throw new ConvexError({
        message: "Kelime bulunamadı",
        code: "NOT_FOUND",
      });
    }
    
    await ctx.db.patch(args.wordId, {
      isActive: !word.isActive,
    });
    
    return { success: true };
  },
});

export const deleteBannedWord = mutation({
  args: {
    wordId: v.id("bannedWords"),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    
    // Check permission
    if (!user.isSuperAdmin) {
      const hasPermission = await checkAdminPermission(ctx, "canManageContent");
      if (!hasPermission) {
        throw new ConvexError({
          message: "Bu işlem için yetkiniz yok",
          code: "FORBIDDEN",
        });
      }
    }
    
    await ctx.db.delete(args.wordId);
    
    return { success: true };
  },
});

// Make current user the PERMANENT super admin
// This locks the super admin role to the current user's token forever
export const makeFirstUserSuperAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Giriş yapmanız gerekiyor",
        code: "UNAUTHENTICATED",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!currentUser) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Check if a super admin token is already set
    const existingSuperAdminSetting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "superAdminToken"))
      .unique();

    // If super admin token is already set and it's not this user
    if (existingSuperAdminSetting && existingSuperAdminSetting.value !== identity.tokenIdentifier) {
      throw new ConvexError({
        message: "Süper admin zaten başka bir kullanıcı tarafından ayarlanmış. Sadece o kullanıcı süper admin olabilir.",
        code: "FORBIDDEN",
      });
    }

    // Check if user is already super admin
    if (currentUser.isSuperAdmin) {
      return {
        success: true,
        message: "Zaten kalıcı süper adminsiniz! Binlerce kişi uygulamayı indirse bile sadece siz süper admin olabilirsiniz.",
        alreadySuperAdmin: true,
      };
    }

    // Set this user's token as the permanent super admin token
    if (existingSuperAdminSetting) {
      await ctx.db.patch(existingSuperAdminSetting._id, {
        value: identity.tokenIdentifier,
      });
    } else {
      await ctx.db.insert("appSettings", {
        key: "superAdminToken",
        value: identity.tokenIdentifier,
      });
    }

    // Make user super admin
    await ctx.db.patch(currentUser._id, {
      isSuperAdmin: true,
      role: "admin",
      adminPermissions: {
        canManageUsers: true,
        canGrantTokens: true,
        canManageReports: true,
        canManageContent: true,
      },
    });

    return {
      success: true,
      message: "Tebrikler! Artık kalıcı süper adminsiniz. Binlerce kişi uygulamayı indirse bile, sadece siz süper admin olabilirsiniz.",
      madeSuperAdmin: true,
      permanent: true,
    };
  },
});

// Check if current user is the permanent super admin
export const canBecomeSuperAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { canBecome: false, reason: "not_authenticated" };
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!currentUser) {
      return { canBecome: false, reason: "user_not_found" };
    }

    // Check if already super admin
    if (currentUser.isSuperAdmin) {
      return { canBecome: true, reason: "already_super_admin" };
    }

    // Check if a super admin token is already set
    const existingSuperAdminSetting = await ctx.db
      .query("appSettings")
      .withIndex("by_key", (q) => q.eq("key", "superAdminToken"))
      .unique();

    // If no super admin token is set, current user can become super admin
    if (!existingSuperAdminSetting) {
      return { canBecome: true, reason: "no_super_admin_set" };
    }

    // If super admin token is set and it matches current user's token
    if (existingSuperAdminSetting.value === identity.tokenIdentifier) {
      return { canBecome: true, reason: "token_matches" };
    }

    // Super admin token is set for another user
    return { canBecome: false, reason: "super_admin_already_set" };
  },
});

// DANGEROUS: Reset all data (ONLY SUPER ADMIN)
// This will delete all user-generated content but preserve users table
export const resetAllData = mutation({
  args: {
    confirmationCode: v.string(),
  },
  handler: async (ctx, args) => {
    // Only super admin can reset all data
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Not authenticated",
        code: "UNAUTHENTICATED",
      });
    }
    
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    
    if (!currentUser?.isSuperAdmin) {
      throw new ConvexError({
        message: "Sadece süper admin tüm verileri sıfırlayabilir",
        code: "FORBIDDEN",
      });
    }
    
    // Confirmation code must match
    if (args.confirmationCode !== "RESET_ALL_DATA") {
      throw new ConvexError({
        message: "Onay kodu yanlış",
        code: "BAD_REQUEST",
      });
    }
    
    // Track deleted counts
    const deletedCounts: Record<string, number> = {};
    
    // Delete all content tables (EXCEPT users)
    const contentTables = [
      "posts",
      "postEditHistory",
      "likes",
      "comments",
      "stories",
      "storyReplies",
      "storyViews",
      "messages",
      "conversations",
      "groupMessages",
      "groupMembers",
      "follows",
      "followRequests",
      "blocks",
      "mutes",
      "notifications",
      "savedPosts",
      "reports",
      "hashtags",
      "polls",
      "pollVotes",
      "communities",
      "communityMembers",
      "communityPosts",
      "verificationRequests",
      "achievements",
      "userAchievements",
      "books",
      "bookQuestions",
      "ads",
      "music",
      "gifts",
      "giftTransactions",
      "giftPayments",
      "tokens",
      "tokenPayments",
      "wallets",
      "walletTransactions",
      "fortunes",
      "fortuneInterpretations",
      "tarotInterpretations",
      "dreams",
      "dreamInterpretations",
      "notes",
      "journal",
      "menstrualCycles",
      "menstrualSymptoms",
      "ovulationTracking",
      "sexualHealth",
      "wellnessMood",
      "wellnessSleep",
      "wellnessSymptoms",
      "wellnessMedications",
      "wellnessHabits",
      "wellnessGoals",
      "water",
      "exercises",
      "militaryService",
      "militaryEvents",
      "prayerTimes",
      "quranProgress",
      "islamicGuides",
      "islamicDiscussions",
      "firstAidGuides",
      "dailyKnowledge",
      "chatbotConversations",
      "chatbotMessages",
      "games",
      "memoryGames",
      "connectFourGames",
      "sudokuGames",
      "minesweeperGames",
      "bannedWords",
    ];
    
    // Delete all documents from each table
    for (const tableName of contentTables) {
      try {
        // Query all documents from the table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allDocs = await ctx.db.query(tableName as any).collect();
        deletedCounts[tableName] = allDocs.length;
        
        // Delete each document
        for (const doc of allDocs) {
          await ctx.db.delete(doc._id);
        }
      } catch (error) {
        // Table might not exist or other error, skip it
        deletedCounts[tableName] = 0;
      }
    }
    
    // Also reset user stats but keep user accounts
    const allUsers = await ctx.db.query("users").collect();
    for (const user of allUsers) {
      await ctx.db.patch(user._id, {
        giftLevel: 0,
        totalGiftSpent: 0,
        giftTokens: 0,
        bonusTokens: 0,
        isPremium: false,
        dailyCoffeeUsed: 0,
        dailyTarotUsed: 0,
      });
    }
    
    return {
      success: true,
      message: "Tüm veriler başarıyla sıfırlandı",
      deletedCounts,
      totalDeleted: Object.values(deletedCounts).reduce((sum, count) => sum + count, 0),
    };
  },
});
