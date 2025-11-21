import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { ConvexError } from "convex/values";

// Check if user can use fortune (free daily limit or premium)
export const checkFortuneAvailability = query({
  args: {
    fortuneType: v.union(
      v.literal("coffee"),
      v.literal("tarot"),
      v.literal("palm"),
      v.literal("birthchart"),
      v.literal("aura")
    ),
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

    // Check if user is premium
    const isPremium = user.isPremium ?? false;
    const premiumExpiresAt = user.premiumExpiresAt;
    let isPremiumActive = false;

    if (isPremium && premiumExpiresAt) {
      const expiryDate = new Date(premiumExpiresAt);
      isPremiumActive = expiryDate > new Date();
    }

    // Get pricing settings
    const pricing = await ctx.db.query("fortunePricing").first();
    const premiumSettings = await ctx.db.query("premiumSettings").first();

    // Premium users with unlimited fortunes can always use
    if (isPremiumActive && premiumSettings?.unlimitedFortunes) {
      return {
        canUse: true,
        isPremium: true,
        freeRemaining: -1, // Unlimited
        dailyLimit: -1,
        dailyUsed: 0,
        requiresPayment: false,
      };
    }

    // Check if we need to reset daily usage
    const today = new Date().toISOString().split("T")[0];
    const lastReset = user.lastFortuneResetDate;
    const needsReset = !lastReset || lastReset !== today;

    // Get current usage based on fortune type
    let dailyUsed: number;
    let dailyLimit: number;
    let price: number;

    switch (args.fortuneType) {
      case "coffee":
        dailyUsed = needsReset ? 0 : (user.dailyCoffeeUsed ?? 0);
        dailyLimit = pricing?.dailyFreeCoffee ?? 1;
        price = pricing?.coffeeFortunePricePerFortune ?? 0;
        break;
      case "tarot":
        dailyUsed = needsReset ? 0 : (user.dailyTarotUsed ?? 0);
        dailyLimit = pricing?.dailyFreeTarot ?? 1;
        price = pricing?.tarotFortunePricePerFortune ?? 0;
        break;
      case "palm":
        dailyUsed = needsReset ? 0 : (user.dailyPalmUsed ?? 0);
        dailyLimit = pricing?.dailyFreePalm ?? 0;
        price = pricing?.palmFortunePricePerFortune ?? 0;
        break;
      case "birthchart":
        dailyUsed = needsReset ? 0 : (user.dailyBirthchartUsed ?? 0);
        dailyLimit = pricing?.dailyFreeBirthchart ?? 0;
        price = pricing?.birthchartFortunePricePerFortune ?? 0;
        break;
      case "aura":
        dailyUsed = needsReset ? 0 : (user.dailyAuraUsed ?? 0);
        dailyLimit = pricing?.dailyFreeAura ?? 0;
        price = pricing?.auraFortunePricePerFortune ?? 0;
        break;
    }

    const freeRemaining = Math.max(0, dailyLimit - dailyUsed);
    const canUseFree = freeRemaining > 0;

    return {
      canUse: true, // Can always attempt (will require payment if no free uses)
      isPremium: isPremiumActive,
      freeRemaining,
      dailyLimit,
      dailyUsed,
      requiresPayment: !canUseFree,
      price,
    };
  },
});

// Use a free fortune (if available) or check for paid credits
export const useFreeFortuneIfAvailable = mutation({
  args: {
    fortuneType: v.union(
      v.literal("coffee"),
      v.literal("tarot"),
      v.literal("palm"),
      v.literal("birthchart"),
      v.literal("aura")
    ),
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

    // SECURITY: Use server timestamp (Date.now()) to prevent client-side manipulation
    const serverNow = Date.now();
    const today = new Date(serverNow).toISOString().split("T")[0];

    // SECURITY: Rate limiting - prevent rapid successive fortune requests
    const lastFortuneTime = user.lastFortuneTime ?? 0;
    const timeSinceLastFortune = serverNow - lastFortuneTime;
    const rateLimitMs = 10000; // 10 seconds between fortunes

    if (timeSinceLastFortune < rateLimitMs) {
      const waitSeconds = Math.ceil((rateLimitMs - timeSinceLastFortune) / 1000);
      throw new ConvexError({
        message: `Lütfen ${waitSeconds} saniye bekleyin`,
        code: "BAD_REQUEST",
      });
    }

    // Check if user is premium
    const isPremium = user.isPremium ?? false;
    const premiumExpiresAt = user.premiumExpiresAt;
    let isPremiumActive = false;

    if (isPremium && premiumExpiresAt) {
      const expiryDate = new Date(premiumExpiresAt);
      isPremiumActive = expiryDate > new Date(serverNow);
    }

    // Get premium settings
    const premiumSettings = await ctx.db.query("premiumSettings").first();

    // Premium users with unlimited fortunes don't need to track usage
    if (isPremiumActive && premiumSettings?.unlimitedFortunes) {
      // Update last fortune time even for premium users
      await ctx.db.patch(user._id, {
        lastFortuneTime: serverNow,
      });
      return { success: true, usedFree: true, usedPaidCredit: false };
    }

    // Get pricing settings
    const pricing = await ctx.db.query("fortunePricing").first();

    // SECURITY: Check if we need to reset daily usage
    const lastReset = user.lastFortuneResetDate;
    
    // SECURITY: If lastReset is in the future (impossible unless manipulated), reset it
    if (lastReset && lastReset > today) {
      await ctx.db.patch(user._id, {
        lastFortuneResetDate: today,
        dailyCoffeeUsed: 0,
        dailyTarotUsed: 0,
        dailyPalmUsed: 0,
        dailyBirthchartUsed: 0,
        dailyAuraUsed: 0,
      });
    }
    
    const needsReset = !lastReset || lastReset !== today;

    // Get current usage and limits based on fortune type
    let dailyUsed: number;
    let dailyLimit: number;
    let updateField: string;

    switch (args.fortuneType) {
      case "coffee":
        dailyUsed = needsReset ? 0 : (user.dailyCoffeeUsed ?? 0);
        dailyLimit = pricing?.dailyFreeCoffee ?? 1;
        updateField = "dailyCoffeeUsed";
        break;
      case "tarot":
        dailyUsed = needsReset ? 0 : (user.dailyTarotUsed ?? 0);
        dailyLimit = pricing?.dailyFreeTarot ?? 1;
        updateField = "dailyTarotUsed";
        break;
      case "palm":
        dailyUsed = needsReset ? 0 : (user.dailyPalmUsed ?? 0);
        dailyLimit = pricing?.dailyFreePalm ?? 0;
        updateField = "dailyPalmUsed";
        break;
      case "birthchart":
        dailyUsed = needsReset ? 0 : (user.dailyBirthchartUsed ?? 0);
        dailyLimit = pricing?.dailyFreeBirthchart ?? 0;
        updateField = "dailyBirthchartUsed";
        break;
      case "aura":
        dailyUsed = needsReset ? 0 : (user.dailyAuraUsed ?? 0);
        dailyLimit = pricing?.dailyFreeAura ?? 0;
        updateField = "dailyAuraUsed";
        break;
    }

    // Check if free fortune available
    const freeRemaining = Math.max(0, dailyLimit - dailyUsed);
    if (freeRemaining > 0) {
      dailyUsed++;
      // SECURITY: Update with server timestamp
      await ctx.db.patch(user._id, {
        [updateField]: dailyUsed,
        lastFortuneResetDate: today,
        lastFortuneTime: serverNow,
      });
      return { success: true, usedFree: true, usedPaidCredit: false };
    }

    // No free fortunes available - check for unused paid credits
    // Find a completed payment that hasn't been used yet (no fortuneId)
    const unusedPayment = await ctx.db
      .query("fortunePayments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("fortuneType"), args.fortuneType),
          q.eq(q.field("status"), "completed"),
          q.eq(q.field("fortuneId"), undefined) // Not yet used
        )
      )
      .first();

    if (unusedPayment) {
      // User has a paid credit available!
      await ctx.db.patch(user._id, {
        lastFortuneTime: serverNow,
      });
      return { 
        success: true, 
        usedFree: false, 
        usedPaidCredit: true,
        paymentId: unusedPayment._id 
      };
    }

    // No free or paid credits available
    return { success: false, usedFree: false, usedPaidCredit: false, requiresPayment: true };
  },
});

// Get pricing settings
export const getPricingSettings = query({
  args: {},
  handler: async (ctx) => {
    const pricing = await ctx.db.query("fortunePricing").first();
    return pricing || null;
  },
});

// Get premium settings
export const getPremiumSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("premiumSettings").first();
    return settings || null;
  },
});

// Admin: Update pricing settings
export const updatePricingSettings = mutation({
  args: {
    coffeeFortunePricePerFortune: v.optional(v.number()),
    tarotFortunePricePerFortune: v.optional(v.number()),
    palmFortunePricePerFortune: v.optional(v.number()),
    birthchartFortunePricePerFortune: v.optional(v.number()),
    auraFortunePricePerFortune: v.optional(v.number()),
    dailyFreeCoffee: v.optional(v.number()),
    dailyFreeTarot: v.optional(v.number()),
    dailyFreePalm: v.optional(v.number()),
    dailyFreeBirthchart: v.optional(v.number()),
    dailyFreeAura: v.optional(v.number()),
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

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    // Check if settings exist
    const existing = await ctx.db.query("fortunePricing").first();
    
    // Filter out undefined values
    const updates = Object.fromEntries(
      Object.entries(args).filter(([_, v]) => v !== undefined)
    );
    
    if (existing) {
      await ctx.db.patch(existing._id, updates);
    } else {
      // If creating new, use defaults for any missing values
      await ctx.db.insert("fortunePricing", {
        coffeeFortunePricePerFortune: args.coffeeFortunePricePerFortune ?? 1000,
        tarotFortunePricePerFortune: args.tarotFortunePricePerFortune ?? 1500,
        palmFortunePricePerFortune: args.palmFortunePricePerFortune ?? 2000,
        birthchartFortunePricePerFortune: args.birthchartFortunePricePerFortune ?? 2500,
        auraFortunePricePerFortune: args.auraFortunePricePerFortune ?? 2000,
        dailyFreeCoffee: args.dailyFreeCoffee ?? 1,
        dailyFreeTarot: args.dailyFreeTarot ?? 1,
        dailyFreePalm: args.dailyFreePalm ?? 0,
        dailyFreeBirthchart: args.dailyFreeBirthchart ?? 0,
        dailyFreeAura: args.dailyFreeAura ?? 0,
      });
    }

    return { success: true };
  },
});

// Admin: Update premium settings
export const updatePremiumSettings = mutation({
  args: {
    monthlyPrice: v.number(),
    unlimitedFortunes: v.boolean(),
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

    if (!user || user.role !== "admin") {
      throw new ConvexError({
        message: "Unauthorized - Admin only",
        code: "FORBIDDEN",
      });
    }

    // Check if settings exist
    const existing = await ctx.db.query("premiumSettings").first();
    
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("premiumSettings", args);
    }

    return { success: true };
  },
});

// Internal: Record fortune payment
export const recordFortunePayment = internalMutation({
  args: {
    userId: v.id("users"),
    fortuneType: v.union(
      v.literal("coffee"),
      v.literal("tarot"),
      v.literal("palm"),
      v.literal("birthchart"),
      v.literal("aura")
    ),
    fortuneId: v.optional(v.id("fortunes")),
    amount: v.number(),
    stripeSessionId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("fortunePayments", args);
    return id;
  },
});

// Internal: Complete fortune payment (called from webhook)
export const completeFortunePayment = internalMutation({
  args: {
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the payment
    const payment = await ctx.db
      .query("fortunePayments")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .first();

    if (!payment) {
      throw new ConvexError({
        message: "Payment not found",
        code: "NOT_FOUND",
      });
    }

    if (payment.status === "completed") {
      // Already completed
      return { success: true };
    }

    // Update payment status
    await ctx.db.patch(payment._id, { status: "completed" });

    return { success: true };
  },
});

// Internal: Record premium subscription
export const recordPremiumSubscription = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    stripeSubscriptionId: v.optional(v.string()),
    stripeSessionId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("expired")
    ),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("premiumSubscriptions", args);
    return id;
  },
});

// Internal: Complete premium subscription (called from webhook)
export const completePremiumSubscription = internalMutation({
  args: {
    stripeSessionId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the subscription
    const subscription = await ctx.db
      .query("premiumSubscriptions")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId)
      )
      .first();

    if (!subscription) {
      throw new ConvexError({
        message: "Subscription not found",
        code: "NOT_FOUND",
      });
    }

    if (subscription.status === "active") {
      // Already active
      return { success: true };
    }

    // Update subscription status
    await ctx.db.patch(subscription._id, { status: "active" });

    // Update user premium status
    const user = await ctx.db.get(subscription.userId);
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    await ctx.db.patch(user._id, {
      isPremium: true,
      premiumExpiresAt: subscription.endDate,
    });

    return { success: true };
  },
});

// Record fortune payment from Play Billing
export const recordPlayBillingFortunePayment = mutation({
  args: {
    fortuneType: v.union(
      v.literal("coffee"),
      v.literal("tarot"),
      v.literal("palm"),
      v.literal("birthchart"),
      v.literal("aura")
    ),
    orderId: v.string(),
    purchaseToken: v.string(),
    productId: v.string(),
    amount: v.number(),
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

    // Check if this purchase was already recorded
    const existing = await ctx.db
      .query("fortunePayments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("playBillingOrderId"), args.orderId))
      .first();

    if (existing) {
      return { paymentId: existing._id, alreadyRecorded: true };
    }

    // Record the payment
    const paymentId = await ctx.db.insert("fortunePayments", {
      userId: user._id,
      fortuneType: args.fortuneType,
      amount: args.amount,
      status: "completed",
      playBillingOrderId: args.orderId,
      playBillingPurchaseToken: args.purchaseToken,
      playBillingProductId: args.productId,
    });

    return { paymentId, alreadyRecorded: false };
  },
});

// Record premium subscription from Play Billing
export const recordPlayBillingPremiumSubscription = mutation({
  args: {
    orderId: v.string(),
    purchaseToken: v.string(),
    productId: v.string(),
    amount: v.number(),
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

    // Calculate subscription dates (1 month)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Check if this purchase was already recorded
    const existing = await ctx.db
      .query("premiumSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("playBillingOrderId"), args.orderId))
      .first();

    if (existing) {
      return { subscriptionId: existing._id, alreadyRecorded: true };
    }

    // Record the subscription
    const subscriptionId = await ctx.db.insert("premiumSubscriptions", {
      userId: user._id,
      amount: args.amount,
      status: "active",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      playBillingOrderId: args.orderId,
      playBillingPurchaseToken: args.purchaseToken,
      playBillingProductId: args.productId,
    });

    // Update user premium status
    await ctx.db.patch(user._id, {
      isPremium: true,
      premiumExpiresAt: endDate.toISOString(),
    });

    return { subscriptionId, alreadyRecorded: false };
  },
});
