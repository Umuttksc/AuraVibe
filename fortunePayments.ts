"use node";

import { v } from "convex/values";
import Stripe from "stripe";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api.js";
import { ConvexError } from "convex/values";

// Create checkout session for a single fortune purchase
export const createFortuneCheckout = action({
  args: {
    fortuneType: v.union(v.literal("coffee"), v.literal("tarot")),
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

    // Get pricing
    const pricing = await ctx.runQuery(api.fortuneUsage.getPricingSettings, {});
    if (!pricing) {
      throw new ConvexError({
        message: "Pricing not configured",
        code: "NOT_IMPLEMENTED",
      });
    }

    const pricePerFortune: number =
      args.fortuneType === "coffee"
        ? pricing.coffeeFortunePricePerFortune
        : pricing.tarotFortunePricePerFortune;

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

      // Save customer ID (cast to never to bypass type checking issue)
      await ctx.runMutation(api.users.updateCurrentUser, {
        stripeCustomerId: customerId as never,
      });
    }

    // Create checkout session for single fortune payment
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
            currency: "try", // Turkish Lira
            product_data: {
              name:
                args.fortuneType === "coffee"
                  ? "☕ Kahve Falı"
                  : "🔮 Tarot Falı",
              description: `AuraVibe ${args.fortuneType === "coffee" ? "Kahve Falı" : "Tarot"} bakımı`,
            },
            unit_amount: pricePerFortune,
          },
          quantity: 1,
        },
      ],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        fortuneType: args.fortuneType,
        userId: user._id,
        paymentType: "fortune",
      },
    });

    // Record pending payment
    await ctx.runMutation(internal.fortuneUsage.recordFortunePayment, {
      userId: user._id,
      fortuneType: args.fortuneType,
      amount: pricePerFortune,
      stripeSessionId: session.id,
      status: "pending",
    });

    return { url: session.url, sessionId: session.id };
  },
});

// Create checkout session for premium subscription
export const createPremiumCheckout = action({
  args: {
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

    // Get premium settings
    const premiumSettings = await ctx.runQuery(api.fortuneUsage.getPremiumSettings, {});
    if (!premiumSettings) {
      throw new ConvexError({
        message: "Premium settings not configured",
        code: "NOT_IMPLEMENTED",
      });
    }

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

      // Save customer ID (cast to never to bypass type checking issue)
      await ctx.runMutation(api.users.updateCurrentUser, {
        stripeCustomerId: customerId as never,
      });
    }

    // Calculate subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
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
              name: "⭐ AuraVibe Premium",
              description: "Sınırsız fal ve özel özellikler",
            },
            unit_amount: premiumSettings.monthlyPrice,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      metadata: {
        userId: user._id,
        paymentType: "premium",
      },
    });

    // Record pending subscription
    await ctx.runMutation(internal.fortuneUsage.recordPremiumSubscription, {
      userId: user._id,
      amount: premiumSettings.monthlyPrice,
      stripeSessionId: session.id,
      stripeSubscriptionId: session.subscription as string | undefined,
      status: "active",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return { url: session.url, sessionId: session.id };
  },
});
