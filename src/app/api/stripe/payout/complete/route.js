import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function supabaseFromToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return null;

  return new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
  });
}

export async function POST(request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return Response.json({ error: "Missing token" }, { status: 401 });

  const supabase = supabaseFromToken(token);

  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = userData.user.id;

  const body = await request.json().catch(() => ({}));
  const bookingId = body.bookingId;
  if (!bookingId) return Response.json({ error: "Missing bookingId" }, { status: 400 });

  // Load booking
  const { data: booking, error: bookErr } = await supabase
    .from("bookings")
    .select(
      "id, owner_id, gardener_id, amount_gbp, platform_fee_gbp, status, stripe_payment_intent_id, stripe_transfer_id, payout_status"
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (bookErr || !booking) {
    return Response.json({ error: bookErr?.message || "Booking not found" }, { status: 400 });
  }

  // Only owner can trigger payout
  if (booking.owner_id !== userId) {
    return Response.json({ error: "Only the owner can complete the booking" }, { status: 403 });
  }

  // If transfer already created, return success (idempotent)
  if (booking.stripe_transfer_id) {
    return Response.json({ ok: true, transferId: booking.stripe_transfer_id });
  }

  // Must be paid first
  if (booking.status !== "paid" && booking.status !== "completed") {
    return Response.json({ error: "Booking must be paid before payout" }, { status: 400 });
  }

  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return Response.json(
      { error: "Server is missing Supabase admin environment variables" },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    return Response.json(
      { error: "Server is missing STRIPE_SECRET_KEY" },
      { status: 500 }
    );
  }

  // Mark payout as pending, but do not mark completed until transfer succeeds
  const { error: markErr } = await supabaseAdmin
    .from("bookings")
    .update({
      payout_status: "pending",
      payout_error: null,
    })
    .eq("id", booking.id);

  if (markErr) return Response.json({ error: markErr.message }, { status: 400 });

  // Gardener Stripe account
  const { data: gardenerProfile, error: profErr } = await supabaseAdmin
    .from("profiles")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", booking.gardener_id)
    .maybeSingle();

  if (profErr || !gardenerProfile) {
    await supabaseAdmin
      .from("bookings")
      .update({ payout_status: "failed", payout_error: profErr?.message || "Gardener profile not found" })
      .eq("id", booking.id);

    return Response.json({ error: profErr?.message || "Gardener profile not found" }, { status: 400 });
  }

  if (!gardenerProfile.stripe_account_id) {
    await supabaseAdmin
      .from("bookings")
      .update({ payout_status: "failed", payout_error: "Gardener has no Stripe account connected" })
      .eq("id", booking.id);

    return Response.json({ error: "Gardener has no Stripe account connected" }, { status: 400 });
  }

  if (!gardenerProfile.stripe_onboarding_complete) {
    await supabaseAdmin
      .from("bookings")
      .update({ payout_status: "failed", payout_error: "Gardener Stripe onboarding not complete" })
      .eq("id", booking.id);

    return Response.json({ error: "Gardener Stripe onboarding not complete" }, { status: 400 });
  }

  const amount = Number(booking.amount_gbp);
  const fee = Number(booking.platform_fee_gbp);
  const payout = amount - fee;

  if (!payout || Number.isNaN(payout) || payout <= 0) {
    await supabaseAdmin
      .from("bookings")
      .update({ payout_status: "failed", payout_error: "Invalid payout amount" })
      .eq("id", booking.id);

    return Response.json({ error: "Invalid payout amount" }, { status: 400 });
  }

  const payoutPence = Math.round(payout * 100);

  try {
    if (!booking.stripe_payment_intent_id) {
      throw new Error("Missing Stripe payment intent for this booking");
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      booking.stripe_payment_intent_id
    );
    const sourceChargeId =
      typeof paymentIntent.latest_charge === "string"
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id || null;

    if (!sourceChargeId) {
      throw new Error("Could not find the Stripe charge for this booking");
    }

    // Create Stripe Transfer (idempotent: if Stripe succeeds but DB update fails, retry won’t duplicate)
    const transfer = await stripe.transfers.create(
      {
        amount: payoutPence,
        currency: "gbp",
        destination: gardenerProfile.stripe_account_id,
        source_transaction: sourceChargeId,
        metadata: {
          booking_id: booking.id,
          payment_intent_id: booking.stripe_payment_intent_id,
        },
      },
      { idempotencyKey: `booking_${booking.id}_transfer` }
    );

    const { error: upErr } = await supabaseAdmin
      .from("bookings")
      .update({
        stripe_account_id: gardenerProfile.stripe_account_id,
        stripe_transfer_id: transfer.id,
        payout_status: "paid",
        payout_error: null,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (upErr) {
      return Response.json(
        { error: `Transfer created (${transfer.id}) but failed to save to DB: ${upErr.message}` },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, transferId: transfer.id });
  } catch (err) {
    // Record failure so we can retry later
    const failureUpdate = {
      payout_status: "failed",
      payout_error: err.message || "Transfer failed",
    };

    if (booking.status !== "completed") {
      failureUpdate.status = "paid";
    }

    await supabaseAdmin
      .from("bookings")
      .update(failureUpdate)
      .eq("id", booking.id);

    return Response.json({ error: err.message || "Transfer failed" }, { status: 400 });
  }
}
