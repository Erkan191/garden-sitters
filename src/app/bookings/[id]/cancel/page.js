"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BetaNotice } from "../../../LaunchNotices";

export default function BookingCancelPage() {
  const { id } = useParams();

  return (
    <main className="wmp-page">
      <div className="wmp-narrow wmp-stack">
        <section className="wmp-hero rounded-lg bg-[#fffdf8] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-amber-100 bg-amber-50 text-2xl">
            !
          </div>

          <p className="mt-6 wmp-eyebrow">
            Payment cancelled
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            No payment was taken.
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Checkout was cancelled before payment completed. You can return to the
            booking or request and try again when you’re ready.
          </p>
        </section>

        <BetaNotice />

        <section className="wmp-panel rounded-lg">
          <h2 className="text-2xl font-bold text-zinc-900">
            What next?
          </h2>

          <p className="mt-3 text-sm leading-6 text-zinc-600">
            The booking has not been paid yet. If you still want to go ahead, return
            to the booking or request and restart payment.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/bookings/${id}`}
              className="wmp-button wmp-button-primary"
            >
              View booking
            </Link>

            <Link
              href="/requests"
              className="wmp-button wmp-button-secondary"
            >
              Back to requests
            </Link>

            <Link
              href="/dashboard"
              className="wmp-button wmp-button-secondary"
            >
              Go to dashboard
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
