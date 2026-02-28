"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setMsg("Signing you up...");

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(error.message);

    setMsg("Success! Now log in.");
    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Create account</h1>

        <form onSubmit={handleSignup} className="mt-4 space-y-3">
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
              minLength={6}
            />
          </div>

          <button className="w-full rounded-xl bg-black text-white p-2">
            Sign up
          </button>

          {msg && <p className="text-sm opacity-80">{msg}</p>}
        </form>

        <p className="mt-4 text-sm">
          Already got an account? <a className="underline" href="/login">Log in</a>
        </p>
      </div>
    </main>
  );
}
