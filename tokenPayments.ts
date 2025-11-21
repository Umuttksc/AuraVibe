"use node";

import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api.js";
import Stripe from "stripe";

// Create Stripe checkout session for token purchase
export const createTokenCheckoutSession = action({
  args: {
    packageIndex: v.number(), // Index of the package in tokenSettings
  },
  handler: async (ctx, args): Promise<{ sessionUrl: string | null }> => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new ConvexError({
        code: "NOT_IMPLEMENTED",
        message: "STRIPE_SECRET_KEY not configured",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "User not logged in",
      });
    }

    const user = await ctx.runQuery(internal.users.getUserByTokenIdentifier, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!user) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Get token settings
    const settings = await ctx.runQuery(api.tokens.getTokenSettings);
    const pkg = settings.packages[args.packageIndex];

    if (!pkg) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Package not found",
      });
    }

    // Calculate total tokens (base + bonus)
    const totalTokens = pkg.tokens + (pkg.bonus || 0);

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: identity.email || undefined,
        name: identity.name || undefined,
        address: {
          country: "TR",
        },
        metadata: {
          userId: user._id,
        },
      });
      customerId = customer.id;
      await ctx.runMutation(internal.users.updateStripeCustomerId, {
        userId: user._id,
        stripeCustomerId: customerId,
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
            unit_amount: pkg.price, // Already in kuruş
            product_data: {
              name: `🎟️ ${totalTokens} Jeton Paketi`,
              description: pkg.bonus && pkg.bonus > 0
                ? `${pkg.tokens} jeton + ${pkg.bonus} bonus jeton`
                : `${pkg.tokens} jeton`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL || "http://localhost:5173"}/settings?success=true`,
      cancel_url: `${process.env.SITE_URL || "http://localhost:5173"}/settings?canceled=true`,
      metadata: {
        userId: user._id,
        tokens: totalTokens.toString(),
        packageIndex: args.packageIndex.toString(),
        type: "token_purchase",
      },
    });

    // Create pending purchase record
    await ctx.runMutation(internal.tokens.createTokenPurchase, {
      userId: user._id,
      tokens: totalTokens,
      price: pkg.price,
      stripeSessionId: session.id,
    });

    return { sessionUrl: session.url };
  },
});

// Handle Stripe webhook (called from http.ts)
export const handleStripeWebhook = action({
  args: {
    signature: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      throw new ConvexError({
        code: "NOT_IMPLEMENTED",
        message: "Stripe not configured",
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        args.payload,
        args.signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: `Webhook signature verification failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }

    // Handle the event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.metadata?.type === "token_purchase") {
        await ctx.runMutation(internal.tokens.completeTokenPurchase, {
          stripeSessionId: session.id,
        });
      }
    }

    return { success: true };
  },
});
