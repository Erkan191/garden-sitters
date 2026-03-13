import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

function supabaseFromToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return Response.json({ error: "Missing token" }, { status: 401 });

    const supabase = supabaseFromToken(token);

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;

    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr) return Response.json({ error: profileErr.message }, { status: 400 });
    if (!profile?.stripe_account_id) {
      return Response.json({ error: "No Stripe account found for user" }, { status: 400 });
    }

    const acct = await stripe.accounts.retrieve(profile.stripe_account_id);

    const onboardingComplete =
      Boolean(acct.details_submitted) &&
      (acct.charges_enabled || acct.payouts_enabled);

    await supabase
      .from("profiles")
      .update({ stripe_onboarding_complete: onboardingComplete })
      .eq("id", userId);

    return Response.json({
      stripe_account_id: profile.stripe_account_id,
      details_submitted: acct.details_submitted,
      charges_enabled: acct.charges_enabled,
      payouts_enabled: acct.payouts_enabled,
      onboardingComplete,
    });
  } catch (err) {
    return Response.json({ error: err.message || "Server error" }, { status: 500 });
  }
}