"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (mounted) {
        setUser(data?.user || null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-[#fffdf8]/95 text-zinc-950 shadow-[0_8px_24px_rgba(26,37,30,0.04)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-lg font-bold tracking-tight text-zinc-950"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-950 text-sm font-bold text-white shadow-sm ring-2 ring-clay-200/70">
            W
          </span>
          <span>Watch My Plot</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-zinc-700">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-950"
          >
            Home
          </Link>
          <Link
            href="/#how-it-works"
            className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-950"
          >
            How it works
          </Link>
          <Link
            href="/requests"
            className="rounded-lg px-3 py-2 hover:bg-emerald-50 hover:text-emerald-950"
          >
            Browse jobs
          </Link>
          <Link
            href="/requests/new"
            className="rounded-lg bg-clay-500 px-4 py-2 text-white shadow-sm hover:bg-clay-700"
          >
            Post a request
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg border border-emerald-900/15 bg-white px-4 py-2 text-emerald-950 shadow-sm hover:border-emerald-900/30 hover:bg-emerald-50"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-3 py-2 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-950"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-emerald-900/15 bg-white px-4 py-2 text-emerald-950 shadow-sm hover:border-emerald-900/30 hover:bg-emerald-50"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
