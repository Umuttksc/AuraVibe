import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// Get or create wallet for user
export const getOrCreateWallet = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Kullanıcı girişi yapılmamış",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Check if wallet exists
    let wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    // If not, create one
    if (!wallet) {
      const walletId = await ctx.db.insert("userWallets", {
        userId: user._id,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      });
      wallet = await ctx.db.get(walletId);
    }

    return wallet;
  },
});

// Get wallet (read-only)
export const getWallet = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      return null;
    }

    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    return wallet;
  },
});

// Get wallet transactions
export const getWalletTransactions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Kullanıcı girişi yapılmamış",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return transactions;
  },
});

// Get bank accounts
export const getBankAccounts = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Kullanıcı girişi yapılmamış",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const bankAccounts = await ctx.db
      .query("bankAccounts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return bankAccounts;
  },
});

// Add bank account
export const addBankAccount = mutation({
  args: {
    bankName: v.string(),
    accountHolderName: v.string(),
    iban: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Kullanıcı girişi yapılmamış",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Validate IBAN format (TR + 24 digits)
    const ibanRegex = /^TR\d{24}$/;
    if (!ibanRegex.test(args.iban)) {
      throw new ConvexError({
        message: "Geçersiz IBAN formatı. TR ile başlayan 26 karakterli IBAN giriniz.",
        code: "BAD_REQUEST",
      });
    }

    // Check if IBAN already exists
    const existingAccount = await ctx.db
      .query("bankAccounts")
      .withIndex("by_iban", (q) => q.eq("iban", args.iban))
      .first();

    if (existingAccount) {
      throw new ConvexError({
        message: "Bu IBAN numarası zaten kayıtlı",
        code: "CONFLICT",
      });
    }

    // If setting as default, unset other defaults
    if (args.isDefault) {
      const existingAccounts = await ctx.db
        .query("bankAccounts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      for (const account of existingAccounts) {
        if (account.isDefault) {
          await ctx.db.patch(account._id, { isDefault: false });
        }
      }
    }

    const accountId = await ctx.db.insert("bankAccounts", {
      userId: user._id,
      bankName: args.bankName,
      accountHolderName: args.accountHolderName,
      iban: args.iban,
      isDefault: args.isDefault,
      isVerified: false,
    });

    return accountId;
  },
});

// Delete bank account
export const deleteBankAccount = mutation({
  args: {
    accountId: v.id("bankAccounts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Kullanıcı girişi yapılmamış",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new ConvexError({
        message: "Hesap bulunamadı",
        code: "NOT_FOUND",
      });
    }

    if (account.userId !== user._id) {
      throw new ConvexError({
        message: "Bu hesabı silme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    await ctx.db.delete(args.accountId);
  },
});

// Get withdrawal requests
export const getWithdrawalRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Kullanıcı girişi yapılmamış",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const requests = await ctx.db
      .query("withdrawalRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Fetch bank account info for each request
    const requestsWithBankInfo = await Promise.all(
      requests.map(async (request) => {
        const bankAccount = await ctx.db.get(request.bankAccountId);
        return {
          ...request,
          bankAccount,
        };
      })
    );

    return requestsWithBankInfo;
  },
});

// Request withdrawal
export const requestWithdrawal = mutation({
  args: {
    bankAccountId: v.id("bankAccounts"),
    amount: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Kullanıcı girişi yapılmamış",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Get wallet
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!wallet) {
      throw new ConvexError({
        message: "Cüzdan bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Get wallet settings for minimum withdrawal amount
    const settings = await ctx.db.query("walletSettings").first();
    const minWithdrawalAmount = settings?.minWithdrawalAmount ?? 25000; // Default 250 TL
    
    // Check minimum withdrawal amount
    if (args.amount < minWithdrawalAmount) {
      const minAmountTL = (minWithdrawalAmount / 100).toFixed(0);
      throw new ConvexError({
        message: `Minimum çekim tutarı ${minAmountTL} TL'dir`,
        code: "BAD_REQUEST",
      });
    }

    // Check if user has enough balance
    if (wallet.balance < args.amount) {
      throw new ConvexError({
        message: "Yetersiz bakiye",
        code: "BAD_REQUEST",
      });
    }

    // Verify bank account belongs to user
    const bankAccount = await ctx.db.get(args.bankAccountId);
    if (!bankAccount || bankAccount.userId !== user._id) {
      throw new ConvexError({
        message: "Geçersiz banka hesabı",
        code: "BAD_REQUEST",
      });
    }

    // Check for pending withdrawal requests
    const pendingRequests = await ctx.db
      .query("withdrawalRequests")
      .withIndex("by_user_and_status", (q) => 
        q.eq("userId", user._id).eq("status", "pending")
      )
      .collect();

    if (pendingRequests.length > 0) {
      throw new ConvexError({
        message: "Bekleyen bir çekim talebiniz var. Yeni talep oluşturmadan önce önceki talebinizi iptal edin.",
        code: "CONFLICT",
      });
    }

    // Create withdrawal request
    const requestId = await ctx.db.insert("withdrawalRequests", {
      userId: user._id,
      bankAccountId: args.bankAccountId,
      amount: args.amount,
      status: "pending",
      notes: args.notes,
    });

    // Deduct from wallet balance (hold the amount)
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.amount,
    });

    // Create transaction record
    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "withdrawal",
      amount: args.amount,
      balanceBefore: wallet.balance + args.amount,
      balanceAfter: wallet.balance,
      notes: `Para çekme talebi - ${bankAccount.bankName}`,
      withdrawalRequestId: requestId,
      status: "pending",
    });

    return requestId;
  },
});

// Cancel withdrawal request
export const cancelWithdrawalRequest = mutation({
  args: {
    requestId: v.id("withdrawalRequests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "Kullanıcı girişi yapılmamış",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();

    if (!user) {
      throw new ConvexError({
        message: "Kullanıcı bulunamadı",
        code: "NOT_FOUND",
      });
    }

    const request = await ctx.db.get(args.requestId);
    if (!request) {
      throw new ConvexError({
        message: "Talep bulunamadı",
        code: "NOT_FOUND",
      });
    }

    if (request.userId !== user._id) {
      throw new ConvexError({
        message: "Bu talebi iptal etme yetkiniz yok",
        code: "FORBIDDEN",
      });
    }

    if (request.status !== "pending") {
      throw new ConvexError({
        message: "Sadece beklemedeki talepler iptal edilebilir",
        code: "BAD_REQUEST",
      });
    }

    // Get wallet
    const wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!wallet) {
      throw new ConvexError({
        message: "Cüzdan bulunamadı",
        code: "NOT_FOUND",
      });
    }

    // Refund to wallet
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + request.amount,
    });

    // Update withdrawal request status
    await ctx.db.patch(args.requestId, {
      status: "cancelled",
    });

    // Update transaction status
    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("withdrawalRequestId"), args.requestId))
      .collect();

    for (const transaction of transactions) {
      await ctx.db.patch(transaction._id, {
        status: "failed",
      });
    }

    // Create refund transaction
    await ctx.db.insert("walletTransactions", {
      userId: user._id,
      type: "refund",
      amount: request.amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + request.amount,
      notes: "Para çekme talebi iptal edildi",
      withdrawalRequestId: args.requestId,
      status: "completed",
    });
  },
});

// Internal: Add funds to wallet (called from gift transactions)
export const addFundsToWallet = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    giftTransactionId: v.id("giftTransactions"),
  },
  handler: async (ctx, args) => {
    // Get or create wallet
    let wallet = await ctx.db
      .query("userWallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!wallet) {
      const walletId = await ctx.db.insert("userWallets", {
        userId: args.userId,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      });
      wallet = await ctx.db.get(walletId);
      if (!wallet) {
        throw new ConvexError({
          message: "Failed to create wallet",
          code: "EXTERNAL_SERVICE_ERROR",
        });
      }
    }

    // Update wallet balance
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + args.amount,
      totalEarned: wallet.totalEarned + args.amount,
    });

    // Create transaction record
    await ctx.db.insert("walletTransactions", {
      userId: args.userId,
      type: "gift_received",
      amount: args.amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + args.amount,
      notes: "Hediye geliri",
      giftTransactionId: args.giftTransactionId,
      status: "completed",
    });
  },
});
