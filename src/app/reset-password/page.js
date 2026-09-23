"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checkingLink, setCheckingLink] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let active = true;
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const linkError = hashParams.get("error_description");

    if (linkError) {
      const timeoutId = window.setTimeout(() => {
        if (!active) return;
        setMsg(linkError);
        setCheckingLink(false);
      }, 0);

      return () => {
        active = false;
        window.clearTimeout(timeoutId);
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setRecoveryReady(true);
        setCheckingLink(false);
        setMsg("");
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setMsg("This reset link could not be checked. Please request a new one.");
      } else if (data.session) {
        setRecoveryReady(true);
      } else {
        setMsg("This reset link is invalid or has expired. Please request a new one.");
      }

      setCheckingLink(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handlePasswordUpdate(event) {
    event.preventDefault();
    setMsg("");

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("The passwords do not match.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMsg(error.message || "Your password could not be changed. Please try again.");
      setSaving(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login?reset=success");
  }

  const passwordType = showPassword ? "text" : "password";

  return (
    <main className="wmp-auth-page flex items-center">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <Link href="/login" className="wmp-back-link">
            ← Back to log in
          </Link>

          <p className="mt-8 wmp-eyebrow">Account recovery</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Choose a new password.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Use something memorable that you do not use for another account. Your
            new password must be at least 6 characters.
          </p>
        </section>

        <section className="wmp-panel rounded-lg sm:p-8">
          <p className="wmp-eyebrow">New password</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-900">
            Secure your account
          </h2>

          {checkingLink ? (
            <p className="mt-5 text-sm text-zinc-600">Checking your reset link...</p>
          ) : recoveryReady ? (
            <form onSubmit={handlePasswordUpdate} className="mt-6 space-y-4">
              <div>
                <label className="wmp-label" htmlFor="new-password">
                  New password
                </label>
                <input
                  id="new-password"
                  className="mt-1 wmp-field rounded-lg"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={passwordType}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Choose a new password"
                />
              </div>

              <div>
                <label className="wmp-label" htmlFor="confirm-password">
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  className="mt-1 wmp-field rounded-lg"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type={passwordType}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Type it again"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                  className="accent-emerald-900"
                />
                Show passwords
              </label>

              <button
                type="submit"
                disabled={saving}
                className="wmp-button wmp-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Changing password..." : "Change password"}
              </button>

              {msg && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  {msg}
                </div>
              )}
            </form>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
                {msg || "This reset link is invalid or has expired."}
              </div>
              <Link
                href="/forgot-password"
                className="wmp-button wmp-button-primary w-full"
              >
                Request a new reset link
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
