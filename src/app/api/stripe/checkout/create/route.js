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
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return Response.json({ error: "Missing token" }, { status: 401 });

    const supabase = supabaseFromToken(token);

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = userData.user.id;

    const body = await request.json().catch(() => ({}));
    const offerId = body.offerId;
    if (!offerId) return Response.json({ error: "Missing offerId" }, { status: 400 });

    // Offer
    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select("id, request_id, gardener_id, proposed_price_gbp, status")
      .eq("id", offerId)
      .maybeSingle();

    if (offerErr || !offer) {
      return Response.json({ error: offerErr?.message || "Offer not found" }, { status: 400 });
    }

    // Request
    const { data: reqRow, error: reqErr } = await supabase
      .from("care_requests")
      .select("id, owner_id, title, price_offered_gbp, status")
      .eq("id", offer.request_id)
      .maybeSingle();

    if (reqErr || !reqRow) {
      return Response.json({ error: reqErr?.message || "Request not found" }, { status: 400 });
    }

    // Only owner can pay
    if (reqRow.owner_id !== userId) {
      return Response.json({ error: "Only the owner can pay" }, { status: 403 });
    }

    // Only pay for accepted request/offer
    if (reqRow.status !== "accepted" || offer.status !== "accepted") {
      return Response.json(
        { error: "Request/offer must be accepted before paying" },
        { status: 400 }
      );
    }

    // Amount selection (offer proposed > request offered)
    let amount = Number(offer.proposed_price_gbp ?? reqRow.price_offered_gbp ?? 0);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return Response.json({ error: "No valid amount set for this job" }, { status: 400 });
    }

    // Platform fee (v1: 10%)
    let fee = Math.round(amount * 0.1 * 100) / 100;

    // --- Prevent duplicate bookings: reuse pending, block if paid ---
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id, status, amount_gbp, platform_fee_gbp")
      .eq("request_id", reqRow.id)
      .eq("offer_id", offer.id)
      .eq("owner_id", userId)
      .in("status", ["pending_payment", "paid"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingBooking?.status === "paid") {
      return Response.json(
        { error: "This booking is already paid.", bookingId: existingBooking.id },
        { status: 400 }
      );
    }

    // Reuse the stored amounts if we’re reusing an existing pending booking
    let bookingId = existingBooking?.id;
    if (existingBooking?.status === "pending_payment") {
      amount = Number(existingBooking.amount_gbp ?? amount);
      fee = Number(existingBooking.platform_fee_gbp ?? fee);
    }

    // Create booking only if none exists
    if (!bookingId) {
      const { data: booking, error: bookErr } = await supabase
        .from("bookings")
        .insert({
          request_id: reqRow.id,
          offer_id: offer.id,
          owner_id: reqRow.owner_id,
          gardener_id: offer.gardener_id,
          amount_gbp: amount,
          platform_fee_gbp: fee,
          status: "pending_payment",
        })
        .select("id")
        .maybeSingle();

      if (bookErr || !booking) {
        return Response.json(
          { error: bookErr?.message || "Failed to create booking" },
          { status: 400 }
        );
      }

      bookingId = booking.id;
    }

    // Stripe Checkout needs integer minor units
    const amountPence = Math.round(Number(amount) * 100);
    if (amountPence < 50) {
      return Response.json({ error: "Amount too small for Checkout" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/bookings/${bookingId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/bookings/${bookingId}/cancel`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "gbp",
            unit_amount: amountPence,
            product_data: {
              name: "Garden care booking",
              description: reqRow.title || "Garden care",
            },
          },
        },
      ],
      metadata: {
        booking_id: bookingId,
        request_id: reqRow.id,
        offer_id: offer.id,
      },
    });

    // Store session id on booking
    const { error: upErr } = await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", bookingId);

    if (upErr) return Response.json({ error: upErr.message }, { status: 400 });

    return Response.json({ url: session.url, bookingId });
  } catch (err) {
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}