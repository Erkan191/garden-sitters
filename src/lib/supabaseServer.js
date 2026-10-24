import { createClient } from "@supabase/supabase-js";

function publicSupabaseKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createPublicServerClient(options = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicSupabaseKey();

  if (!url || !key) return null;

  return createClient(url, key, {
    ...options,
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
      ...options.auth,
    },
  });
}

export function createAuthenticatedServerClient(token) {
  return createPublicServerClient({
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
