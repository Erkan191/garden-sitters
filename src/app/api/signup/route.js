import { sendAdminAlert } from "@/lib/adminAlerts";
import { createPublicServerClient } from "@/lib/supabaseServer";
import { getMarket, MARKETS } from "@/lib/marketConfig";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const supabase = createPublicServerClient();
    if (!supabase) {
      return Response.json(
        { error: "Server is missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const intent = body.intent === "gardener" ? "gardener" : "owner";
    const country =
      typeof body.country === "string" ? body.country.trim().toUpperCase() : "";

    if (!email || !password || password.length < 6) {
      return Response.json(
        { error: "Enter a valid email and a password of at least 6 characters." },
        { status: 400 }
      );
    }

    if (!Object.hasOwn(MARKETS, country)) {
      return Response.json({ error: "Choose a supported country." }, { status: 400 });
    }

    const market = getMarket(country);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          signup_intent: intent,
          country,
          currency: market.currency,
        },
      },
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const isNewUser = (data?.user?.identities?.length || 0) > 0;
    if (intent === "gardener" && data?.user && isNewUser) {
      try {
        await sendAdminAlert({
          subject: `New gardener signup — ${market.fullLabel}`,
          heading: "A new gardener signed up to Watch My Plot",
          idempotencyKey: `gardener-signup/${data.user.id}`,
          fields: [
            { label: "Email", value: data.user.email || email },
            { label: "Country", value: market.fullLabel },
            { label: "Currency", value: market.currency },
            { label: "User ID", value: data.user.id },
            { label: "Signed up", value: data.user.created_at },
          ],
        });
      } catch (alertError) {
        console.error("Gardener signup alert failed", alertError);
      }
    }

    return Response.json({
      ok: true,
      session: data?.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }
        : null,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
