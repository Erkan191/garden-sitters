import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return null;

  return new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
  });
}

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return null;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getPaymentIntentId(session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id || null;
}

async function handleCheckoutSessionCompleted(session) {
  const bookingId = session.metadata?.booking_id;

  if (!bookingId) {
    return Response.json({
      received: true,
      ignored: true,
      reason: "Missing booking_id metadata",
    });
  }

  if (session.payment_status !== "paid") {
    return Response.json({
      received: true,
      ignored: true,
      reason: "Checkout Session is not paid",
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return Response.json(
      { error: "Server is missing Supabase admin environment variables" },
      { status: 500 }
    );
  }

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    return Response.json({ error: bookingError.message }, { status: 500 });
  }

  if (!booking) {
    return Response.json({
      received: true,
      ignored: true,
      reason: "Booking not found",
    });
  }

  if (booking.status === "completed") {
    return Response.json({ ok: true, status: "completed" });
  }

  const paymentIntentId = getPaymentIntentId(session);

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", bookingId);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function POST(request) {
  const stripe = getStripe();
  if (!stripe) {
    return Response.json(
      { error: "Server is missing STRIPE_SECRET_KEY" },
      { status: 500 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json(
      { error: "Server is missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { error: "Missing Stripe-Signature header" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return Response.json(
      { error: "Invalid Stripe webhook signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    return handleCheckoutSessionCompleted(event.data.object);
  }

  return Response.json({ received: true });
}
