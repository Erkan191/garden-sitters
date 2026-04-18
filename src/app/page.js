import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-16">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-400">
              Cat in a Flat, but for gardeners
            </p>

            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Find local gardeners who actually know how to look after plants.
            </h1>

            <p className="max-w-2xl text-lg text-zinc-300">
              Whether it’s tomatoes in a greenhouse, thirsty pots in a heatwave,
              or veg beds that need harvesting at the right time, Garden Sitters
              helps you find local people who know what they’re doing.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/requests"
                className="rounded-xl bg-white px-5 py-3 font-medium text-black"
              >
                Browse requests
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-zinc-600 px-5 py-3 font-medium text-white"
              >
                Log in to get started
              </Link>
            </div>

            <p className="text-sm text-zinc-400">
              You can browse first. You’ll only need an account when you want to
              send offers, chat, book, review, or edit your profile.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900">
                <p className="text-sm font-medium text-zinc-500">Example request</p>
                <p className="mt-2 text-lg font-semibold text-zinc-900">
                  Water veg beds + greenhouse tomatoes
                </p>
                <p className="mt-2 text-sm text-zinc-600">N13 • 10 Jul → 17 Jul</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-700">
                    Daily visits
                  </span>
                  <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-700">
                    Watering
                  </span>
                  <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-700">
                    Greenhouse
                  </span>
                  <span className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-700">
                    Veg beds
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900">
                <p className="text-sm font-medium text-zinc-500">Why this is different</p>
                <p className="mt-2 text-sm text-zinc-600">
                  This isn’t about somebody vaguely spraying a hose around.
                  It’s about matching gardeners with other gardeners who
                  understand watering, harvesting, seedlings, greenhouses, and
                  productive gardens.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">How it works</h2>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
              <p className="text-sm font-medium text-zinc-500">1. Browse first</p>
              <p className="mt-2 text-sm text-zinc-600">
                Look through requests, public profiles, and reviews before you
                commit to creating an account.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
              <p className="text-sm font-medium text-zinc-500">
                2. Sign up when you’re ready
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Create an account when you want to send an offer, accept one,
                chat, pay, or manage your own profile.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
              <p className="text-sm font-medium text-zinc-500">
                3. Book with confidence
              </p>
              <p className="mt-2 text-sm text-zinc-600">
                Use reviews, gardener skills, and request-specific matches to
                choose the right person for the job.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">
                Ready to have a look around?
              </h2>
              <p className="mt-2 text-sm text-zinc-600">
                Browse live care requests before signing up.
              </p>
            </div>

            <Link
              href="/requests"
              className="rounded-xl bg-black px-5 py-3 font-medium text-white"
            >
              Browse requests
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}