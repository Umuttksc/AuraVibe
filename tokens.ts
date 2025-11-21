import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { checkAdminPermission } from "./helpers.js";

// Get token balance (only visible to self and super admin)
export const getTokenBalance = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!currentUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Check if requesting own balance or if super admin
    const targetUserId = args.userId || currentUser._id;
    const isSuperAdmin = currentUser.isSuperAdmin === true;
    const isOwnBalance = targetUserId === currentUser._id;

    if (!isOwnBalance && !isSuperAdmin) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Not authorized to view token balance",
      });
    }

    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Target user not found",
      });
    }

    const paidTokens = targetUser.giftTokens ?? 0;
    const bonusTokens = targetUser.bonusTokens ?? 0;
    
    return {
      tokens: paidTokens + bonusTokens, // Total tokens (paid + bonus)
      paidTokens,
      bonusTokens,
      showTokens: targetUser.showGiftTokens ?? false,
    };
  },
});

// Get token settings
export const getTokenSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("tokenSettings").first();
    
    // Default settings if not found
    if (!settings) {
      return {
        packages: [
          { tokens: 10, price: 10000, bonus: 0 }, // 100 TL = 10 tokens
          { tokens: 25, price: 24000, bonus: 1 }, // 240 TL = 25 tokens + 1 bonus
          { tokens: 50, price: 45000, bonus: 5 }, // 450 TL = 50 tokens + 5 bonus
          { tokens: 100, price: 85000, bonus: 15 }, // 850 TL = 100 tokens + 15 bonus
        ],
        tokenValue: 1000, // 1 token = 10 TL
      };
    }

    return settings;
  },
});

// Update token settings (admin only)
export const updateTokenSettings = mutation({
  args: {
    packages: v.array(v.object({
      tokens: v.number(),
      price: v.number(),
      bonus: v.optional(v.number()),
    })),
    tokenValue: v.number(),
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const existing = await ctx.db.query("tokenSettings").first();
    
    if (existing) {
      await ctx.db.patch(existing._id, {
        packages: args.packages,
        tokenValue: args.tokenValue,
      });
    } else {
      await ctx.db.insert("tokenSettings", {
        packages: args.packages,
        tokenValue: args.tokenValue,
      });
    }

    return { success: true };
  },
});

// Toggle token visibility
export const toggleTokenVisibility = mutation({
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const newValue = !(user.showGiftTokens ?? false);
    await ctx.db.patch(user._id, {
      showGiftTokens: newValue,
    });

    return { showTokens: newValue };
  },
});

// Use tokens to send a gift (internal)
export const useTokensForGift = mutation({
  args: {
    userId: v.id("users"),
    tokensRequired: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const currentTokens = user.giftTokens ?? 0;
    if (currentTokens < args.tokensRequired) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Insufficient tokens",
      });
    }

    await ctx.db.patch(args.userId, {
      giftTokens: currentTokens - args.tokensRequired,
    });

    return { success: true, remainingTokens: currentTokens - args.tokensRequired };
  },
});

// Get token purchase history
export const getTokenPurchaseHistory = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return [];
    }

    const purchases = await ctx.db
      .query("tokenPurchases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return purchases.map((p) => ({
      ...p,
      createdAt: new Date(p._creationTime).toISOString(),
    }));
  },
});

// Admin: Get all token purchases
export const getAllTokenPurchases = query({
  args: { limit: v.optional(v.number()) },
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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Admin access required",
      });
    }

    const purchases = await ctx.db
      .query("tokenPurchases")
      .order("desc")
      .take(args.limit || 100);

    const purchasesWithUsers = await Promise.all(
      purchases.map(async (purchase) => {
        const user = await ctx.db.get(purchase.userId);
        return {
          ...purchase,
          user: user ? {
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
          } : null,
          createdAt: new Date(purchase._creationTime).toISOString(),
        };
      })
    );

    return purchasesWithUsers;
  },
});

// Admin: Grant bonus tokens to user (no revenue for recipients when used)
export const grantTokensToUser = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Giriş yapmalısınız",
      });
    }

    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!adminUser) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Kullanıcı bulunamadı",
      });
    }

    // Check if user is admin (super admin or regular admin with permission)
    if (adminUser.role !== "admin") {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "❌ Bu işlem için admin yetkisi gerekiyor. Lütfen /admin/setup sayfasından 'Rolleri Ayarla' butonuna tıklayın.",
      });
    }

    // If not super admin, check specific permission
    if (!adminUser.isSuperAdmin) {
      if (!adminUser.adminPermissions?.canGrantTokens) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "❌ Jeton yükleme yetkiniz yok! Lütfen /admin/setup sayfasından 'Rolleri Ayarla' butonuna tıklayarak admin izinlerinizi düzeltin.",
        });
      }
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Kullanıcı bulunamadı",
      });
    }

    // Add bonus tokens (these don't generate revenue for recipients)
    const currentBonusTokens = user.bonusTokens ?? 0;
    const newBonusTokens = currentBonusTokens + args.amount;

    await ctx.db.patch(args.userId, {
      bonusTokens: newBonusTokens,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "token_grant",
      actorId: adminUser._id, // Admin who granted the tokens
      isRead: false,
      message: `${args.amount} bonus jeton hesabınıza eklendi!${args.reason ? ` (${args.reason})` : ""}`,
    });

    const totalTokens = (user.giftTokens ?? 0) + newBonusTokens;
    return { success: true, newBalance: totalTokens, bonusTokens: newBonusTokens };
  },
});

// Internal: Create token purchase record
export const createTokenPurchase = internalMutation({
  args: {
    userId: v.id("users"),
    tokens: v.number(),
    price: v.number(),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tokenPurchases", {
      userId: args.userId,
      tokens: args.tokens,
      price: args.price,
      stripeSessionId: args.stripeSessionId,
      status: "pending",
    });
  },
});

// Internal: Complete token purchase
export const completeTokenPurchase = internalMutation({
  args: {
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the pending purchase
    const purchase = await ctx.db
      .query("tokenPurchases")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .first();

    if (!purchase) {
      console.error("Token purchase not found:", args.stripeSessionId);
      return;
    }

    if (purchase.status === "completed") {
      console.log("Token purchase already completed:", args.stripeSessionId);
      return;
    }

    // Update purchase status
    await ctx.db.patch(purchase._id, {
      status: "completed",
    });

    // Add tokens to user
    const user = await ctx.db.get(purchase.userId);
    if (!user) {
      console.error("User not found for token purchase:", purchase.userId);
      return;
    }

    const currentTokens = user.giftTokens ?? 0;
    const newTokens = currentTokens + purchase.tokens;

    await ctx.db.patch(purchase.userId, {
      giftTokens: newTokens,
    });

    // Create notification
    await ctx.db.insert("notifications", {
      userId: purchase.userId,
      type: "token_grant" as const,
      actorId: purchase.userId, // Self notification
      isRead: false,
      message: `${purchase.tokens} jeton satın aldınız! Yeni bakiye: ${newTokens}`,
    });
  },
});
