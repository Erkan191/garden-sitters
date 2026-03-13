"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function BookingSuccessPage() {
  const { id } = useParams(); // booking id
  const search = useSearchParams();
  const sessionId = search.get("session_id");

  const [msg, setMsg] = useState("Confirming payment...");
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    async function confirm() {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) return setMsg("Please log in again, then refresh this page.");

      if (!sessionId) return setMsg("Missing session_id in URL.");

      const res = await fetch("/api/stripe/checkout/confirm", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: id, sessionId }),
      });

      const json = await res.json();
      if (!res.ok) return setMsg(json.error || "Failed to confirm payment");

      setPaid(true);
      setMsg("Payment confirmed ✅ Booking is paid.");
    }

    confirm();
  }, [id, sessionId]);

  async function completeAndPay() {
    setMsg("Completing booking and paying gardener...");

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return setMsg("Please log in again.");

    const res = await fetch("/api/stripe/payout/complete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: id }),
    });

    const json = await res.json();
    if (!res.ok) return setMsg(json.error || "Failed to pay gardener");

    setMsg(`Completed ✅ Transfer: ${json.transferId}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Booking success</h1>

        <p className="mt-4">{msg}</p>

        {paid && (
          <button
            onClick={completeAndPay}
  className="mt-4 inline-flex items-center justify-center rounded-xl bg-black text-white px-4 py-2 border border-black cursor-pointer"
          >
            Mark completed + Pay gardener
          </button>
        )}

        <a className="mt-6 inline-block underline" href="/requests">
          Back to requests
        </a>
      </div>
    </main>
  );
}