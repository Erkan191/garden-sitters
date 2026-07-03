import Link from "next/link";
import { BetaNotice } from "../LaunchNotices";

export const metadata = {
  title: "Contact | Watch My Plot",
  description: "Contact information for Watch My Plot private beta support.",
};

function ContactCard({ title, children }) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">
        {children}
      </div>
    </section>
  );
}

export default function ContactPage() {
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
            Contact
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Contact Watch My Plot.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Use this page for private beta support, payment questions, safety
            concerns, and data requests.
          </p>
        </section>

        <BetaNotice />

        <ContactCard title="Support email">
          <p>
            Placeholder support email:{" "}
            <span className="font-medium text-zinc-900">
              support@watchmyplot.example
            </span>
          </p>
          <p>
            Replace this placeholder with the final private beta support inbox
            before inviting testers. If you were invited directly, you can also
            use the contact details included with your invite.
          </p>
        </ContactCard>

        <ContactCard title="Payment issues">
          <p>
            For payment, checkout, refund, payout, or Stripe onboarding problems,
            include your account email, the request or booking title, the rough
            date of the issue, and what happened. Do not send card numbers or
            passwords.
          </p>
        </ContactCard>

        <ContactCard title="Safety or report issues">
          <p>
            For safety concerns, suspicious behaviour, access problems, or misuse,
            contact us as soon as possible with the request or booking details and
            a short description of the concern.
          </p>
          <p>
            If there is immediate danger, use the appropriate local emergency
            service first.
          </p>
        </ContactCard>

        <ContactCard title="Response times">
          <p>
            Watch My Plot is a private beta, so response times may vary. Payment,
            safety, and account access issues should be prioritised where possible.
          </p>
        </ContactCard>
      </div>
    </main>
  );
}
