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
    <header className="border-b border-stone-200 bg-white/90 text-zinc-900 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="text-xl font-semibold text-zinc-900">
          Watch My Plot
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-700">
          <Link href="/" className="hover:text-zinc-900 hover:underline">
            Home
          </Link>
          <Link href="/requests" className="hover:text-zinc-900 hover:underline">
            Browse requests
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hover:text-zinc-900 hover:underline"
              >
                Dashboard
              </Link>
              <Link
                href="/bookings"
                className="hover:text-zinc-900 hover:underline"
              >
                Bookings
              </Link>
              <Link
                href="/profile"
                className="hover:text-zinc-900 hover:underline"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={logout}
                className="hover:text-zinc-900 hover:underline"
              >
                Log out
              </button>
            </>
          ) : (
            <Link href="/login" className="hover:text-zinc-900 hover:underline">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
