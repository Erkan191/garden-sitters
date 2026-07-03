"use client";

import Link from "next/link";

export function BetaNotice({ className = "" }) {
  return (
    <section
      className={`rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 ${className}`}
    >
      <p className="font-semibold">Private beta</p>
      <p className="mt-1">
        Watch My Plot is being tested with a small group. The app helps connect
        garden owners and gardeners, and features, payments, policies, and
        availability may change during beta.
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
      className={`rounded-[1.5rem] border border-stone-200 bg-stone-50/80 p-4 text-sm leading-6 text-zinc-600 ${className}`}
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
