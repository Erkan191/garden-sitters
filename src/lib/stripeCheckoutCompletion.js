import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import {
  STRIPE_CHARGE_MODEL_DIRECT,
  STRIPE_CHARGE_MODEL_LEGACY,
} from "@/lib/stripeConnect";

function getPaymentIntentId(session) {
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id || null;
}

export async function recordCompletedCheckout(session, connectedAccountId = null) {
  const bookingId = session.metadata?.booking_id;

  if (!bookingId) {
    return { received: true, ignored: true, reason: "Missing booking_id metadata" };
  }

  if (session.payment_status !== "paid") {
    return {
      received: true,
      ignored: true,
      reason: "Checkout Session is not paid",
    };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Server is missing Supabase admin environment variables");

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, status, stripe_account_id, stripe_charge_model")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) throw new Error(bookingError.message);
  if (!booking) return { received: true, ignored: true, reason: "Booking not found" };

  const expectedModel = connectedAccountId
    ? STRIPE_CHARGE_MODEL_DIRECT
    : STRIPE_CHARGE_MODEL_LEGACY;

  if (booking.stripe_charge_model !== expectedModel) {
    return { received: true, ignored: true, reason: "Charge model mismatch" };
  }

  if (
    connectedAccountId &&
    String(booking.stripe_account_id || "") !== String(connectedAccountId)
  ) {
    return { received: true, ignored: true, reason: "Connected account mismatch" };
  }

  if (booking.status === "completed") return { ok: true, status: "completed" };

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: getPaymentIntentId(session),
      ...(connectedAccountId ? { payout_status: "paid", payout_error: null } : {}),
    })
    .eq("id", bookingId);

  if (updateError) throw new Error(updateError.message);
  return { ok: true };
}
