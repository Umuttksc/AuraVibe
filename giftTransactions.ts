import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal, api } from "./_generated/api.js";
import { ConvexError } from "convex/values";

// Internal: Record gift transaction
export const recordGiftTransaction = internalMutation({
  args: {
    senderId: v.id("users"),
    recipientId: v.id("users"),
    giftId: v.id("gifts"),
    conversationId: v.id("conversations"),
    amount: v.number(),
    quantity: v.optional(v.number()),
    platformShare: v.number(),
    recipientShare: v.number(),
    stripeSessionId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("giftTransactions", args);
    return id;
  },
});

// Internal: Complete gift transaction (called from webhook)
export const completeGiftTransaction = internalMutation({
  args: {
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the transaction
    const transaction = await ctx.db
      .query("giftTransactions")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .first();

    if (!transaction) {
      throw new ConvexError({
        message: "Transaction not found",
        code: "NOT_FOUND",
      });
    }

    if (transaction.status === "completed") {
      // Already completed
      return { success: true };
    }

    // Update transaction status
    await ctx.db.patch(transaction._id, { status: "completed" });

    // Update sender's gift level
    const sender = await ctx.db.get(transaction.senderId);
    if (sender) {
      const currentSpent = sender.totalGiftSpent ?? 0;
      const newTotalSpent = currentSpent + transaction.amount;
      
      // Get wallet settings for level calculation
      const settings = await ctx.runQuery(api.walletSettings.getWalletSettings, {});
      const levelThreshold = settings?.levelThreshold ?? 1000000; // 10,000 TL
      const maxLevel = settings?.maxLevel ?? 100;
      
      // Calculate new level
      const newLevel = Math.min(
        Math.floor(newTotalSpent / levelThreshold),
        maxLevel
      );
      
      // Auto-verify users who reach level 50+
      const shouldAutoVerify = newLevel >= 50 && !sender.isVerified;
      
      await ctx.db.patch(transaction.senderId, {
        totalGiftSpent: newTotalSpent,
        giftLevel: newLevel,
        ...(shouldAutoVerify && { isVerified: true }),
      });
    }

    // Add recipient's share to their wallet
    await ctx.runMutation(internal.wallets.addFundsToWallet, {
      userId: transaction.recipientId,
      amount: transaction.recipientShare,
      giftTransactionId: transaction._id,
    });

    // Create a message with the gift
    await ctx.db.insert("messages", {
      conversationId: transaction.conversationId,
      senderId: transaction.senderId,
      content: `🎁 Hediye gönderdi!`, // This will be enriched with gift data in the UI
      isRead: false,
    });

    return { success: true };
  },
});

// Send gift using tokens
export const sendGiftWithTokens = mutation({
  args: {
    recipientId: v.id("users"),
    giftId: v.id("gifts"),
    conversationId: v.id("conversations"),
    quantity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const sender = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!sender) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Get gift details
    const gift = await ctx.db.get(args.giftId);
    if (!gift) {
      throw new ConvexError({
        message: "Gift not found",
        code: "NOT_FOUND",
      });
    }

    if (!gift.isActive || gift.isDeleted) {
      throw new ConvexError({
        message: "Gift is not available",
        code: "BAD_REQUEST",
      });
    }

    // Calculate token cost
    const quantity = args.quantity || 1;
    const tokenSettings = await ctx.runQuery(api.tokens.getTokenSettings, {});
    const tokenValue = tokenSettings.tokenValue || 1000; // Default 1 token = 10 TL
    const totalPrice = gift.price * quantity;
    const tokensRequired = Math.ceil(totalPrice / tokenValue);

    // Check total token balance (bonus + paid)
    const currentBonusTokens = sender.bonusTokens ?? 0;
    const currentPaidTokens = sender.giftTokens ?? 0;
    const totalTokens = currentBonusTokens + currentPaidTokens;
    
    if (totalTokens < tokensRequired) {
      throw new ConvexError({
        message: `Yetersiz jeton. ${tokensRequired} jeton gerekli, ${totalTokens} jetonunuz var.`,
        code: "BAD_REQUEST",
      });
    }

    // Deduct tokens: use bonus tokens first, then paid tokens
    let bonusUsed = 0;
    let paidUsed = 0;
    
    if (currentBonusTokens >= tokensRequired) {
      // All bonus tokens
      bonusUsed = tokensRequired;
      await ctx.db.patch(sender._id, {
        bonusTokens: currentBonusTokens - tokensRequired,
      });
    } else if (currentBonusTokens > 0) {
      // Mix of bonus and paid
      bonusUsed = currentBonusTokens;
      paidUsed = tokensRequired - currentBonusTokens;
      await ctx.db.patch(sender._id, {
        bonusTokens: 0,
        giftTokens: currentPaidTokens - paidUsed,
      });
    } else {
      // All paid tokens
      paidUsed = tokensRequired;
      await ctx.db.patch(sender._id, {
        giftTokens: currentPaidTokens - tokensRequired,
      });
    }

    // Get wallet settings for revenue split
    const walletSettings = await ctx.runQuery(api.walletSettings.getWalletSettings, {});
    const recipientSharePercent = walletSettings?.recipientSharePercent ?? 50;
    
    // Only paid tokens generate revenue for recipients
    // Calculate revenue based only on paid tokens used
    const paidTokenValue = paidUsed * tokenValue; // Value in kuruş
    const recipientShare = paidUsed > 0 
      ? Math.floor((paidTokenValue * recipientSharePercent) / 100)
      : 0; // No revenue if only bonus tokens used
    const platformShare = paidTokenValue - recipientShare;

    // Record transaction
    const transactionId = await ctx.db.insert("giftTransactions", {
      senderId: sender._id,
      recipientId: args.recipientId,
      giftId: args.giftId,
      conversationId: args.conversationId,
      amount: totalPrice,
      quantity,
      platformShare,
      recipientShare,
      stripeSessionId: `token_${Date.now()}_${sender._id}`, // Unique identifier for token-based transactions
      status: "completed",
    });

    // Update sender's gift level (only paid tokens count toward level)
    const currentSpent = sender.totalGiftSpent ?? 0;
    const newTotalSpent = currentSpent + paidTokenValue; // Only paid token value counts
    
    const levelThreshold = walletSettings?.levelThreshold ?? 1000000; // 10,000 TL
    const maxLevel = walletSettings?.maxLevel ?? 100;
    
    const oldLevel = sender.giftLevel ?? 0;
    const newLevel = Math.min(
      Math.floor(newTotalSpent / levelThreshold),
      maxLevel
    );
    
    const leveledUp = newLevel > oldLevel;
    
    // Auto-verify users who reach level 50+
    const shouldAutoVerify = newLevel >= 50 && !sender.isVerified;
    
    await ctx.db.patch(sender._id, {
      totalGiftSpent: newTotalSpent,
      giftLevel: newLevel,
      ...(shouldAutoVerify && { isVerified: true }),
    });

    // Add recipient's share to their wallet (only if paid tokens were used)
    if (recipientShare > 0) {
      await ctx.runMutation(internal.wallets.addFundsToWallet, {
        userId: args.recipientId,
        amount: recipientShare,
        giftTransactionId: transactionId,
      });
    }

    // Create a message with the gift
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: sender._id,
      content: `🎁 ${gift.name} ${quantity > 1 ? `(${quantity}x)` : ""} gönderdi!`,
      isRead: false,
      giftId: args.giftId,
    });

    // Calculate remaining tokens
    const remainingBonusTokens = currentBonusTokens - bonusUsed;
    const remainingPaidTokens = currentPaidTokens - paidUsed;
    const totalRemainingTokens = remainingBonusTokens + remainingPaidTokens;
    
    return { 
      success: true, 
      remainingTokens: totalRemainingTokens,
      newLevel,
      leveledUp,
      oldLevel,
    };
  },
});

// Get gift transactions for a conversation
export const getConversationGifts = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("giftTransactions")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("desc")
      .take(50);

    const giftsWithDetails = await Promise.all(
      transactions.map(async (transaction) => {
        const gift = await ctx.db.get(transaction.giftId);
        const sender = await ctx.db.get(transaction.senderId);
        
        const profilePictureUrl = sender?.profilePicture
          ? await ctx.storage.getUrl(sender.profilePicture)
          : null;

        return {
          ...transaction,
          gift,
          sender: sender ? {
            _id: sender._id,
            name: sender.name,
            username: sender.username,
            profilePictureUrl,
          } : null,
        };
      })
    );

    return giftsWithDetails;
  },
});
