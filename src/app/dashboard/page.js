"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return router.push("/login");
      setEmail(data.user.email ?? "");
    }
    load();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-xl rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2">Logged in as: {email || "..."}</p>

        <button onClick={logout} className="mt-6 rounded-xl border px-4 py-2">
          Log out
        </button>
      </div>
    </main>
  );
}
