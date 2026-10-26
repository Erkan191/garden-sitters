import Link from "next/link";
import { MarketplaceNotice } from "../LaunchNotices";

export const metadata = {
  title: "Terms | Watch My Plot",
  description: "Marketplace, booking, payment and cancellation terms for Watch My Plot.",
};

function Section({ title, children }) {
  return (
    <section className="wmp-panel rounded-lg">
      <h2 className="text-2xl font-bold text-zinc-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-600">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="wmp-page">
      <div className="wmp-narrow wmp-stack">
        <Link href="/" className="wmp-back-link">Back home</Link>

        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <p className="wmp-eyebrow">Terms</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Watch My Plot marketplace terms
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Version 2026-10-26-v2. These terms apply to use of Watch My Plot and
            bookings made through it. Save or print a copy for your records.
          </p>
        </section>

        <MarketplaceNotice />

        <Section title="Operator and contact">
          <p>
            The service trades as Watch My Plot and operates watchmyplot.com. For
            support, cancellations, complaints, safety reports and legal notices,
            email <span className="font-medium text-zinc-900">support@watchmyplot.com</span>.
          </p>
          <p>
            The operator’s full legal name and geographic service address must also
            be provided to users. Those details are being finalised and will be added
            before wider commercial promotion.
          </p>
        </Section>

        <Section title="Who may use the service">
          <p>
            Watch My Plot is strictly for people aged 18 or over. You must be able
            to enter a binding contract and must give accurate, current account and
            profile information. Accounts may not be shared or transferred.
          </p>
          <p>
            Watch My Plot may ask for information needed for safety, payments,
            tax reporting or legal compliance. Age confirmation is currently
            self-certified unless we expressly say otherwise.
          </p>
        </Section>

        <Section title="How the marketplace works">
          <p>
            Watch My Plot provides an online marketplace that introduces garden
            owners (“owners”) and people offering garden-care services (“gardeners”).
            A gardener chooses whether to offer, sets their proposed total price and
            decides how to perform the agreed service, subject to the owner’s lawful
            instructions, the agreed result and appropriate safety standards.
          </p>
          <p>
            Your contract for use of the platform is with Watch My Plot. The
            garden-care contract is between the owner and gardener and is formed when
            the owner accepts the offer and completes payment. Watch My Plot is not
            the gardener and does not itself perform the garden care.
          </p>
          <p>
            Gardeners are not promised work, do not have to accept requests, may work
            for other people or platforms, and are responsible for their own tools,
            working methods, tax and business obligations. Describing a relationship
            as independent does not override any employment or tax status that the law
            assigns from the real working arrangements.
          </p>
        </Section>

        <Section title="Gardeners acting as businesses">
          <p>
            A gardener may be acting as a trader or business even without a company.
            This depends on matters such as the regularity, purpose and scale of their
            paid work. Gardeners must not misrepresent their status and must comply
            with any consumer, tax, licensing or reporting duties that apply to them.
          </p>
          <p>
            Where an owner is a consumer and the gardener is acting as a trader,
            mandatory consumer rights apply to their garden-care contract. These can
            include requirements that services are performed with reasonable care and
            skill and remedies where they are not. Nothing in these terms removes
            rights that cannot lawfully be excluded.
          </p>
        </Section>

        <Section title="Before accepting or paying">
          <p>
            Owners and gardeners must agree the work, dates, visit frequency, total
            price and any important limitations in the request, offer or private
            messages. Owners must disclose known hazards, unsafe structures, animals,
            access restrictions and any particularly valuable or fragile plants or
            property relevant to the work.
          </p>
          <p>
            Users should arrange a conversation or meet-and-greet where sensible.
            Watch My Plot does not currently verify every identity, qualification,
            criminal record, gardening skill or insurance policy. Profiles, reviews
            and payment onboarding should not be treated as a universal safety check.
          </p>
        </Section>

        <Section title="Location, keys and private access">
          <p>
            Public requests may show only a broad area. Never publish a full address,
            full UK postcode, access code, alarm information, key location or other
            sensitive security detail. UK full postcodes entered in the request area
            are shortened automatically.
          </p>
          <p>
            Share an exact address and necessary access arrangements privately only
            after choosing the other person. Do not put alarm codes or precise hidden
            key locations in Watch My Plot messages; exchange those in person or by a
            separate secure method and change temporary codes after the booking.
          </p>
          <p>
            The owner remains responsible for giving lawful, reasonably safe access
            and clear key-return instructions. The gardener must use access only for
            the booked work, keep keys and information secure, and return keys as
            agreed. Suspected theft, immediate danger or unlawful entry should be
            reported to the appropriate authorities as well as Watch My Plot.
          </p>
        </Section>

        <Section title="Standards for garden care">
          <p>
            Gardeners must perform accepted work with reasonable care and skill,
            follow agreed instructions, avoid work they cannot safely or competently
            perform, and promptly report incidents, damage or material changes.
            Owners must not request unlawful or unreasonably hazardous work.
          </p>
          <p>
            Plants, crops and outdoor environments are affected by weather, pests,
            disease, soil, irrigation and other factors outside either party’s control.
            A booking is not a promise of a particular harvest, yield, growth or plant
            survival unless the gardener expressly agrees a specific lawful result.
          </p>
        </Section>

        <Section title="Insurance and guarantees">
          <p>
            Watch My Plot does not currently provide platform insurance, a booking
            guarantee, compensation fund or reimbursement guarantee. This is different
            from marketplaces that fund a separate contractual guarantee.
          </p>
          <p>
            Gardener public-liability or business insurance is recommended but is not
            initially compulsory unless the law, an owner, a site or another contract
            requires it. A gardener who states that they are insured must ensure the
            statement is accurate and that the policy covers the booked activities.
            Owners should consider their own home, contents, allotment and garden cover.
          </p>
        </Section>

        <Section title="Price, platform fee and Stripe">
          <p>
            The owner pays the total shown for the accepted offer. Watch My Plot does
            not add a separate owner service fee. The gardener pays Watch My Plot a
            platform fee equal to 15% of the booking total and also bears Stripe’s
            processing and connected-account charges. The gardener therefore receives
            the booking total less the 15% fee and Stripe charges.
          </p>
          <p>
            Payments and gardener onboarding are provided by Stripe under Stripe’s
            own terms. A booking is paid only when Stripe reports successful payment.
            Taxes are not added unless expressly shown before payment. Each user remains
            responsible for taxes and records that apply to them.
          </p>
        </Section>

        <Section title="Cancellation before work starts">
          <p>
            Launch policy: if either the owner or gardener cancels before any booked
            work starts, the owner is entitled to a full refund of the amount paid.
            Watch My Plot will return its 15% platform fee as part of that full refund.
            The owner is not charged a cancellation fee, so the non-refundable amount
            before work starts is £0, A$0 or NZ$0 as applicable.
          </p>
          <p>
            The same full-refund rule applies if the gardener does not attend or
            provides none of the booked service. Users must notify
            support@watchmyplot.com promptly. A reschedule or replacement occurs only
            if the owner freely agrees; it is not imposed instead of a refund.
          </p>
        </Section>

        <Section title="UK 14-day cancellation right">
          <p>
            Where the UK statutory right to cancel a distance service contract applies,
            the cancellation period normally lasts 14 days from the contract date. The
            launch policy above is more generous before work starts.
          </p>
          <p>
            If the owner asks for work to begin within that 14-day period, they expressly
            request early performance immediately before payment. If they then cancel
            after work has started, the service provider may be entitled to a fair,
            proportionate payment for work already supplied. The statutory cancellation
            right may end once the service has been fully performed, where the legally
            required request and acknowledgement were given. Mandatory rights remain.
          </p>
        </Section>

        <Section title="Cancellation or problems after work starts">
          <p>
            Once any booked work has started, there is no automatic change-of-mind
            refund under the launch policy. If a gardener stops part-way through,
            misses later agreed visits or performs only part of the service, the owner
            will receive at least any refund required by applicable law; any additional
            refund is assessed using the unperformed proportion, the agreement and the
            available evidence.
          </p>
          <p>
            Work-quality, crop-loss, plant-damage, property-damage, access and partly
            completed-job claims are reviewed case by case. Relevant evidence includes
            the request, accepted offer, messages, dates, photographs, receipts and
            proof of work. Review by Watch My Plot does not promise compensation and
            does not replace a claim against the responsible party or insurer.
          </p>
        </Section>

        <Section title="Refund method, disputes and chargebacks">
          <p>
            Approved refunds are returned to the original payment method through
            Stripe. For a full refund under the policy, the owner receives the full
            amount they paid; Stripe charges are not deducted from the owner’s refund.
            Stripe and the owner’s bank control the time taken for funds to appear.
          </p>
          <p>
            Refunds, failed delayed payments, disputes and chargebacks reported by
            Stripe are recorded against the booking. A dispute may debit the gardener’s
            connected Stripe account under Stripe’s rules. Users must preserve and
            provide relevant evidence and must not make a knowingly false claim.
          </p>
        </Section>

        <Section title="Reviews and user content">
          <p>
            Reviews must reflect a genuine completed booking. Users must not post
            unlawful, threatening, discriminatory, defamatory, fraudulent or
            privacy-invading content. Watch My Plot may remove content, restrict an
            account or preserve and disclose information where reasonably necessary
            for safety, legal compliance or enforcement of these terms.
          </p>
          <p>
            You keep ownership of content you submit but give Watch My Plot a
            non-exclusive licence to host, display and process it only as reasonably
            needed to operate, secure and promote the marketplace, subject to the
            privacy notice and your applicable rights.
          </p>
        </Section>

        <Section title="Platform availability and responsibility">
          <p>
            Watch My Plot will use reasonable care and skill in providing its platform
            service but does not promise uninterrupted availability. To the extent
            permitted by law, Watch My Plot is not responsible for garden care performed
            by users, losses caused solely by a user’s conduct, or indirect losses that
            were not reasonably foreseeable.
          </p>
          <p>
            Nothing in these terms excludes or limits liability where doing so would be
            unlawful, including liability for fraud or fraudulent misrepresentation,
            death or personal injury caused by negligence, or mandatory consumer rights.
            Nothing prevents an owner or gardener being responsible for their own
            negligence, breach of contract, property damage, theft or other unlawful act.
          </p>
        </Section>

        <Section title="Suspension and ending an account">
          <p>
            Watch My Plot may restrict or suspend an account where reasonably necessary
            for safety, suspected fraud, unlawful conduct, payment risk or a serious or
            repeated breach. Where appropriate, the user will be told the reason and
            given a reasonable opportunity to respond. Existing payment, refund,
            evidence-preservation and legal obligations continue after closure.
          </p>
        </Section>

        <Section title="Complaints and cancellation notice">
          <p>
            Email support@watchmyplot.com with the booking title, account email, dates,
            requested outcome and relevant evidence. To cancel, a clear statement that
            you wish to cancel is enough; no special wording is required. You may use:
            “I cancel booking [title/reference], booked on [date], for service starting
            [date]. My name is [name].”
          </p>
          <p>
            Watch My Plot aims to acknowledge urgent payment and safety matters promptly
            and to provide an initial response to an ordinary complaint within 14 days,
            although complex evidence or Stripe processes may take longer.
          </p>
        </Section>

        <Section title="Applicable law and international users">
          <p>
            These terms are governed by the law of England and Wales, but this does not
            remove mandatory rights or courts available to a consumer in their home
            country. Australian Consumer Law and New Zealand consumer guarantees may
            apply where the platform or a gardener supplies services to consumers there.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            The version accepted immediately before payment applies to that booking.
            Watch My Plot may update terms prospectively for legal, safety or service
            changes and will give reasonable notice of material changes where practicable.
            A later version will not retrospectively reduce an accrued refund or other
            mandatory right.
          </p>
        </Section>

        <Section title="Privacy">
          <p>
            The <Link href="/privacy" className="font-medium text-emerald-900 hover:underline">privacy notice</Link> explains
            how personal information is collected, used, shared and retained.
          </p>
        </Section>
      </div>
    </main>
  );
}
