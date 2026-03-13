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
    const bookingId = body.bookingId;
    const sessionId = body.sessionId;

    if (!bookingId || !sessionId) {
      return Response.json({ error: "Missing bookingId or sessionId" }, { status: 400 });
    }

    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .select("id, owner_id, stripe_checkout_session_id, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookErr || !booking) {
      return Response.json({ error: bookErr?.message || "Booking not found" }, { status: 400 });
    }

    // only owner confirms
    if (booking.owner_id !== userId) {
      return Response.json({ error: "Only the owner can confirm payment" }, { status: 403 });
    }

    // session must match what we stored (basic tamper check)
    if (booking.stripe_checkout_session_id && booking.stripe_checkout_session_id !== sessionId) {
      return Response.json({ error: "Session does not match booking" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const paid =
      session.payment_status === "paid" ||
      (session.payment_intent && session.payment_intent.status === "succeeded");

    if (!paid) {
      return Response.json({ error: "Payment not completed yet" }, { status: 400 });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    const { error: upErr } = await supabase
      .from("bookings")
      .update({
        status: "paid",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", bookingId);

    if (upErr) return Response.json({ error: upErr.message }, { status: 400 });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}