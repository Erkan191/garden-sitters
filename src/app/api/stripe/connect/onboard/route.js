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

    // Validate token
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;

    // Read existing stripe_account_id
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .maybeSingle();

    if (profileErr) return Response.json({ error: profileErr.message }, { status: 400 });

    let stripeAccountId = profile?.stripe_account_id;

    // Create Express connected account if needed
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "GB",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      const { error: upErr } = await supabase
        .from("profiles")
          .upsert({ id: userId, stripe_account_id: stripeAccountId }, { onConflict: "id" });

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
    // Ask Stripe which platform account this key belongs to
    const platform = await stripe.accounts.retrieve();

    return Response.json(
      {
        error: err.message || "Server error",
        platformAccountId: platform.id,
        livemode: platform.livemode,
        keyPrefix: (process.env.STRIPE_SECRET_KEY || "").slice(0, 8), // e.g. "sk_test_"
      },
      { status: 500 }
    );
  } catch (e2) {
    return Response.json(
      { error: err.message || "Server error (and failed to retrieve platform account)" },
      { status: 500 }
    );
  }
}
}