import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
          <header className="border-b border-stone-200 bg-white/90 text-zinc-900 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-xl font-semibold text-zinc-900">
                Watch My Plot
              </Link>

              <nav className="flex items-center gap-4 text-sm text-zinc-700">
                <Link href="/" className="hover:text-zinc-900 hover:underline">
                  Home
                </Link>
                <Link
                  href="/requests"
                  className="hover:text-zinc-900 hover:underline"
                >
                  Browse requests
                </Link>
                <Link
                  href="/login"
                  className="hover:text-zinc-900 hover:underline"
                >
                  Log in
                </Link>
              </nav>
            </div>
          </header>

          <div>{children}</div>

          <footer className="mt-16 border-t border-stone-200 bg-white/90">
            <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-zinc-500">
              Watch My Plot — growers helping growers keep plots, veg beds, greenhouses, and gardens thriving while they’re away.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}