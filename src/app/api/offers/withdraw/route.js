import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function supabaseFromToken(token) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function POST(request) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ) {
      return Response.json(
        { error: "Server is missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return Response.json({ error: "Missing token" }, { status: 401 });
    }

    const supabase = supabaseFromToken(token);

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;

    const body = await request.json().catch(() => ({}));
    const offerId = typeof body.offerId === "string" ? body.offerId.trim() : "";

    if (!offerId) {
      return Response.json({ error: "Missing offerId" }, { status: 400 });
    }

    const { data: offer, error: offerErr } = await supabase
      .from("offers")
      .select("id, gardener_id, status")
      .eq("id", offerId)
      .maybeSingle();

    if (offerErr || !offer) {
      return Response.json(
        { error: offerErr?.message || "Offer not found" },
        { status: 400 }
      );
    }

    if (offer.gardener_id !== userId) {
      return Response.json(
        { error: "Only the gardener can withdraw this offer" },
        { status: 403 }
      );
    }

    if (offer.status !== "pending") {
      return Response.json(
        { error: "Only pending offers can be withdrawn" },
        { status: 400 }
      );
    }

    const { data: deletedRow, error: deleteErr } = await supabase
      .from("offers")
      .delete()
      .eq("id", offerId)
      .eq("gardener_id", userId)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (deleteErr) {
      return Response.json(
        { error: deleteErr.message || "Failed to withdraw offer" },
        { status: 400 }
      );
    }

    if (!deletedRow) {
      return Response.json(
        { error: "This offer could not be withdrawn. It may no longer be pending." },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, offerId });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}