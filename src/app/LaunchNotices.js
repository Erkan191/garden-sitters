"use client";

import Link from "next/link";

export function MarketplaceNotice({ className = "" }) {
  return (
    <section
      className={`rounded-lg border border-clay-200 bg-[#fff7ed] p-4 text-sm leading-6 text-clay-900 shadow-sm ${className}`}
    >
      <p className="font-semibold">Marketplace notice</p>
      <p className="mt-1">
        Watch My Plot helps connect garden owners and gardeners. Users remain
        responsible for choosing who to work with and agreeing the job, access,
        care instructions, and price. Features, payments, and policies may change
        as the service develops.
      </p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium">
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy
        </Link>
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>
        <Link href="/contact" className="underline underline-offset-2">
          Contact
        </Link>
      </div>
    </section>
  );
}

export function SafetyNotice({
  title = "Before you go ahead",
  children,
  className = "",
}) {
  return (
    <section
      className={`rounded-lg border border-emerald-900/10 bg-emerald-50/70 p-4 text-sm leading-6 text-zinc-700 ${className}`}
    >
      <p className="font-semibold text-zinc-900">{title}</p>
      <p className="mt-1">
        {children ||
          "Decide who to book or work with carefully. Agree dates, price, access, keys, exact address, and care instructions clearly. Do not share exact addresses, access details, or keys until you are comfortable with the other person. Watch My Plot does not guarantee plant outcomes, user skills, property safety, or insurance."}
      </p>
    </section>
  );
}

export function PaymentSafetyNotice({ className = "" }) {
  return (
    <SafetyNotice title="Before paying" className={className}>
      Payments are handled by Stripe. Pay only when you are comfortable with the
      gardener, dates, price, access arrangements, exact address, keys, and care
      instructions. Watch My Plot does not guarantee plant outcomes, user
      skills, property safety, or insurance.
    </SafetyNotice>
  );
}
