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
    const requestId =
      typeof body.requestId === "string" ? body.requestId.trim() : "";

    if (!requestId) {
      return Response.json({ error: "Missing requestId" }, { status: 400 });
    }

    const { data: reqRow, error: reqErr } = await supabase
      .from("care_requests")
      .select("id, owner_id, status")
      .eq("id", requestId)
      .maybeSingle();

    if (reqErr || !reqRow) {
      return Response.json(
        { error: reqErr?.message || "Request not found" },
        { status: 400 }
      );
    }

    if (reqRow.owner_id !== userId) {
      return Response.json(
        { error: "Only the owner can reopen this request" },
        { status: 403 }
      );
    }

    if (reqRow.status !== "closed") {
      return Response.json(
        { error: "Only closed requests can be reopened" },
        { status: 400 }
      );
    }

    const { data: updatedRow, error: updateErr } = await supabase
      .from("care_requests")
      .update({ status: "open" })
      .eq("id", requestId)
      .eq("owner_id", userId)
      .eq("status", "closed")
      .select("id")
      .maybeSingle();

    if (updateErr) {
      return Response.json(
        { error: updateErr.message || "Failed to reopen request" },
        { status: 400 }
      );
    }

    if (!updatedRow) {
      return Response.json(
        { error: "This request could not be reopened. It may no longer be closed." },
        { status: 400 }
      );
    }

    return Response.json({ ok: true, requestId });
  } catch (err) {
    return Response.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}