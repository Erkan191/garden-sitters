"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BetaNotice } from "../../../LaunchNotices";

const primaryButtonClass =
  "wmp-button wmp-button-primary inline-flex justify-center";
const secondaryButtonClass =
  "wmp-button wmp-button-secondary inline-flex justify-center";

export default function BookingSuccessPage() {
  const { id } = useParams();
  const search = useSearchParams();
  const sessionId = search.get("session_id");

  const [msg, setMsg] = useState("Confirming payment...");
  const [paid, setPaid] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function confirm() {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        setMsg("Please log in again, then refresh this page.");
        return;
      }

      if (!sessionId) {
        setMsg("Missing Stripe checkout confirmation. Please return to your booking.");
        return;
      }

      const res = await fetch("/api/stripe/checkout/confirm", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: id, sessionId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMsg(json.error || "Failed to confirm payment.");
        return;
      }

      setPaid(true);

      const { data: bookingRow } = await supabase
        .from("bookings")
        .select("status, completed_at, payout_status, stripe_transfer_id, request_id")
        .eq("id", id)
        .maybeSingle();

      if (bookingRow?.status === "completed") {
        setCompleted(true);
        setMsg("Booking completed.");
      } else {
        setMsg("You're booked. Payment is confirmed and the gardener's share is in their Stripe account.");
      }
    }

    confirm();
  }, [id, sessionId]);

  return (
    <main className="wmp-page">
      <div className="wmp-narrow wmp-stack">
        <section className="wmp-hero rounded-lg bg-[#fffdf8] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-2xl">
            ✓
          </div>

          <p className="mt-6 wmp-eyebrow">
            Payment
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            You're booked.
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Your payment has been confirmed. Return to the conversation to message
            your gardener and keep everything about the visit in one place.
          </p>
        </section>

        <BetaNotice />

        <section className="wmp-panel rounded-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="wmp-eyebrow">
                Status
              </p>

              <h2 className="mt-1 text-2xl font-bold text-zinc-900">
                {completed ? "Booking completed" : paid ? "Booking paid" : "Confirming payment"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {msg}
              </p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-950 sm:max-w-xs">
              {completed
                ? "The booking is complete. Reviews can now be left where available."
                : paid
                  ? "Only mark the booking complete once the work has actually been done."
                  : "This usually only takes a few seconds."}
            </div>
          </div>

          {paid && !completed && (
            <div className="mt-6 rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 text-sm leading-6 text-emerald-950">
              <p className="font-medium">Booking confirmed and paid securely.</p>
              <p className="mt-1">
                The gardener's share has been sent to their Stripe balance. Come back
                after the plot care has been carried out to mark the booking complete.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/bookings/${id}`}
              className={`w-full sm:w-auto ${primaryButtonClass}`}
            >
              View booking
            </Link>

            <Link
              href="/dashboard"
              className={`w-full sm:w-auto ${secondaryButtonClass}`}
            >
              Go to dashboard
            </Link>

            <Link
              href="/requests"
              className={`w-full sm:w-auto ${secondaryButtonClass}`}
            >
              Browse jobs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
