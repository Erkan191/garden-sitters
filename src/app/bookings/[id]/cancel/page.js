"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function BookingCancelPage() {
  const { id } = useParams();

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-amber-50/70 p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-2xl">
            !
          </div>

          <p className="mt-6 text-sm font-medium uppercase tracking-[0.14em] text-amber-800/70">
            Payment cancelled
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            No payment was taken.
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Checkout was cancelled before payment completed. You can return to the
            booking or request and try again when you’re ready.
          </p>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-zinc-900">
            What next?
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-600">
            The booking has not been paid yet. If you still want to go ahead, return
            to the booking or request and restart payment.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/bookings/${id}`}
              className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800"
            >
              View booking
            </Link>

            <Link
              href="/requests"
              className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-stone-50"
            >
              Back to requests
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 hover:bg-stone-50"
            >
              Go to dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}