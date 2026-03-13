import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

function supabaseFromToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
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
      "id, owner_id, gardener_id, amount_gbp, platform_fee_gbp, status, stripe_transfer_id, payout_status"
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

  // Mark booking completed + payout pending (this allows retries without losing state)
  const { error: markErr } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      payout_status: "pending",
      payout_error: null,
    })
    .eq("id", booking.id);

  if (markErr) return Response.json({ error: markErr.message }, { status: 400 });

  // Gardener Stripe account
  const { data: gardenerProfile, error: profErr } = await supabase
    .from("profiles")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", booking.gardener_id)
    .maybeSingle();

  if (profErr || !gardenerProfile) {
    await supabase
      .from("bookings")
      .update({ payout_status: "failed", payout_error: profErr?.message || "Gardener profile not found" })
      .eq("id", booking.id);

    return Response.json({ error: profErr?.message || "Gardener profile not found" }, { status: 400 });
  }

  if (!gardenerProfile.stripe_account_id) {
    await supabase
      .from("bookings")
      .update({ payout_status: "failed", payout_error: "Gardener has no Stripe account connected" })
      .eq("id", booking.id);

    return Response.json({ error: "Gardener has no Stripe account connected" }, { status: 400 });
  }

  if (!gardenerProfile.stripe_onboarding_complete) {
    await supabase
      .from("bookings")
      .update({ payout_status: "failed", payout_error: "Gardener Stripe onboarding not complete" })
      .eq("id", booking.id);

    return Response.json({ error: "Gardener Stripe onboarding not complete" }, { status: 400 });
  }

  const amount = Number(booking.amount_gbp);
  const fee = Number(booking.platform_fee_gbp);
  const payout = amount - fee;

  if (!payout || Number.isNaN(payout) || payout <= 0) {
    await supabase
      .from("bookings")
      .update({ payout_status: "failed", payout_error: "Invalid payout amount" })
      .eq("id", booking.id);

    return Response.json({ error: "Invalid payout amount" }, { status: 400 });
  }

  const payoutPence = Math.round(payout * 100);

  try {
    // Create Stripe Transfer (idempotent: if Stripe succeeds but DB update fails, retry won’t duplicate)
    const transfer = await stripe.transfers.create(
      {
        amount: payoutPence,
        currency: "gbp",
        destination: gardenerProfile.stripe_account_id,
        metadata: { booking_id: booking.id },
      },
      { idempotencyKey: `booking_${booking.id}_transfer` }
    );

    const { error: upErr } = await supabase
      .from("bookings")
      .update({
        stripe_transfer_id: transfer.id,
        payout_status: "paid",
        payout_error: null,
        status: "completed",
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
    await supabase
      .from("bookings")
      .update({
        payout_status: "failed",
        payout_error: err.message || "Transfer failed",
        status: "completed",
      })
      .eq("id", booking.id);

    return Response.json({ error: err.message || "Transfer failed" }, { status: 400 });
  }
}