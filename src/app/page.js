import Link from "next/link";
import { BetaNotice } from "./LaunchNotices";

const buttonBase = "wmp-button w-full sm:w-auto";
const primaryButton = `${buttonBase} wmp-button-primary`;
const secondaryButton = `${buttonBase} wmp-button-secondary`;
const clayButton = `${buttonBase} wmp-button-clay`;
const lightButton = `${buttonBase} bg-white text-emerald-950 hover:bg-emerald-50`;

const careTasks = [
  {
    title: "Watering",
    copy: "Regular visits for beds, pots, greenhouse crops, and thirsty plants.",
  },
  {
    title: "Harvesting",
    copy: "Pick ripe crops so plants keep producing while owners are away.",
  },
  {
    title: "Greenhouse checks",
    copy: "Open vents, check heat, water carefully, and keep crops moving.",
  },
  {
    title: "Pots",
    copy: "Extra attention for containers that dry out quickly in warm weather.",
  },
  {
    title: "Seedlings",
    copy: "Gentle checks for young plants, trays, and new growth.",
  },
  {
    title: "Veg beds",
    copy: "Care for raised beds, allotment-style plots, and productive borders.",
  },
];

const ownerSteps = [
  "Post a request",
  "Compare offers",
  "Pay securely",
  "Mark complete",
];

const gardenerSteps = [
  "Browse jobs",
  "Send an offer",
  "Do the work",
  "Get paid after completion",
];

const faqs = [
  {
    question: "Is Watch My Plot live?",
    answer:
      "Watch My Plot is in private beta. A small group is testing the marketplace, so features, support processes, and availability may change.",
  },
  {
    question: "How do payments work?",
    answer:
      "Owners pay through Stripe after accepting an offer. Watch My Plot records the booking and keeps both sides clear on the status.",
  },
  {
    question: "When does the gardener get paid?",
    answer:
      "The gardener is not paid out until the owner marks the booking complete after the agreed care has been carried out.",
  },
  {
    question: "Should I share my exact address publicly?",
    answer:
      "No. Start with a rough area or postcode. Share exact access details only in chat once you are comfortable with the person and the arrangement.",
  },
  {
    question: "Are gardeners vetted or insured?",
    answer:
      "During private beta, Watch My Plot helps users connect but does not guarantee outcomes, vet every user, or provide insurance.",
  },
  {
    question: "What happens if something goes wrong?",
    answer:
      "Contact Watch My Plot with the booking details. During private beta, refunds, access problems, safety concerns, and care issues are handled case by case.",
  },
];

function SectionIntro({
  eyebrow,
  title,
  copy,
  align = "left",
  tone = "dark",
}) {
  const isLight = tone === "light";

  return (
    <div
      className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      <p className={`wmp-eyebrow ${isLight ? "wmp-eyebrow-light" : ""}`}>
        {eyebrow}
      </p>
      <h2
        className={`mt-3 wmp-h2 ${
          isLight ? "wmp-h2-light" : "text-zinc-950"
        }`}
      >
        {title}
      </h2>
      {copy && (
        <p
          className={`mt-4 text-base leading-7 ${
            isLight ? "wmp-copy-light" : "text-zinc-600"
          }`}
        >
          {copy}
        </p>
      )}
    </div>
  );
}

function StepList({ title, steps, accent = "emerald" }) {
  const accentClasses =
    accent === "clay"
      ? "border-clay-200 bg-clay-50 text-clay-900"
      : "border-emerald-100 bg-emerald-50 text-emerald-950";

  return (
    <div className="wmp-panel rounded-lg">
      <h3 className="text-lg font-bold text-zinc-950">{title}</h3>
      <ol className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <li key={step} className="grid grid-cols-[2.25rem_1fr] gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${accentClasses}`}
            >
              {index + 1}
            </span>
            <span className="self-center text-sm font-bold text-zinc-800">
              {step}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function GardenPanel() {
  return (
    <div
      className="relative mx-auto w-full max-w-lg overflow-hidden rounded-lg border border-emerald-900/10 bg-[#fffdf8] p-4 shadow-[0_24px_70px_rgba(25,50,32,0.14)]"
      aria-hidden="true"
    >
      <div className="relative rounded-lg border border-emerald-950/10 bg-[#f1f7ed] p-4">
        <div className="flex items-center justify-between gap-3 border-b border-emerald-950/10 pb-3 text-xs font-bold text-emerald-950">
          <span>Nearby care request</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-clay-700">
            N13
          </span>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_0.7fr] gap-3">
          <div className="space-y-2">
            {[0, 1, 2, 3].map((row) => (
              <div
                key={row}
                className="rounded-full border border-emerald-950/10 bg-[#6a452f] p-1.5 shadow-inner"
              >
                <div className="grid grid-cols-7 gap-1">
                  {[0, 1, 2, 3, 4, 5, 6].map((plant) => (
                    <span
                      key={plant}
                      className={`h-4 rounded-full ${
                        (row + plant) % 4 === 0
                          ? "bg-clay-400"
                          : (row + plant) % 4 === 1
                          ? "bg-emerald-300"
                          : (row + plant) % 4 === 2
                          ? "bg-lime-200"
                          : "bg-sage-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-emerald-900/10 bg-white p-3">
            <p className="text-xs font-bold text-zinc-500">Offer</p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">£28</p>
            <p className="mt-1 text-xs leading-5 text-zinc-600">
              4 visits, greenhouse and pots
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {["10-17 Jul", "Daily", "Payout later"].map((item) => (
            <span
              key={item}
              className="rounded-lg border border-emerald-950/10 bg-white px-3 py-2 text-xs font-bold text-emerald-950"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="text-zinc-950">
      <section className="relative overflow-hidden border-b border-emerald-950/10 bg-[#f7f7f1]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
          <div>
            <p className="wmp-eyebrow">Garden care, sorted locally</p>

            <h1 className="mt-5 max-w-4xl wmp-h1">
              Find someone kind to watch your plot while you&apos;re away.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700">
              Post a care request for watering, harvesting, greenhouse checks,
              pots, seedlings, and veg beds. Local gardeners can offer to help,
              and payment stays clear from booking to completion.
            </p>

            <form
              action="/requests"
              className="mt-7 grid gap-3 rounded-lg border border-emerald-950/10 bg-white p-3 shadow-[0_16px_36px_rgba(26,37,30,0.08)] sm:grid-cols-[1fr_auto]"
            >
              <label className="sr-only" htmlFor="postcode">
                Postcode or area
              </label>
              <input
                id="postcode"
                name="postcode"
                className="wmp-field rounded-lg"
                placeholder="Enter postcode or area, e.g. N13"
              />
              <button className="wmp-button wmp-button-primary">
                Browse nearby jobs
              </button>
            </form>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/requests/new" className={clayButton}>
                Post a request
              </Link>
              <Link href="/requests" className={secondaryButton}>
                Browse all jobs
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl gap-3 text-sm text-zinc-700 sm:grid-cols-3">
              <div className="border-l-2 border-clay-400 pl-3">
                <p className="font-bold text-zinc-950">Rough area first</p>
                <p className="mt-1">Share exact access details later.</p>
              </div>
              <div className="border-l-2 border-sage-500 pl-3">
                <p className="font-bold text-zinc-950">Clear offers</p>
                <p className="mt-1">Compare message, price, skills, and fit.</p>
              </div>
              <div className="border-l-2 border-emerald-700 pl-3">
                <p className="font-bold text-zinc-950">Stripe payments</p>
                <p className="mt-1">Gardeners are paid after completion.</p>
              </div>
            </div>
          </div>

          <GardenPanel />
        </div>
      </section>

      <section className="bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="wmp-card rounded-lg bg-[#f4f8ef]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
                Owners
              </p>
              <h2 className="mt-3 text-2xl font-bold text-zinc-950">
                I need garden help
              </h2>
              <p className="mt-3 leading-7 text-zinc-700">
                Post what needs care, keep your public location broad, compare
                gardener offers, pay securely, then mark the booking complete
                once the work is done.
              </p>
              <Link href="/requests/new" className={`mt-6 ${primaryButton}`}>
                Start a request
              </Link>
            </div>

            <div className="wmp-card rounded-lg bg-[#fff6ef]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-clay-800">
                Gardeners
              </p>
              <h2 className="mt-3 text-2xl font-bold text-zinc-950">
                I want garden jobs
              </h2>
              <p className="mt-3 leading-7 text-zinc-700">
                Browse local care requests, send practical offers, agree the
                details in chat, do the work, and receive payout after the owner
                completes the booking.
              </p>
              <Link href="/requests" className={`mt-6 ${secondaryButton}`}>
                Browse jobs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[#f7f7f1] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionIntro
            eyebrow="How it works"
            title="Two simple paths, one clear booking flow."
            copy="Watch My Plot separates the owner and gardener journeys so each person knows what to do next."
            align="center"
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <StepList title="For garden owners" steps={ownerSteps} />
            <StepList
              title="For gardeners"
              steps={gardenerSteps}
              accent="clay"
            />
          </div>
        </div>
      </section>

      <section className="bg-emerald-950 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <SectionIntro
            eyebrow="How money works"
            title="Payments stay clear from offer to completion."
            copy="The money flow is deliberately simple for private beta testing."
            tone="light"
          />

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              "Owners pay through Stripe after accepting an offer.",
              "The gardener is not paid out until the booking is completed.",
              "During private beta, refunds and issues are handled case by case.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-white/10 p-5 text-sm leading-6 text-emerald-50"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionIntro
            eyebrow="Care tasks"
            title="Built for the small jobs that keep gardens alive."
            copy="From a few pots on a patio to a productive greenhouse, requests can describe the care that actually matters."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {careTasks.map((task) => (
              <article
                key={task.title}
                className="wmp-card rounded-lg bg-[#fbfbf7]"
              >
                <div className="mb-4 h-1.5 w-16 rounded-full bg-clay-500" />
                <h3 className="text-lg font-bold text-zinc-950">
                  {task.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  {task.copy}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef6ea] py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionIntro
            eyebrow="Trust and safety"
            title="Practical reassurance without overpromising."
            copy="Garden care involves homes, access, keys, plants, and trust. The product should help people make careful choices."
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Start with rough locations on public requests.",
              "Chat before sharing exact addresses or access details.",
              "Agree dates, care instructions, keys, and access clearly.",
              "Watch My Plot helps connect users but does not guarantee outcomes, vet every user, or provide insurance.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-emerald-950/10 bg-white/80 p-5 text-sm leading-6 text-zinc-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <BetaNotice />
        </div>
      </section>

      <section className="bg-[#fbf8f1] py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <SectionIntro
            eyebrow="FAQ"
            title="Private beta questions"
            copy="Short answers for owners and gardeners before they try the marketplace."
            align="center"
          />

          <div className="mt-10 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white shadow-sm">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-bold text-zinc-950">
                  {faq.question}
                  <span className="text-xl leading-none text-emerald-900 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-zinc-700">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-emerald-950 py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clay-200">
              Private beta
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to test Watch My Plot?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
              Try the core marketplace flow: post a garden care request or
              browse local jobs from owners who need help.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/requests/new" className={lightButton}>
              Post a request
            </Link>
            <Link
              href="/requests"
              className={`${buttonBase} border border-white/20 bg-white/10 text-white hover:bg-white/15`}
            >
              Browse jobs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
