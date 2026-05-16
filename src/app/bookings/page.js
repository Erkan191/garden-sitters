"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function formatPrice(value) {
  if (value == null) return "Not set";
  return `£${Number(value).toFixed(0)}`;
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function getStatusLabel(status) {
  if (!status) return "Unknown";

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusBadgeClass(status) {
  if (status === "pending_payment") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }

  if (status === "paid") {
    return "bg-sky-50 text-sky-800 border-sky-100";
  }

  if (status === "completed") {
    return "bg-emerald-50 text-emerald-800 border-emerald-100";
  }

  return "bg-stone-100 text-stone-700 border-stone-200";
}

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

      if (!userData?.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select("id, status, amount_gbp, platform_fee_gbp, payout_status, created_at, request_id, offer_id")
        .order("created_at", { ascending: false });

      if (error) {
        setMsg(error.message);
        setBookings([]);
      } else {
        setBookings(data ?? []);
      }

      setLoading(false);
    }

    load();
  }, [router]);

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Bookings
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Your booked plot care jobs.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Track paid bookings, open chats, return to requests, and complete
                bookings once the agreed garden care has been carried out.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-white/75 p-4 shadow-sm">
              <p className="text-sm font-medium text-zinc-900">
                Payment note
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Gardeners are only paid out once a booking is completed.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                My bookings
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                Booking history
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/requests"
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
              >
                Browse requests
              </Link>

              <Link
                href="/dashboard"
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
              >
                Dashboard
              </Link>
            </div>
          </div>

          {loading && (
            <div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5 text-sm text-zinc-600">
              Loading bookings...
            </div>
          )}

          {msg && (
            <div className="mt-5 rounded-[1.5rem] border border-red-100 bg-red-50 p-5 text-sm text-red-700">
              {msg}
            </div>
          )}

          {!loading && !msg && (
            <div className="mt-5 space-y-3">
              {bookings.length === 0 ? (
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
                  <p className="text-sm font-medium text-zinc-900">
                    No bookings yet.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    Once an accepted offer is paid for, the booking will appear here.
                  </p>
                </div>
              ) : (
                bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bookings/${b.id}`}
                    className="block rounded-[1.5rem] border border-stone-200 bg-white p-5 text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xl font-semibold">
                            {formatPrice(b.amount_gbp)}
                          </p>

                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusBadgeClass(
                              b.status
                            )}`}
                          >
                            {getStatusLabel(b.status)}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-zinc-600">
                          Created: {formatDateTime(b.created_at)}
                        </p>

                        {b.platform_fee_gbp != null && (
                          <p className="mt-1 text-sm text-zinc-600">
                            Platform fee: {formatPrice(b.platform_fee_gbp)}
                          </p>
                        )}

                        <p className="mt-1 text-sm text-zinc-600">
                          Payout: {getStatusLabel(b.payout_status || "not_started")}
                        </p>
                      </div>

                      <span className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-zinc-900">
                        View booking
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}