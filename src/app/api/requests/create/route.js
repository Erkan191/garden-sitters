import { formatMoney, getMarket } from "@/lib/marketConfig";
import { sendAdminAlert } from "@/lib/adminAlerts";
import { createAuthenticatedServerClient } from "@/lib/supabaseServer";
import { normalisePublicArea } from "@/lib/publicArea";

export const runtime = "nodejs";

const MAX_PRICE = 999999.99;
const MIN_PAID_BOOKING = 5;
const VISIT_FREQUENCIES = new Set(["daily", "every_2_days", "custom"]);

function requiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value) {
  const text = requiredString(value);
  return text || null;
}

function tokenFrom(request) {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

export async function POST(request) {
  try {
    const token = tokenFrom(request);
    if (!token) {
      return Response.json({ error: "Missing token" }, { status: 401 });
    }

    const supabase = createAuthenticatedServerClient(token);
    if (!supabase) {
      return Response.json(
        { error: "Server is missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const title = requiredString(body.title);
    const startDate = requiredString(body.startDate);
    const endDate = requiredString(body.endDate);
    const invitedGardenerId = optionalString(body.invitedGardenerId);

    if (!title) {
      return Response.json({ error: "Please add a title for your request." }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return Response.json({ error: "Please add the start and end dates." }, { status: 400 });
    }
    if (endDate < startDate) {
      return Response.json({ error: "End date cannot be before start date." }, { status: 400 });
    }
    if (invitedGardenerId === user.id) {
      return Response.json(
        { error: "You cannot ask yourself to help with a request." },
        { status: 400 }
      );
    }

    const { data: ownerProfile, error: ownerProfileError } = await supabase
      .from("profiles")
      .select("full_name, location, country, currency, age_confirmed_at")
      .eq("id", user.id)
      .maybeSingle();

    if (ownerProfileError || !ownerProfile) {
      return Response.json(
        { error: "Complete your profile and choose your country before posting a request." },
        { status: 400 }
      );
    }

    if (!ownerProfile.age_confirmed_at) {
      return Response.json(
        { error: "Confirm that you are 18 or over in your profile before posting a request." },
        { status: 403 }
      );
    }

    if (invitedGardenerId) {
      const { data: gardener, error: gardenerError } = await supabase
        .from("profiles")
        .select("id, country")
        .eq("id", invitedGardenerId)
        .maybeSingle();

      if (gardenerError || !gardener) {
        return Response.json(
          { error: "That gardener profile is no longer available." },
          { status: 400 }
        );
      }
      if (gardener.country !== ownerProfile.country) {
        return Response.json(
          { error: "Direct requests can only be sent to gardeners in your country." },
          { status: 400 }
        );
      }
    }

    const parsedPrice = body.price === "" || body.price === null ? null : Number(body.price);
    if (
      parsedPrice !== null &&
      (!Number.isFinite(parsedPrice) ||
        parsedPrice < MIN_PAID_BOOKING ||
        parsedPrice > MAX_PRICE ||
        Math.round(parsedPrice * 100) !== parsedPrice * 100)
    ) {
      return Response.json(
        {
          error: `Price must be between ${formatMoney(MIN_PAID_BOOKING, ownerProfile.currency)} and ${formatMoney(MAX_PRICE, ownerProfile.currency)}, with no more than 2 decimal places.`,
        },
        { status: 400 }
      );
    }

    const visitFrequency = VISIT_FREQUENCIES.has(body.visitFrequency)
      ? body.visitFrequency
      : "daily";
    const record = {
      owner_id: user.id,
      title,
      details: optionalString(body.details),
      postcode: normalisePublicArea(ownerProfile.country, body.postcode),
      start_date: startDate,
      end_date: endDate,
      price_offered: parsedPrice,
      country: ownerProfile.country,
      currency: ownerProfile.currency,
      visit_frequency: visitFrequency,
      need_watering: Boolean(body.needWatering),
      need_harvesting: Boolean(body.needHarvesting),
      has_greenhouse: Boolean(body.hasGreenhouse),
      has_veg_beds: Boolean(body.hasVegBeds),
      has_pots: Boolean(body.hasPots),
      has_seedlings: Boolean(body.hasSeedlings),
      invited_gardener_id: invitedGardenerId,
      invitation_status: invitedGardenerId ? "pending" : null,
    };

    const { data: createdRequest, error: insertError } = await supabase
      .from("care_requests")
      .insert(record)
      .select("id, created_at")
      .single();

    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 400 });
    }

    try {
      const market = getMarket(ownerProfile.country);
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.watchmyplot.com").replace(/\/$/, "");
      const careNeeded = [
        record.need_watering && "Watering",
        record.need_harvesting && "Harvesting",
        record.has_greenhouse && "Greenhouse",
        record.has_veg_beds && "Veg beds",
        record.has_pots && "Pots / containers",
        record.has_seedlings && "Seedlings / young plants",
      ].filter(Boolean);

      await sendAdminAlert({
        subject: `New job posted — ${title}`,
        heading: invitedGardenerId
          ? "A new direct job request was posted"
          : "A new job was posted to Watch My Plot",
        idempotencyKey: `job-posted/${createdRequest.id}`,
        fields: [
          { label: "Title", value: title },
          { label: "Owner", value: ownerProfile.full_name || user.email },
          { label: "Owner email", value: user.email },
          { label: "Country", value: market.fullLabel },
          { label: "Area", value: record.postcode || ownerProfile.location },
          { label: "Dates", value: `${startDate} to ${endDate}` },
          {
            label: "Budget",
            value:
              parsedPrice === null
                ? "Not specified"
                : formatMoney(parsedPrice, ownerProfile.currency),
          },
          { label: "Visit frequency", value: visitFrequency.replaceAll("_", " ") },
          { label: "Care needed", value: careNeeded.join(", ") || "See details" },
          { label: "Direct request", value: invitedGardenerId ? "Yes" : "No" },
          { label: "View job", value: `${siteUrl}/requests/${createdRequest.id}` },
          { label: "Posted", value: createdRequest.created_at },
        ],
      });
    } catch (alertError) {
      console.error("Job posted alert failed", alertError);
    }

    return Response.json({ ok: true, requestId: createdRequest.id });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Server error" },
      { status: 500 }
    );
  }
}
