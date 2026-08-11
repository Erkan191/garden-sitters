import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Header from "./Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Watch My Plot",
  description:
    "Find trusted local gardeners to look after watering, harvesting, greenhouses, pots, seedlings, and veg beds while you're away.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-stone-50 text-zinc-900 antialiased`}
      >
        <div className="min-h-screen">
          <Header />

          <div>{children}</div>

          <footer className="border-t border-emerald-950/10 bg-[#f1eadc]">
            <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm text-zinc-700 md:grid-cols-[1.2fr_0.8fr] md:items-start">
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-zinc-950"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-950 text-sm font-bold text-white">
                    W
                  </span>
                  <span>Watch My Plot</span>
                </Link>
                <p className="mt-4 max-w-xl leading-6">
                  Private beta marketplace for owners who need garden care and
                  local gardeners who can help with watering, harvesting,
                  greenhouses, pots, seedlings, and veg beds.
                </p>
                <p className="mt-3 text-xs leading-5 text-zinc-500">
                  Payments are handled through Stripe. Watch My Plot helps
                  connect users during beta but does not guarantee outcomes,
                  vet every user, or provide insurance.
                </p>
              </div>

              <nav className="grid grid-cols-2 gap-x-6 gap-y-3 md:justify-self-end">
                <Link href="/" className="hover:text-emerald-950">
                  Home
                </Link>
                <Link href="/#how-it-works" className="hover:text-emerald-950">
                  How it works
                </Link>
                <Link href="/requests" className="hover:text-emerald-950">
                  Browse jobs
                </Link>
                <Link href="/requests/new" className="hover:text-emerald-950">
                  Post a request
                </Link>
                <Link href="/privacy" className="hover:text-emerald-950">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-emerald-950">
                  Terms
                </Link>
                <Link href="/contact" className="hover:text-emerald-950">
                  Contact
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
