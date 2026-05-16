import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-16">
        <section className="relative isolate grid gap-10 overflow-hidden rounded-[2.5rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/80 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.08)] sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-emerald-100/80 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/4 -z-10 h-72 w-72 rounded-full bg-stone-200/50 blur-3xl" />
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-900/70">
              Watch My Plot
            </p>

            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Find growers and gardeners who know how to look after what you grow.
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-zinc-600">
              Going away should not mean coming back to scorched pots, missed
              harvests, or sad seedlings. Watch My Plot helps you find local people
              who understand the small jobs that keep a productive garden alive.
            </p>

            <div className="flex max-w-2xl flex-wrap gap-2">
              <span className="rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-sm text-zinc-700">
                Greenhouse tomatoes
              </span>
              <span className="rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-sm text-zinc-700">
                Seedling checks
              </span>
              <span className="rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-sm text-zinc-700">
                Veg beds
              </span>
              <span className="rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-sm text-zinc-700">
                Pots in heatwaves
              </span>
              <span className="rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-sm text-zinc-700">
                Harvesting
              </span>
              <span className="rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-sm text-zinc-700">
                Watering routines
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/requests"
                className="rounded-xl bg-emerald-900 px-5 py-3 font-medium text-white shadow-sm hover:bg-emerald-800"
              >
                Browse requests
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-medium text-zinc-900 hover:bg-stone-50"
              >
                Log in to get started
              </Link>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white/70 p-4 shadow-sm">
              <p className="text-sm leading-6 text-zinc-600">
                Browse first with no account. Sign up only when you want to post a
                request, send an offer, chat, pay, or leave a review.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-white/85 p-5 text-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,0.10)] backdrop-blur sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3 rounded-full border border-emerald-100 bg-emerald-50/70 px-4 py-2 text-xs font-medium text-emerald-900">
              <span>Example match</span>
              <span>Local • skilled • reviewed</span>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4 text-zinc-900">
                <p className="text-sm font-medium text-zinc-500">Example plot request</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">
                  Water veg beds, check seedlings, and harvest greenhouse tomatoes
                </p>
                                <p className="mt-2 text-sm text-zinc-600">
                  N13 • 10 Jul → 17 Jul • £90 offered
                </p>

                <div className="mt-3 rounded-xl bg-stone-50 p-3 text-sm leading-6 text-zinc-600">
                  “Please water in the evening, check the greenhouse vents, and pick
                  ripe tomatoes so the plants keep producing.”
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-stone-200 px-2 py-1 text-xs text-zinc-700">
                    Daily visits
                  </span>
                  <span className="rounded-full border border-stone-200 px-2 py-1 text-xs text-zinc-700">
                    Watering
                  </span>
                  <span className="rounded-full border border-stone-200 px-2 py-1 text-xs text-zinc-700">
                    Greenhouse
                  </span>
                  <span className="rounded-full border border-stone-200 px-2 py-1 text-xs text-zinc-700">
                    Veg beds
                  </span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4 text-zinc-900">
                <p className="text-sm font-medium text-zinc-500">
                  Why Watch My Plot is different
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  This isn’t just generic house-sitting for plants. It’s about matching
                  growers with people who understand veg beds, greenhouses, harvesting,
                  seedlings, and the rhythm of a productive garden.
                </p>
              </div>
            </div>
          </div>
        </section>

                <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.4fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Trust before booking
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
                Designed so owners can judge the right kind of help.
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Plant care is personal. The app is built around skills, profiles,
                clear requests, chat, and reviews so people do not have to choose blindly.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 p-4">
                <p className="text-sm font-medium text-zinc-900">Skill-based profiles</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Watering, harvesting, greenhouses, seedlings, veg beds, pots, and more.
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 p-4">
                <p className="text-sm font-medium text-zinc-900">Public browsing first</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Visitors can look around before committing to an account.
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 p-4">
                <p className="text-sm font-medium text-zinc-900">Chat after acceptance</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Owners and gardeners can agree the practical details before the job starts.
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50/70 p-4">
                <p className="text-sm font-medium text-zinc-900">Reviews after completion</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Completed bookings build trust for the next owner or gardener.
                </p>
              </div>
            </div>
          </div>
        </section>

                <section id="how-it-works" className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-zinc-900">
              From “I’m away next week” to “my plants survived”.
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Watch My Plot is built for proper growing tasks: watering at the right
              time, checking seedlings, opening greenhouse vents, harvesting, and
              keeping things ticking over while somebody is away.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 text-zinc-900 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-900">
                1
              </div>
              <p className="text-base font-semibold text-zinc-900">
                Post the care your plants need
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Owners describe the plot, dates, visit frequency, budget, and what
                needs doing: watering, harvesting, seedlings, greenhouse care, pots, or veg beds.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 text-zinc-900 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-900">
                2
              </div>
              <p className="text-base font-semibold text-zinc-900">
                Local growers send offers
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Gardeners can explain why they are a good fit. Owners compare profiles,
                skills, messages, and reviews before accepting an offer.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 text-zinc-900 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-900">
                3
              </div>
              <p className="text-base font-semibold text-zinc-900">
                Chat, complete, and review
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Once accepted, both sides can chat through the practical details.
                After the job, payment and reviews help keep the marketplace trustworthy.
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-emerald-950 via-emerald-900 to-zinc-900 p-8 text-white shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-100/80">
                Have a look around
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                See real plot care requests before signing up.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/80">
                Browse the marketplace, see what owners need, and get a feel for the
                kind of gardeners Watch My Plot is built for. No account needed until
                you want to take action.
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-xs text-emerald-50/80">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                  Browse without logging in
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                  Offers and chat after signup
                </span>
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
                  Reviews after completed jobs
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:flex-col md:items-stretch">
              <Link
                href="/requests"
                className="rounded-xl bg-white px-5 py-3 text-center font-medium text-emerald-950 hover:bg-emerald-50"
              >
                Browse live requests
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center font-medium text-white hover:bg-white/15"
              >
                Log in or create account
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
