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
  title: "Garden Sitters",
  description:
    "Find local gardeners to care for your plants and veg while you're away.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-zinc-50 text-black antialiased`}
      >
        <div className="min-h-screen">
          <header className="border-b border-zinc-200 bg-white text-zinc-900">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="text-xl font-semibold text-zinc-900">
                Garden Sitters
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

          <footer className="mt-16 border-t border-zinc-200 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-zinc-500">
              Garden Sitters — local gardeners helping gardeners while they’re
              away.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}