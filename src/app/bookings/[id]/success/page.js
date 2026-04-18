"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function BookingSuccessPage() {
  const { id } = useParams();
  const search = useSearchParams();
  const sessionId = search.get("session_id");

  const [msg, setMsg] = useState("Confirming payment...");
  const [paid, setPaid] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    async function confirm() {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        setMsg("Please log in again, then refresh this page.");
        return;
      }

      if (!sessionId) {
        setMsg("Missing session_id in URL.");
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
        setMsg(json.error || "Failed to confirm payment");
        return;
      }

      setPaid(true);

      const { data: bookingRow } = await supabase
        .from("bookings")
        .select("status, completed_at, payout_status, stripe_transfer_id")
        .eq("id", id)
        .maybeSingle();

      if (bookingRow?.status === "completed") {
        setCompleted(true);
        setMsg(
          bookingRow?.stripe_transfer_id
            ? `Completed ✅ Transfer: ${bookingRow.stripe_transfer_id}`
            : "Completed ✅"
        );
      } else {
        setMsg("Payment confirmed ✅ Booking is paid.");
      }
    }

    confirm();
  }, [id, sessionId]);

  async function completeAndPay() {
    setCompleting(true);
    setMsg("Completing booking and paying gardener...");

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    if (!token) {
      setMsg("Please log in again.");
      setCompleting(false);
      return;
    }

    const res = await fetch("/api/stripe/payout/complete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: id }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(json.error || "Failed to pay gardener");
      setCompleting(false);
      return;
    }

    setCompleted(true);
    setCompleting(false);
    setMsg(`Completed ✅ Transfer: ${json.transferId}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
        <h1 className="text-2xl font-semibold">Booking success</h1>

        <p className="mt-4 text-zinc-700">{msg}</p>

        {paid && !completed && (
          <button
            onClick={completeAndPay}
            disabled={completing}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-black bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {completing ? "Completing booking..." : "Mark completed + Pay gardener"}
          </button>
        )}

        {completed && (
          <p className="mt-4 text-sm text-emerald-700">
            This booking has been marked completed.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-4">
          <a className="underline text-zinc-700" href={`/requests`}>
            Back to requests
          </a>

          <a className="underline text-zinc-700" href={`/dashboard`}>
            Go to dashboard
          </a>
        </div>

        <p className="mt-3 text-sm text-zinc-500">Booking id: {id}</p>
      </div>
    </main>
  );
}