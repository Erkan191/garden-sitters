import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

const MAX_PRICE_GBP = 999999.99;
const MAX_STRIPE_AMOUNT_PENCE = 99999999;
const MIN_STRIPE_AMOUNT_PENCE = 50;

function supabaseFromToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

function moneyToPence(value) {
  if (!Number.isFinite(value)) return null;
  if (value <= 0) return null;
  if (value > MAX_PRICE_GBP) return null;

  const pence = Math.round(value * 100);

  // Allow tiny JavaScript floating point wobble.
  if (Math.abs(value * 100 - pence) > 0.000001) return null;

  return pence;
}

function isValidMoneyAmount(value) {
  const pence = moneyToPence(value);
  return pence !== null && pence > 0 && pence <= MAX_STRIPE_AMOUNT_PENCE;
}

export async function POST(request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json(
        { error: "Server is missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return Response.json(
        { error: "Server is missing Supabase environment variables" },
        { status: 500 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      return Response.json(
        { error: "Server is missing NEXT_PUBLIC_SITE_URL" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return Response.json({ error: "Missing token" }, { status: 401 });
    }

    const supabase = supabaseFromToken(token);

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;

    const body = await request.json().catch(() => ({}));
    const offerId = typeof body.offerId === "string" ? body.offerId.trim() : "";

    if (!offerId) {
      return Response.json({ error: "Missing offerId" }, { status: 400 });
    }

    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select("id, request_id, gardener_id, proposed_price_gbp, status")
      .eq("id", offerId)
      .maybeSingle();

    if (offerErr || !offer) {
      return Response.json(
        { error: offerErr?.message || "Offer not found" },
        { status: 400 }
      );
    }

    const { data: reqRow, error: reqErr } = await supabase
      .from("care_requests")
      .select("id, owner_id, title, price_offered_gbp, status")
      .eq("id", offer.request_id)
      .maybeSingle();

    if (reqErr || !reqRow) {
      return Response.json(
        { error: reqErr?.message || "Request not found" },
        { status: 400 }
      );
    }

    if (reqRow.owner_id !== userId) {
      return Response.json({ error: "Only the owner can pay" }, { status: 403 });
    }

    if (reqRow.status !== "accepted") {
      return Response.json(
        { error: "Request must be accepted before paying" },
        { status: 400 }
      );
    }

    if (offer.status !== "accepted") {
      return Response.json(
        { error: "Offer must be accepted before paying" },
        { status: 400 }
      );
    }

    let amount = Number(offer.proposed_price_gbp ?? reqRow.price_offered_gbp ?? 0);

    if (!isValidMoneyAmount(amount)) {
      return Response.json(
        {
          error:
            "Amount must be between £0.01 and £999,999.99, with no more than 2 decimal places.",
        },
        { status: 400 }
      );
    }

    const amountPenceForFee = moneyToPence(amount);

    if (amountPenceForFee === null) {
      return Response.json(
        { error: "Amount could not be converted safely for Checkout" },
        { status: 400 }
      );
    }

    const feePence = Math.round(amountPenceForFee * 0.1);
    let fee = feePence / 100;

    if (feePence < 0 || feePence > MAX_STRIPE_AMOUNT_PENCE) {
      return Response.json(
        { error: "Calculated platform fee is invalid." },
        { status: 400 }
      );
    }

    const { data: existingBooking, error: existingBookingErr } = await supabase
      .from("bookings")
      .select("id, status, amount_gbp, platform_fee_gbp")
      .eq("request_id", reqRow.id)
      .eq("offer_id", offer.id)
      .eq("owner_id", userId)
      .in("status", ["pending_payment", "paid"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingBookingErr) {
      return Response.json(
        { error: existingBookingErr.message || "Failed to inspect existing bookings" },
        { status: 400 }
      );
    }

    if (existingBooking?.status === "paid") {
      return Response.json(
        { error: "This booking is already paid.", bookingId: existingBooking.id },
        { status: 400 }
      );
    }

    let bookingId = existingBooking?.id;

    if (existingBooking?.status === "pending_payment") {
      const storedAmount = Number(existingBooking.amount_gbp ?? amount);
      const storedFee = Number(existingBooking.platform_fee_gbp ?? fee);

      if (!isValidMoneyAmount(storedAmount)) {
        return Response.json(
          { error: "Existing booking has an invalid amount." },
          { status: 400 }
        );
      }

      if (!isValidMoneyAmount(storedFee) && storedFee !== 0) {
        return Response.json(
          { error: "Existing booking has an invalid platform fee." },
          { status: 400 }
        );
      }

      amount = storedAmount;
      fee = storedFee;
    }

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

    const amountPence = moneyToPence(amount);

    if (amountPence === null) {
      return Response.json(
        { error: "Amount could not be converted safely for Checkout" },
        { status: 400 }
      );
    }

    if (amountPence < MIN_STRIPE_AMOUNT_PENCE) {
      return Response.json(
        { error: "Amount too small for Checkout" },
        { status: 400 }
      );
    }

    if (amountPence > MAX_STRIPE_AMOUNT_PENCE) {
      return Response.json(
        { error: "Amount too large for Checkout" },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

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

    const { error: upErr } = await supabase
      .from("bookings")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", bookingId);

    if (upErr) {
      return Response.json({ error: upErr.message }, { status: 400 });
    }

    return Response.json({ url: session.url, bookingId });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}