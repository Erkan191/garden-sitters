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
    "Find growers and gardeners to look after veg beds, greenhouses, pots, and gardens while you're away.",
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

          <footer className="mt-16 border-t border-stone-200 bg-white/90">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Watch My Plot - growers helping growers keep plots, veg beds,
                greenhouses, and gardens thriving while they are away.
              </p>

              <nav className="flex flex-wrap gap-x-4 gap-y-2">
                <Link href="/" className="hover:text-zinc-900 hover:underline">
                  Home
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-zinc-900 hover:underline"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-zinc-900 hover:underline"
                >
                  Terms
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-zinc-900 hover:underline"
                >
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
