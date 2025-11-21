"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api.js";
import { ConvexError } from "convex/values";

// Create checkout session for sending a gift
export const createGiftCheckout = action({
  args: {
    giftId: v.id("gifts"),
    recipientId: v.id("users"),
    conversationId: v.id("conversations"),
    quantity: v.optional(v.number()), // Number of gifts to send
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string | null; sessionId: string }> => {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new ConvexError({
        message: "Stripe not configured",
        code: "NOT_IMPLEMENTED",
      });
    }

    const stripe = new Stripe(apiKey, {
      apiVersion: "2025-10-29.clover",
    });

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        message: "User not logged in",
        code: "UNAUTHENTICATED",
      });
    }

    const user = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!user) {
      throw new ConvexError({
        message: "User not found",
        code: "NOT_FOUND",
      });
    }

    // Get gift
    const gift = await ctx.runQuery(api.gifts.getGift, { giftId: args.giftId });
    if (!gift) {
      throw new ConvexError({
        message: "Gift not found",
        code: "NOT_FOUND",
      });
    }

    if (!gift.isActive) {
      throw new ConvexError({
        message: "Gift is not available",
        code: "BAD_REQUEST",
      });
    }

    // Get gift settings for revenue split
    const settings = await ctx.runQuery(api.giftSettings.getGiftSettings, {});
    const platformSharePercentage = settings?.platformSharePercentage ?? 70;
    const recipientSharePercentage = settings?.creatorSharePercentage ?? 30;

    // Get wallet settings for level discount
    const walletSettings = await ctx.runQuery(api.walletSettings.getWalletSettings, {});
    const level50Discount = walletSettings?.level50PlusDiscount ?? 25;
    const userLevel = user.giftLevel ?? 0;

    // Apply discount for level 50+ users
    let finalPrice = gift.price;
    if (userLevel >= 50) {
      const discountAmount = Math.floor((gift.price * level50Discount) / 100);
      finalPrice = gift.price - discountAmount;
    }

    // Calculate quantity (default 1)
    const quantity = args.quantity && args.quantity > 0 ? Math.min(args.quantity, 100) : 1;
    
    const totalAmount = finalPrice * quantity;
    const platformShare = Math.floor((totalAmount * platformSharePercentage) / 100);
    const recipientShare = Math.floor((totalAmount * recipientSharePercentage) / 100);

    // Create or get Stripe customer
    let customerId: string | undefined = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        address: {
          country: "TR",
        },
        metadata: {
          convexUserId: user._id,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await ctx.runMutation(api.users.updateCurrentUser, {
        stripeCustomerId: customerId as never,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card", "link"],
      locale: "tr",
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      line_items: [
        {
          price_data: {
            currency: "try",
            product_data: {
              name: `🎁 ${gift.name}`,
              description: gift.description || "Hediye gönder",
              images: [gift.imageUrl],
            },
            unit_amount: finalPrice,
          },
          quantity: quantity,
        },
      ],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        senderId: user._id,
        recipientId: args.recipientId,
        giftId: args.giftId,
        conversationId: args.conversationId,
        platformShare: platformShare.toString(),
        recipientShare: recipientShare.toString(),
        quantity: quantity.toString(),
        paymentType: "gift",
      },
    });

    // Record pending transaction
    await ctx.runMutation(internal.giftTransactions.recordGiftTransaction, {
      senderId: user._id,
      recipientId: args.recipientId,
      giftId: args.giftId,
      conversationId: args.conversationId,
      amount: totalAmount,
      quantity,
      platformShare,
      recipientShare,
      stripeSessionId: session.id,
      status: "pending",
    });

    return { url: session.url, sessionId: session.id };
  },
});
