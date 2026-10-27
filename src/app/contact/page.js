import Link from "next/link";
import { MarketplaceNotice } from "../LaunchNotices";

export const metadata = {
  title: "Contact | Watch My Plot",
  description: "Contact and support information for Watch My Plot.",
};

function ContactCard({ title, children }) {
  return (
    <section className="wmp-panel rounded-lg">
      <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">
        {children}
      </div>
    </section>
  );
}

export default function ContactPage() {
  return (
    <main className="wmp-page">
      <div className="wmp-narrow wmp-stack">
        <Link
          href="/"
          className="wmp-back-link"
        >
          Back home
        </Link>

        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <p className="wmp-eyebrow">
            Contact
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Contact Watch My Plot.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Use this page for support, payment questions, safety
            concerns, and data requests.
          </p>
        </section>

        <MarketplaceNotice />

        <ContactCard title="Business details">
          <p>
            Watch My Plot is a trading name of Free Life Ventures Ltd, registered in
            England and Wales under company number 17547215.
          </p>
          <p>
            Registered office and geographic contact address: 132 The Larches,
            London, N13 5QE, England.
          </p>
        </ContactCard>

        <ContactCard title="Support email">
          <p>
            Email:{" "}
            <span className="font-medium text-zinc-900">
              support@watchmyplot.com
            </span>
          </p>
          <p>
            If you were invited directly, you can also use the contact details
            included with your invite.
          </p>
        </ContactCard>

        <ContactCard title="Payment issues">
          <p>
            For payment, checkout, refund, payout, or Stripe onboarding problems,
            include your account email, the request or booking title, the rough
            date of the issue, and what happened. Do not send card numbers or
            passwords.
          </p>
          <p>
            If either party cancels before any work starts, the owner receives a full
            refund. The amount kept from the owner is £0, A$0 or NZ$0. If the gardener
            cancels or does not attend and no work was supplied, the same full-refund
            rule applies and Watch My Plot returns its fee.
          </p>
          <p>
            To cancel, email a clear statement such as: “I cancel booking [title or
            reference], booked on [date], for service starting [date].” Include your
            account email and whether any work has started. After work starts, quality,
            crop-loss, damage and partly completed-job concerns are reviewed using the
            evidence and applicable legal rights; compensation is not guaranteed by
            Watch My Plot.
          </p>
          <p>
            Never send card numbers, bank details, passwords, alarm codes, or key
            locations by email.
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
            Response times may vary. Payment, safety, and account access issues
            should be prioritised where possible.
          </p>
        </ContactCard>
      </div>
    </main>
  );
}
