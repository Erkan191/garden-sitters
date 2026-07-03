import Link from "next/link";
import { BetaNotice } from "../LaunchNotices";

export const metadata = {
  title: "Privacy | Watch My Plot",
  description: "Private beta privacy information for Watch My Plot.",
};

function Section({ title, children }) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-emerald-900"
        >
          Back home
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
            Privacy
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            How Watch My Plot handles beta data.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            This page gives practical privacy information for the private beta. It
            is not final legal advice and may be updated as the service changes.
          </p>
        </section>

        <BetaNotice />

        <Section title="Information we collect">
          <p>
            We collect account details such as your email address and login
            account identifier.
          </p>
          <p>
            If you fill in your profile, we collect profile information such as
            your name, location, avatar, bio, skills, and payout connection status.
          </p>
          <p>
            We store the requests, offers, messages, bookings, reviews, dates,
            prices, and care details you add to the app.
          </p>
        </Section>

        <Section title="Payments">
          <p>
            Payments and payout onboarding are handled by Stripe. Watch My Plot
            does not ask you to enter card details directly into our own database.
            Stripe may collect payment, identity, payout, and fraud-prevention
            information under its own terms and privacy notices.
          </p>
        </Section>

        <Section title="Service providers">
          <p>
            We use providers such as Vercel for hosting, Supabase for
            authentication and database services, and Stripe for payments and
            payouts. These providers process data needed to run the app.
          </p>
        </Section>

        <Section title="How data is used">
          <p>
            We use your data to run the beta, show requests and offers, support
            bookings, enable messages and reviews, process payments, improve the
            service, and respond to support or safety issues.
          </p>
          <p>
            Some profile, request, offer, message, booking, and review information
            may be visible to other users where needed for the marketplace to work.
          </p>
        </Section>

        <Section title="Deletion and data questions">
          <p>
            For deletion requests, data questions, or privacy concerns, contact us
            through the <Link href="/contact" className="font-medium text-emerald-900 hover:underline">contact page</Link>.
            During private beta, response times may vary.
          </p>
        </Section>
      </div>
    </main>
  );
}
