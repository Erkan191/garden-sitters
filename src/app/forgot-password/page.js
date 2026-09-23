"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleResetRequest(event) {
    event.preventDefault();
    setSending(true);
    setMsg("");

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      setMsg(
        error.message.toLowerCase().includes("rate limit")
          ? "Too many reset emails have been requested. Please wait a little while and try again."
          : "We could not send the reset email. Please try again."
      );
      setSending(false);
      return;
    }

    setSent(true);
    setSending(false);
  }

  return (
    <main className="wmp-auth-page flex items-center">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <Link href="/login" className="wmp-back-link">
            ← Back to log in
          </Link>

          <p className="mt-8 wmp-eyebrow">Account recovery</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Reset your password securely.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Enter the email address you used for Watch My Plot. We’ll send you a
            secure link to choose a new password.
          </p>
        </section>

        <section className="wmp-panel rounded-lg sm:p-8">
          <p className="wmp-eyebrow">Forgotten password</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-900">
            {sent ? "Check your email" : "Get a reset link"}
          </h2>

          {sent ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                If an account exists for <strong>{email.trim()}</strong>, a password
                reset email is on its way. Check your junk folder if it does not
                arrive within a few minutes.
              </div>
              <button
                type="button"
                onClick={() => {
                  setSent(false);
                  setMsg("");
                }}
                className="wmp-button wmp-button-secondary w-full"
              >
                Send another link
              </button>
              <Link href="/login" className="wmp-button wmp-button-primary w-full">
                Return to log in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetRequest} className="mt-6 space-y-4">
              <div>
                <label className="wmp-label" htmlFor="reset-email">
                  Email
                </label>
                <input
                  id="reset-email"
                  className="mt-1 wmp-field rounded-lg"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="wmp-button wmp-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? "Sending reset link..." : "Email me a reset link"}
              </button>

              {msg && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {msg}
                </div>
              )}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
