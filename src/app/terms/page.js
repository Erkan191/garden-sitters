import Link from "next/link";
import { BetaNotice } from "../LaunchNotices";

export const metadata = {
  title: "Terms | Watch My Plot",
  description: "Private beta terms for Watch My Plot.",
};

function Section({ title, children }) {
  return (
    <section className="wmp-panel rounded-lg">
      <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
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
            Terms
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Practical private beta terms.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            These terms are written for the Watch My Plot private beta. They are
            plain practical wording and are not final legal advice.
          </p>
        </section>

        <BetaNotice />

        <Section title="Marketplace role">
          <p>
            Watch My Plot helps connect garden owners with gardeners. Owners and
            gardeners decide whether to work together and are responsible for the
            arrangements they make.
          </p>
        </Section>

        <Section title="Private beta">
          <p>
            The service is in private beta. Features, pricing, policies, payment
            flows, availability, and support processes may change while the product
            is tested.
          </p>
        </Section>

        <Section title="User responsibilities">
          <p>
            Users are responsible for giving accurate information, choosing who to
            book or work with, and agreeing dates, price, access, keys, exact
            address, and care instructions clearly.
          </p>
          <p>
            Do not share exact addresses, access details, key locations, alarm
            information, or other sensitive details until you are comfortable with
            the other person.
          </p>
        </Section>

        <Section title="Safety and access">
          <p>
            Use common sense when arranging access to a home, garden, allotment,
            greenhouse, shed, or keys. Avoid unsafe tasks and do not ask another
            user to do anything unlawful or hazardous.
          </p>
          <p>
            Unless explicitly stated, Watch My Plot does not universally vet users,
            verify gardening skills, provide insurance, guarantee property safety,
            or guarantee gardening results or plant survival.
          </p>
        </Section>

        <Section title="Payments and payouts">
          <p>
            Payments are handled by Stripe. Gardeners may need to complete Stripe
            payout onboarding before offers can be accepted or paid out.
          </p>
          <p>
            Owners should only mark a booking complete once the agreed care has
            actually been carried out. Payouts are released according to the app
            flow shown at the time.
          </p>
        </Section>

        <Section title="Cancellations and refunds">
          <p>
            During private beta, cancellations and refunds are handled case by
            case. Contact us promptly if a booking, payment, access, or care issue
            needs review.
          </p>
        </Section>

        <Section title="Prohibited misuse">
          <p>
            Do not use Watch My Plot for fraud, spam, harassment, unsafe access
            requests, unlawful work, misleading profiles or offers, scraping, or
            attempts to bypass payment or security protections.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            For support, payment problems, safety concerns, or questions about
            these beta terms, use the <Link href="/contact" className="font-medium text-emerald-900 hover:underline">contact page</Link>.
          </p>
        </Section>
      </div>
    </main>
  );
}
