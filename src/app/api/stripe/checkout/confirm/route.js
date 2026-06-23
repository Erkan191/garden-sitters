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

    const stripe = getStripe();
    if (!stripe) {
      return Response.json(
        { error: "Server is missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (String(session.metadata?.booking_id || "") !== String(bookingId)) {
      return Response.json({ error: "Session does not match booking" }, { status: 400 });
    }

    if (session.payment_status !== "paid") {
      return Response.json({ error: "Payment not completed yet" }, { status: 400 });
    }

    if (booking.status === "completed") {
      return Response.json({ ok: true, status: "completed" });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null;

    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) {
      return Response.json(
        { error: "Server is missing Supabase admin environment variables" },
        { status: 500 }
      );
    }

    const { error: upErr } = await supabaseAdmin
      .from("bookings")
      .update({
        status: "paid",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
      })
      .eq("id", bookingId)
      .neq("status", "completed");

    if (upErr) return Response.json({ error: upErr.message }, { status: 400 });

    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
