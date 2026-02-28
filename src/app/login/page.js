"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("Logging in...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(error.message);

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Log in</h1>

        <form onSubmit={handleLogin} className="mt-4 space-y-3">
          <div>
            <label className="text-sm">Email</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-sm">Password</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          <button className="w-full rounded-xl bg-black text-white p-2">
            Log in
          </button>

          {msg && <p className="text-sm opacity-80">{msg}</p>}
        </form>

        <p className="mt-4 text-sm">
          No account yet? <a className="underline" href="/signup">Sign up</a>
        </p>
      </div>
    </main>
  );
}
