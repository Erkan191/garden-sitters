"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setMsg("Creating your account...");

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Success! Now log in.");
    router.push("/login");
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:bg-white";

  return (
    <main className="flex min-h-[calc(100vh-9rem)] items-center bg-stone-50 px-6 py-12 text-zinc-900 sm:py-16">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-zinc-600 hover:text-emerald-900"
          >
            ← Back home
          </Link>

          <p className="mt-8 text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
            Join Watch My Plot
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Create an account to post, offer, chat, and review.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Browse without signing up, then create an account when you want to take
            action: post a request, send an offer, manage bookings, or build trust
            through reviews.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.25rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-medium text-zinc-900">Owners</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Post plot care requests while you’re away.
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-medium text-zinc-900">Gardeners</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Offer to help local growers with practical care.
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-medium text-zinc-900">Reviews</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Build trust after completed jobs.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
              Sign up
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              Create your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Use an email and password. You can complete your profile after signing in.
            </p>
          </div>

          <form onSubmit={handleSignup} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700">Email</label>
              <input
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">
                Password
              </label>

              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="Choose a password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:bg-stone-100 hover:text-emerald-900"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.89 1 12a11.73 11.73 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A10.74 10.74 0 0 1 12 4c5 0 9.27 3.11 11 8a11.8 11.8 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <p className="mt-1 text-xs text-zinc-500">
                Password must be at least 6 characters.
              </p>
            </div>

            <button className="w-full rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800">
              Sign up
            </button>

            {msg && (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-zinc-600">
                {msg}
              </div>
            )}
          </form>

          <p className="mt-5 text-sm text-zinc-600">
            Already got an account?{" "}
            <Link
              className="font-medium text-emerald-900 hover:underline"
              href="/login"
            >
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}