import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

function supabaseFromToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  );
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return null;

  return new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
  });
}

export async function POST(request) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return Response.json(
        { error: "Server is missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return Response.json({ error: "Missing token" }, { status: 401 });

    const supabase = supabaseFromToken(token);

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;
    const supabaseAdmin = createSupabaseAdminClient();
    if (!supabaseAdmin) {
      return Response.json(
        { error: "Server is missing Supabase admin environment variables" },
        { status: 500 }
      );
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
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

    const { error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update({ stripe_onboarding_complete: onboardingComplete })
      .eq("id", userId);

    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 400 });
    }

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
