import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { STRIPE_CHARGE_MODEL_DIRECT } from "@/lib/stripeConnect";

function stripeId(value) {
  return typeof value === "string" ? value : value?.id || null;
}

async function findDirectChargeBooking(paymentIntentId, connectedAccountId) {
  if (!paymentIntentId || !connectedAccountId) return null;

  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Server is missing Supabase admin environment variables");

  const { data, error } = await supabase
    .from("bookings")
    .select("id, amount, status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .eq("stripe_account_id", connectedAccountId)
    .eq("stripe_charge_model", STRIPE_CHARGE_MODEL_DIRECT)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function recordAsyncPaymentFailure(session, connectedAccountId) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId || !connectedAccountId) {
    return { received: true, ignored: true, reason: "Missing booking or account" };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Server is missing Supabase admin environment variables");

  const { error } = await supabase
    .from("bookings")
    .update({
      payment_failure_reason: "Stripe reported that the delayed payment failed.",
    })
    .eq("id", bookingId)
    .eq("stripe_account_id", connectedAccountId)
    .eq("status", "pending_payment");

  if (error) throw new Error(error.message);
  return { ok: true, status: "payment_failed" };
}

export async function recordChargeRefunded(charge, connectedAccountId) {
  const paymentIntentId = stripeId(charge.payment_intent);
  const booking = await findDirectChargeBooking(paymentIntentId, connectedAccountId);
  if (!booking) return { received: true, ignored: true, reason: "Booking not found" };

  const supabase = createSupabaseAdminClient();
  const amountRefunded = Number(charge.amount_refunded || 0) / 100;
  const fullRefund = Number(charge.amount_refunded || 0) >= Number(charge.amount || 0);
  const latestRefund = charge.refunds?.data?.[0];

  const { error } = await supabase
    .from("bookings")
    .update({
      refund_status: fullRefund ? "full" : "partial",
      refund_amount: amountRefunded,
      refunded_at: new Date().toISOString(),
      stripe_refund_id: latestRefund?.id || null,
      payment_failure_reason: null,
      ...(fullRefund ? { status: "refunded" } : {}),
    })
    .eq("id", booking.id);

  if (error) throw new Error(error.message);
  return { ok: true, status: fullRefund ? "refunded" : "partially_refunded" };
}

function disputeStatus(status) {
  if (status === "won" || status === "lost" || status === "warning_closed") return status;
  if (status === "under_review" || status === "warning_under_review") return "under_review";
  return "needs_response";
}

export async function recordDispute(dispute, connectedAccountId) {
  const paymentIntentId = stripeId(dispute.payment_intent);
  const booking = await findDirectChargeBooking(paymentIntentId, connectedAccountId);
  if (!booking) return { received: true, ignored: true, reason: "Booking not found" };

  const supabase = createSupabaseAdminClient();
  const status = disputeStatus(dispute.status);
  const { error } = await supabase
    .from("bookings")
    .update({
      dispute_status: status,
      stripe_dispute_id: dispute.id,
      dispute_reason: dispute.reason || null,
      disputed_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (error) throw new Error(error.message);
  return { ok: true, status: `dispute_${status}` };
}
