import Link from "next/link";
import { MarketplaceNotice } from "../LaunchNotices";

export const metadata = {
  title: "Privacy | Watch My Plot",
  description: "Privacy notice for Watch My Plot owners and gardeners.",
};

function Section({ title, children }) {
  return (
    <section className="wmp-panel rounded-lg">
      <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="wmp-page">
      <div className="wmp-narrow wmp-stack">
        <Link href="/" className="wmp-back-link">Back home</Link>

        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <p className="wmp-eyebrow">Privacy</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            How Watch My Plot uses personal information
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Version 2026-10-27-v3. This notice applies to owners, gardeners,
            website visitors and people who contact Watch My Plot.
          </p>
        </section>

        <MarketplaceNotice />

        <Section title="Controller and contact">
          <p>
            Free Life Ventures Ltd, trading as Watch My Plot, decides why and how the
            platform’s personal information is used and is therefore the controller
            for that processing. It is a company registered in England and Wales under
            company number 17547215.
          </p>
          <p>
            Registered office and geographic contact address: 132 The Larches,
            London, N13 5QE, England. Privacy requests and complaints should be sent to
            <span className="font-medium text-zinc-900"> support@watchmyplot.com</span>.
          </p>
        </Section>

        <Section title="Information collected">
          <p>
            Account and eligibility information includes email address, authentication
            identifier, country, account role and the date and time you confirmed that
            you are 18 or over. The standard signup journey does not request your date
            of birth.
          </p>
          <p>
            Profile information can include your name, broad location, avatar, biography,
            skills, experience, prices, country, currency and Stripe onboarding status.
            Marketplace information includes requests, offers, messages, booking dates,
            agreed prices, reviews, completion records and information supplied for a
            complaint, refund, safety report or dispute.
          </p>
          <p>
            Payment records include Stripe customer, account, Checkout, payment, refund
            and dispute identifiers and status information. Watch My Plot does not store
            full card numbers. Stripe separately collects payment, identity, bank,
            fraud-prevention and connected-account information under its own notices.
          </p>
          <p>
            Hosting, authentication and security providers may automatically process
            technical information such as IP address, browser or device information,
            timestamps, requested pages and security or error logs. Support emails and
            operational email delivery records are also processed.
          </p>
        </Section>

        <Section title="Where information comes from">
          <p>
            Most information comes directly from you. Watch My Plot also receives
            information from the other booking participant, Stripe payment and dispute
            events, authentication and hosting providers, and people who submit a report
            or complaint. Where legally required, we will tell you about material
            information obtained from another source.
          </p>
        </Section>

        <Section title="Why information is used and the lawful bases">
          <p>
            <span className="font-medium text-zinc-900">Contract and steps requested before a contract:</span>{" "}
            creating and securing accounts, displaying profiles and requests, supporting
            offers, private messages, bookings, payments, confirmations, refunds and
            reviews.
          </p>
          <p>
            <span className="font-medium text-zinc-900">Legitimate interests:</span>{" "}
            operating and improving a safe marketplace, answering support requests,
            preventing fraud and misuse, securing systems, keeping proportionate evidence,
            enforcing terms and establishing or defending legal claims. These interests
            are balanced against users’ rights and reasonable expectations.
          </p>
          <p>
            <span className="font-medium text-zinc-900">Legal obligation:</span>{" "}
            accounting and tax records, responding to valid legal requests, safeguarding
            legal rights and any seller-information or digital-platform reporting duties
            that apply.
          </p>
          <p>
            <span className="font-medium text-zinc-900">Consent:</span>{" "}
            used only where the law requires a genuine choice, such as optional direct
            marketing if it is introduced. Consent can be withdrawn without affecting
            processing that was lawful beforehand. Watch My Plot does not currently send
            general marketing emails through the app.
          </p>
        </Section>

        <Section title="What is public and what is private">
          <p>
            Public profiles and open requests may display a name chosen for the profile,
            avatar, biography, skills, indicative price, reviews and broad location.
            A public request must not contain an exact address or security details. UK
            full postcodes entered as a request area are shortened before storage.
          </p>
          <p>
            Offers, booking records and messages are restricted to relevant signed-in
            participants and authorised service administration. Exact addresses may be
            exchanged privately after agreement. Do not put alarm codes or precise hidden
            key locations in Watch My Plot messages; exchange them in person or through a
            separate secure method and change temporary codes after use.
          </p>
        </Section>

        <Section title="Who receives information">
          <p>
            Necessary information is shared with the owner or gardener involved in a
            request or booking. Service providers include Supabase for authentication and
            database services, Vercel for hosting and delivery, Stripe for payments and
            payouts, and Resend for operational email. They process information under
            their own contractual and security obligations.
          </p>
          <p>
            Information may also be disclosed to professional advisers, insurers,
            auditors, payment-dispute participants, courts, regulators, tax authorities,
            law enforcement or emergency services where reasonably necessary and lawful.
            If the business is sold or reorganised, relevant information may transfer
            subject to appropriate confidentiality and data-protection requirements.
          </p>
          <p>
            Watch My Plot does not sell personal information.
          </p>
        </Section>

        <Section title="International processing">
          <p>
            Some providers or their support teams may process information outside the
            United Kingdom, Australia or New Zealand. Where UK restricted-transfer rules
            apply, Watch My Plot relies on an adequacy regulation or appropriate
            contractual and organisational safeguards supplied by the provider. Contact
            us for information about the relevant safeguard for a particular transfer.
          </p>
        </Section>

        <Section title="Retention">
          <p>
            Account and profile information is normally kept while the account is active.
            After closure, it is deleted or anonymised when no longer needed, subject to
            outstanding bookings, safety concerns, disputes and legal duties.
          </p>
          <p>
            Booking, payment, refund, dispute, tax and material complaint records—and the
            messages or evidence needed to understand them—may be retained for up to six
            years after the booking or closure of the matter, reflecting common tax and
            legal-claim periods in England and Wales. Information may be kept longer where
            a live claim, court order, safeguarding issue or legal obligation requires it.
          </p>
          <p>
            Technical and security logs are kept according to provider settings and only
            for as long as reasonably needed for security, troubleshooting and legal
            compliance. Data that has been safely anonymised may be kept for statistics
            because it no longer identifies a person.
          </p>
        </Section>

        <Section title="Your choices and rights">
          <p>
            Depending on where you live and the circumstances, you may ask for access,
            correction, deletion, restriction, objection or portability of personal
            information and may withdraw consent. A deletion request does not require
            removal of information that must lawfully be kept for payment, tax, safety,
            dispute or legal-claim purposes.
          </p>
          <p>
            Send requests to support@watchmyplot.com. Watch My Plot may ask for
            proportionate proof of identity and normally responds to UK rights requests
            within one month. UK users may complain to the Information Commissioner’s
            Office; Australian users may contact the Office of the Australian Information
            Commissioner where its jurisdiction applies; New Zealand users may contact
            the Office of the Privacy Commissioner.
          </p>
        </Section>

        <Section title="Required and optional information">
          <p>
            Email, authentication information, country, 18+ confirmation and information
            needed for a booking or payment are required to provide the relevant feature.
            Without them, Watch My Plot cannot provide that feature. Optional profile
            details can generally be left blank, although a sparse profile may make it
            harder for another user to decide whether to work with you.
          </p>
        </Section>

        <Section title="Automated decisions">
          <p>
            Watch My Plot does not currently make decisions with legal or similarly
            significant effects solely by automated processing. Stripe and security
            providers may use automated fraud and risk tools under their own notices.
          </p>
        </Section>

        <Section title="Cookies and local storage">
          <p>
            The site currently uses browser storage needed to remember the selected
            country and maintain sign-in and security functions. Watch My Plot does not
            currently deploy its own advertising or optional analytics cookies. Stripe
            may use its own necessary security and payment technologies when you visit
            Stripe-hosted pages. If non-essential analytics or advertising technologies
            are introduced, the notice and consent controls will be updated first.
          </p>
        </Section>

        <Section title="Security and incidents">
          <p>
            Watch My Plot uses access controls, restricted database policies, hosted
            payment pages and other proportionate safeguards. No online system can be
            guaranteed completely secure. Users must protect their passwords and report
            suspected account or access compromise promptly. Report immediate physical
            danger to the appropriate emergency service first.
          </p>
        </Section>

        <Section title="Adults only">
          <p>
            The service is not intended for anyone under 18 and Watch My Plot does not
            knowingly create accounts for children. Contact us if you believe a person
            under 18 has supplied personal information.
          </p>
        </Section>

        <Section title="Changes to this notice">
          <p>
            This notice is updated when processing or legal requirements materially
            change. The version and date appear at the top. Material changes will be
            brought to users’ attention where reasonably practicable.
          </p>
        </Section>
      </div>
    </main>
  );
}
