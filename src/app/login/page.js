"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("Logging in...");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/dashboard");
  }

  const inputClass =
    "mt-1 wmp-field rounded-lg";

  return (
    <main className="wmp-auth-page flex items-center">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <Link
            href="/"
            className="wmp-back-link"
          >
            ← Back home
          </Link>

          <p className="mt-8 wmp-eyebrow">
            Welcome back
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Log in to manage your plot care.
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Sign in to post requests, send offers, chat after jobs are accepted,
            manage bookings, complete payments, and leave reviews.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-stone-200 bg-[#fbfbf7] p-4">
              <p className="text-sm font-bold text-zinc-900">Requests</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Create and manage plot care requests.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-[#fbfbf7] p-4">
              <p className="text-sm font-bold text-zinc-900">Offers</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Offer to help local growers.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-[#fbfbf7] p-4">
              <p className="text-sm font-bold text-zinc-900">Trust</p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                Build reviews after completed jobs.
              </p>
            </div>
          </div>
        </section>

        <section className="wmp-panel rounded-lg sm:p-8">
          <div>
            <p className="wmp-eyebrow">
              Log in
            </p>

            <h2 className="mt-2 text-2xl font-bold text-zinc-900">
              Access your account
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Use the email and password you signed up with.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="wmp-label">Email</label>
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
              <label className="wmp-label">
                Password
              </label>

              <div className="relative">
                <input
                  className={`${inputClass} pr-11`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Your password"
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
            </div>

            <button className="wmp-button wmp-button-primary w-full">
              Log in
            </button>

            {msg && (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-zinc-600">
                {msg}
              </div>
            )}
          </form>

          <p className="mt-5 text-sm text-zinc-600">
            No account yet?{" "}
            <Link
              className="font-medium text-emerald-900 hover:underline"
              href="/signup"
            >
              Sign up
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
