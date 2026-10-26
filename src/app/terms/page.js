import Link from "next/link";
import { MarketplaceNotice } from "../LaunchNotices";

export const metadata = {
  title: "Terms | Watch My Plot",
  description: "Terms for Watch My Plot.",
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
            Practical marketplace terms.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            These terms explain the rules for using Watch My Plot. Last updated
            26 October 2026.
          </p>
        </section>

        <MarketplaceNotice />

        <Section title="Marketplace role">
          <p>
            Watch My Plot helps connect garden owners with gardeners. Owners and
            gardeners decide whether to work together and are responsible for the
            arrangements they make.
          </p>
        </Section>

        <Section title="Adults only">
          <p>
            You must be at least 18 years old to create an account, post or accept
            work, message another user, make a booking, or receive payment through
            Watch My Plot. By registering or confirming your profile, you confirm
            that you are 18 or over.
          </p>
        </Section>

        <Section title="Service changes">
          <p>
            Features, pricing, policies, payment flows, availability, and support
            processes may change as the service develops.
          </p>
        </Section>

        <Section title="User responsibilities">
          <p>
            Users are responsible for giving accurate information, choosing who to
            book or work with, and agreeing dates, price, access, keys, exact
            address, and care instructions clearly.
          </p>
          <p>
            Public requests must use only a broad area. Do not publish a full
            address, full UK postcode, access code, key location, alarm information,
            or other sensitive access details. Share the minimum necessary details
            privately only after choosing who to work with.
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
          <p>
            Watch My Plot does not currently provide an insurance policy or booking
            guarantee. Gardeners are responsible for deciding whether they need
            public liability or other business insurance. Owners should check their
            own home, allotment, contents, and garden cover where appropriate.
          </p>
        </Section>

        <Section title="Payments and payouts">
          <p>
            Owners pay the total price agreed in the accepted offer through Stripe.
            Watch My Plot keeps a platform fee equal to 15% of the booking price.
            Stripe processing costs are charged to the gardener’s connected Stripe
            account, so the gardener receives the booking price less the 15% platform
            fee and Stripe’s charges.
          </p>
          <p>
            Gardeners must complete Stripe onboarding before taking payment. A
            booking is confirmed only after Stripe reports successful payment.
            Owners should mark work complete only after the agreed care has been
            carried out.
          </p>
        </Section>

        <Section title="Cancellations and refunds">
          <p>
            Cancelling Stripe Checkout before payment completes does not create a
            paid booking and no refund is needed. After payment, contact Watch My
            Plot promptly and before the job starts whenever possible.
          </p>
          <p>
            If a gardener cancels, cannot attend, or does not provide the agreed
            service, the owner may receive a full or partial refund after the booking
            information and messages are reviewed. For a full approved refund,
            Watch My Plot will normally return its 15% platform fee. A partial refund
            normally returns the same proportion of the platform fee.
          </p>
          <p>
            If an owner cancels after payment, the refund may be full, partial, or
            unavailable depending on notice, work already completed, costs incurred,
            the parties’ agreement, and applicable consumer law. Refunds are sent to
            the original payment method; Stripe and the owner’s bank control how long
            the money takes to appear.
          </p>
          <p>
            Crop loss, plant damage, quality complaints, access problems, and partly
            completed work are reviewed using the request, accepted offer, booking
            messages, photographs, and other available evidence. These terms do not
            remove any rights that cannot lawfully be excluded.
          </p>
        </Section>

        <Section title="Payment disputes and chargebacks">
          <p>
            Contact Watch My Plot promptly if you do not recognise a payment or
            believe a refund is due. Stripe may debit a disputed amount and related
            costs from the gardener’s connected account under Stripe’s rules. Users
            must preserve relevant messages, instructions, photographs, and proof of
            work, and must respond to reasonable requests for evidence.
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
            these terms, use the <Link href="/contact" className="font-medium text-emerald-900 hover:underline">contact page</Link>.
          </p>
        </Section>
      </div>
    </main>
  );
}
