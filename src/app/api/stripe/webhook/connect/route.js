import Stripe from "stripe";
import { recordCompletedCheckout } from "@/lib/stripeCheckoutCompletion";

export const runtime = "nodejs";

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return null;
  return new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });
}

export async function POST(request) {
  try {
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

    if (!stripe || !webhookSecret) {
      return Response.json(
        { error: "Connected-account webhook is not configured" },
        { status: 500 }
      );
    }

    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) return Response.json({ error: "Missing Stripe signature" }, { status: 400 });

    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      if (!event.account) {
        return Response.json(
          { error: "Connected-account event is missing its account ID" },
          { status: 400 }
        );
      }

      return Response.json(
        await recordCompletedCheckout(event.data.object, event.account)
      );
    }

    return Response.json({ received: true });
  } catch (error) {
    const invalidSignature = String(error?.type || "").includes("Signature");
    return Response.json(
      { error: invalidSignature ? "Invalid Stripe webhook signature" : error.message },
      { status: invalidSignature ? 400 : 500 }
    );
  }
}
