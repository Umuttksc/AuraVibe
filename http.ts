import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api.js";
import Stripe from "stripe";

const http = httpRouter();

http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      return new Response("Stripe not configured", { status: 500 });
    }

    const stripe = new Stripe(apiKey, {
      apiVersion: "2025-10-29.clover",
    });

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature", { status: 400 });
    }

    const body = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", errorMessage);
      return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Determine payment type from metadata
        const paymentType = session.metadata?.paymentType || session.metadata?.type;
        
        if (paymentType === "fortune") {
          // Complete fortune payment
          await ctx.runMutation(internal.fortuneUsage.completeFortunePayment, {
            stripeSessionId: session.id,
          });
        } else if (paymentType === "premium") {
          // Complete premium subscription
          await ctx.runMutation(internal.fortuneUsage.completePremiumSubscription, {
            stripeSessionId: session.id,
          });
        } else if (paymentType === "gift") {
          // Complete gift transaction
          await ctx.runMutation(internal.giftTransactions.completeGiftTransaction, {
            stripeSessionId: session.id,
          });
        } else if (paymentType === "token_purchase") {
          // Complete token purchase
          await ctx.runMutation(internal.tokens.completeTokenPurchase, {
            stripeSessionId: session.id,
          });
        }
        // Note: verification payments are handled separately via existing system
        
        break;
      }

      case "checkout.session.expired": {
        // Handle expired sessions if needed
        console.log("Checkout session expired:", event.data.object.id);
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }),
});

export default http;
