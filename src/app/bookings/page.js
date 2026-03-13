"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function BookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMsg("");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return router.push("/login");

      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, amount_gbp, created_at, request_id, offer_id")
        .order("created_at", { ascending: false });

      if (error) setMsg(error.message);
      else setBookings(data ?? []);

      setLoading(false);
    }

    load();
  }, [router]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My bookings</h1>
          <a className="underline" href="/requests">Requests</a>
        </div>

        {loading && <p className="mt-4">Loading...</p>}
        {msg && <p className="mt-4">{msg}</p>}

        {!loading && !msg && (
          <div className="mt-6 space-y-3">
            {bookings.length === 0 ? (
              <p>No bookings yet.</p>
            ) : (
              bookings.map((b) => (
                <a
                  key={b.id}
                  href={`/bookings/${b.id}`}
                  className="block rounded-2xl border p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">£{b.amount_gbp}</p>
                    <p className="text-sm opacity-80">Status: {b.status}</p>
                  </div>
                  <p className="mt-2 text-xs opacity-60">
                    {new Date(b.created_at).toLocaleString()}
                  </p>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}