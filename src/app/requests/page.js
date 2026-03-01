"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return router.push("/login");

      const { data, error } = await supabase
        .from("care_requests")
        .select("id, title, postcode, start_date, end_date, price_offered_gbp, status, created_at")
        .order("created_at", { ascending: false });

      if (error) setErrorMsg(error.message);
      else setRequests(data ?? []);

      setLoading(false);
    }

    load();
  }, [router]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Care requests</h1>
          <a className="underline" href="/requests/new">New request</a>
        </div>

        {loading && <p className="mt-4">Loading...</p>}
        {errorMsg && <p className="mt-4">{errorMsg}</p>}

        {!loading && !errorMsg && (
          <div className="mt-6 space-y-3">
            {requests.length === 0 ? (
              <p>No requests yet.</p>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="rounded-2xl border p-4">
                  <h2 className="text-lg font-semibold">{r.title}</h2>
                  <p className="text-sm opacity-80">
                    {r.postcode || "No postcode"} • {r.start_date} → {r.end_date}
                  </p>
                  <p className="mt-1 text-sm opacity-80">
                    Status: {r.status}
                    {r.price_offered_gbp != null ? ` • £${r.price_offered_gbp}` : ""}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}