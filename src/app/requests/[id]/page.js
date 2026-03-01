"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RequestDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState(null);
  const [msg, setMsg] = useState("");

  const [offerMessage, setOfferMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return router.push("/login");

      const { data, error } = await supabase
        .from("care_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) setMsg(error.message);
      else setReq(data);

      setLoading(false);
    }

    if (id) load();
  }, [id, router]);

  async function submitOffer(e) {
    e.preventDefault();
    setMsg("Submitting offer...");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return router.push("/login");

    const { error } = await supabase.from("offers").insert({
      request_id: id,
      gardener_id: user.id,
      message: offerMessage,
      proposed_price_gbp: offerPrice === "" ? null : Number(offerPrice),
    });

    if (error) return setMsg(error.message);

    setMsg("Offer sent ✅");
    setOfferMessage("");
    setOfferPrice("");
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p>Loading...</p>
      </main>
    );
  }

  if (!req) {
    return (
      <main className="min-h-screen p-6">
        <p>Request not found.</p>
        {msg && <p className="mt-2">{msg}</p>}
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <a className="underline" href="/requests">
          ← Back to requests
        </a>

        <div className="rounded-2xl border p-6">
          <h1 className="text-2xl font-semibold">{req.title}</h1>
          <p className="mt-2 text-sm opacity-80">
            {req.postcode || "No postcode"} • {req.start_date} → {req.end_date}
          </p>

          {req.price_offered_gbp != null && (
            <p className="mt-2 text-sm">Price offered: £{req.price_offered_gbp}</p>
          )}

          {req.details && <p className="mt-4 whitespace-pre-wrap">{req.details}</p>}
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Offer to help</h2>

          <form onSubmit={submitOffer} className="mt-4 space-y-3">
            <div>
              <label className="text-sm">Message (optional)</label>
              <textarea
                className="mt-1 w-full rounded-xl border p-2"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={4}
                placeholder="e.g. I grow veg too — happy to water properly and harvest if needed."
              />
            </div>

            <div>
              <label className="text-sm">Proposed price (£) (optional)</label>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 25"
              />
            </div>

            <button className="rounded-xl bg-black text-white px-4 py-2">
              Send offer
            </button>

            {msg && <p className="text-sm opacity-80">{msg}</p>}
          </form>
        </div>
      </div>
    </main>
  );
}