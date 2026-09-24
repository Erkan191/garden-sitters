import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { isDirectChargeConfiguration } from "@/lib/stripeConnect";

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
  let stripe;

  try {
    stripe = getStripe();
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

    // Validate token
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

    // Keep legacy accounts for historical bookings, but never use them for new
    // direct-charge bookings because their fee payer is immutable.
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, stripe_legacy_account_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr) return Response.json({ error: profileErr.message }, { status: 400 });

    let stripeAccountId = profile?.stripe_account_id;
    let existingAccount = null;

    if (stripeAccountId) {
      existingAccount = await stripe.accounts.retrieve(stripeAccountId);
    }

    if (!existingAccount || !isDirectChargeConfiguration(existingAccount)) {
      const legacyAccountId = stripeAccountId || profile?.stripe_legacy_account_id || null;
      const account = await stripe.accounts.create({
        country: "GB",
        email: userData.user.email || undefined,
        controller: {
          fees: { payer: "account" },
          losses: { payments: "stripe" },
          requirement_collection: "stripe",
          stripe_dashboard: { type: "full" },
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          watch_my_plot_user_id: userId,
          ...(legacyAccountId
            ? { migrated_from_account_id: legacyAccountId }
            : {}),
        },
      });

      stripeAccountId = account.id;

      const { error: upErr } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            stripe_account_id: stripeAccountId,
            stripe_legacy_account_id: legacyAccountId,
            stripe_onboarding_complete: false,
            stripe_direct_charges_ready: false,
          },
          { onConflict: "id" }
        );

      if (upErr) return Response.json({ error: upErr.message }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    // Single-use onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${siteUrl}/profile?stripe=refresh`,
      return_url: `${siteUrl}/profile?stripe=return`,
      type: "account_onboarding",
    });

    return Response.json({ url: accountLink.url });
  } catch (err) {
    try {
      if (!stripe) throw new Error("Stripe client unavailable");

      // Ask Stripe which platform account this key belongs to.
      const platform = await stripe.accounts.retrieve();

      return Response.json(
        {
          error: err.message || "Server error",
          platformAccountId: platform.id,
          livemode: platform.livemode,
        },
        { status: 500 }
      );
    } catch {
      return Response.json(
        { error: err.message || "Server error (and failed to retrieve platform account)" },
        { status: 500 }
      );
    }
  }
}
