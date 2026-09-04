"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BetaNotice } from "../LaunchNotices";

function formatPrice(value) {
  if (value == null) return "Not set";
  const number = Number(value);

  if (!Number.isFinite(number)) return "Not set";

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number);
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

const primaryButtonClass =
  "wmp-button wmp-button-primary inline-flex justify-center";
const secondaryButtonClass =
  "wmp-button wmp-button-secondary inline-flex justify-center";

function friendlyError(message) {
  const text = String(message || "");
  const lower = text.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("typeerror") ||
    lower.includes("network")
  ) {
    return "We couldn't load this just now. Please refresh or try again in a moment.";
  }

  return text || "We couldn't load this just now. Please refresh or try again in a moment.";
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
    <main className="wmp-page">
      <div className="wmp-shell wmp-stack">
        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="wmp-eyebrow">
                Bookings
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Your booked plot care jobs.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Track paid bookings, open chats, return to requests, and complete
                bookings once the agreed garden care has been carried out.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-[#f4f8ef] p-4 shadow-sm">
              <p className="text-sm font-bold text-zinc-900">
                Payment note
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Gardeners are only paid out once a booking is completed.
              </p>
            </div>
          </div>
        </section>

        <BetaNotice />

        <section className="wmp-panel rounded-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="wmp-eyebrow">
                My bookings
              </p>
              <h2 className="mt-1 text-2xl font-bold text-zinc-900">
                Booking history
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/requests"
                className={`w-full sm:w-auto ${secondaryButtonClass}`}
              >
                Browse jobs
              </Link>

              <Link
                href="/dashboard"
                className={`w-full sm:w-auto ${secondaryButtonClass}`}
              >
                Dashboard
              </Link>
            </div>
          </div>

          {loading && (
            <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50/70 p-5 text-sm text-zinc-600">
              Loading bookings...
            </div>
          )}

          {msg && (
            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-5 text-sm leading-6 text-red-800">
              <p className="font-medium">We could not load bookings.</p>
              <p className="mt-1">{friendlyError(msg)}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 wmp-button border border-red-200 bg-white text-red-800 hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !msg && (
            <div className="mt-5 space-y-3">
              {bookings.length === 0 ? (
                <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-5">
                  <p className="text-sm font-bold text-zinc-900">
                    No bookings yet
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    Bookings appear here once an offer is accepted and paid.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link href="/requests" className={`w-full sm:w-auto ${primaryButtonClass}`}>
                      Browse jobs
                    </Link>
                    <Link
                      href="/requests/new"
                      className={`w-full sm:w-auto ${secondaryButtonClass}`}
                    >
                      Post a request
                    </Link>
                  </div>
                </div>
              ) : (
                bookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/bookings/${b.id}`}
                    className="wmp-card-link rounded-lg"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xl font-bold">
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

                      <span className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-bold text-zinc-900">
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
