"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

function buildReviewStats(reviews) {
  const map = {};

  for (const review of reviews || []) {
    const id = review.reviewee_id;
    if (!id) continue;

    if (!map[id]) {
      map[id] = {
        total: 0,
        count: 0,
      };
    }

    map[id].total += Number(review.rating || 0);
    map[id].count += 1;
  }

  return map;
}

function formatRating(stats) {
  if (!stats || !stats.count) return "No reviews yet";
  return `${(stats.total / stats.count).toFixed(1)} ★ (${stats.count})`;
}

function Avatar({ profile, fallback, size = "h-12 w-12" }) {
  const safeFallback =
    typeof fallback === "string" && fallback.trim() !== ""
      ? fallback.trim()
      : "U";

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={safeFallback}
        className={`${size} rounded-full border border-stone-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} flex items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-sm font-bold text-emerald-900`}
    >
      {safeFallback.slice(0, 1).toUpperCase()}
    </div>
  );
}

function buildCareTags(request) {
  const tags = [];

  if (request.visit_frequency === "daily") tags.push("Daily visits");
  if (request.visit_frequency === "every_2_days") tags.push("Every 2 days");
  if (request.visit_frequency === "custom") tags.push("Custom visits");

  if (request.need_watering) tags.push("Watering");
  if (request.need_harvesting) tags.push("Harvesting");
  if (request.has_greenhouse) tags.push("Greenhouse");
  if (request.has_veg_beds) tags.push("Veg beds");
  if (request.has_pots) tags.push("Pots");
  if (request.has_seedlings) tags.push("Seedlings");

  return tags.slice(0, 4);
}

function formatShortDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function formatDateRange(start, end) {
  if (!start && !end) return "No dates";
  if (!start) return formatShortDate(end);
  if (!end) return formatShortDate(start);

  return `${formatShortDate(start)} → ${formatShortDate(end)}`;
}

function formatPrice(value) {
  if (value == null) return null;
  const number = Number(value);

  if (!Number.isFinite(number)) return null;

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function getStatusBadgeClass(status) {
  if (status === "open") {
    return "bg-emerald-50 text-emerald-800 border-emerald-100";
  }

  if (status === "accepted") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }

  if (status === "completed") {
    return "bg-stone-100 text-stone-700 border-stone-200";
  }

  if (status === "closed") {
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }

  return "bg-stone-100 text-stone-700 border-stone-200";
}

function getStatusLabel(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const primaryButtonClass =
  "wmp-button wmp-button-primary inline-flex justify-center";
const secondaryButtonClass =
  "wmp-button wmp-button-secondary inline-flex justify-center";

function friendlyError(message) {
  const text = String(message || "");
  const lower = text.toLowerCase();

  if (
    lower.includes("failed to fetch") ||
    lower.includes("typeerror") ||
    lower.includes("network")
  ) {
    return "We couldn't load this just now. Please refresh or try again in a moment.";
  }

  return text || "We couldn't load this just now. Please refresh or try again in a moment.";
}

export default function RequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [reviewStatsByUserId, setReviewStatsByUserId] = useState({});
  const [unreadByRequestId, setUnreadByRequestId] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  const [postcodeQuery, setPostcodeQuery] = useState("");
  const [visitFrequencyFilter, setVisitFrequencyFilter] = useState("any");
  const [onlyWatering, setOnlyWatering] = useState(false);
  const [onlyHarvesting, setOnlyHarvesting] = useState(false);
  const [onlyGreenhouse, setOnlyGreenhouse] = useState(false);
  const [onlyVegBeds, setOnlyVegBeds] = useState(false);
  const [onlyPots, setOnlyPots] = useState(false);
  const [onlySeedlings, setOnlySeedlings] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postcode = params.get("postcode");

    if (postcode) {
      setPostcodeQuery(postcode);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg("");

      const { data: userData } = await supabase.auth.getUser();
      const currentUser = userData?.user || null;

      const { data, error } = await supabase
        .from("care_requests")
        .select(
          "id, owner_id, title, postcode, start_date, end_date, price_offered_gbp, status, created_at, visit_frequency, need_watering, need_harvesting, has_greenhouse, has_veg_beds, has_pots, has_seedlings"
        )
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMsg(error.message);
        setRequests([]);
        setProfilesById({});
        setReviewStatsByUserId({});
        setUnreadByRequestId({});
        setLoading(false);
        return;
      }

      const safeRequests = data ?? [];
      setRequests(safeRequests);

      const ownerIds = [
        ...new Set(safeRequests.map((r) => r.owner_id).filter(Boolean)),
      ];

      if (ownerIds.length > 0) {
        const { data: profileRows, error: profileErr } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, location")
          .in("id", ownerIds);

        if (profileErr) {
          setErrorMsg(profileErr.message);
        } else {
          const profileMap = {};

          for (const row of profileRows || []) {
            profileMap[row.id] = row;
          }

          setProfilesById(profileMap);
        }

        const { data: reviewRows, error: reviewErr } = await supabase
          .from("reviews")
          .select("reviewee_id, rating")
          .in("reviewee_id", ownerIds);

        if (reviewErr) {
          setErrorMsg(reviewErr.message);
        } else {
          setReviewStatsByUserId(buildReviewStats(reviewRows || []));
        }
      } else {
        setProfilesById({});
        setReviewStatsByUserId({});
      }

      if (currentUser) {
        const { data: unreadRows, error: unreadErr } = await supabase.rpc(
          "get_my_unread_request_counts"
        );

        if (unreadErr) {
          setErrorMsg(unreadErr.message);
          setUnreadByRequestId({});
        } else {
          const unreadMap = {};

          for (const row of unreadRows || []) {
            unreadMap[row.request_id] = Number(row.unread_count || 0);
          }

          setUnreadByRequestId(unreadMap);
        }
      } else {
        setUnreadByRequestId({});
      }

      setLoading(false);
    }

    load();
  }, []);

  const requestCards = useMemo(() => {
    return requests.map((request) => {
      const ownerProfile = profilesById[request.owner_id];
      const ownerName = ownerProfile?.full_name?.trim() || "Owner";
      const ownerRating = formatRating(reviewStatsByUserId[request.owner_id]);
      const unreadCount = unreadByRequestId[request.id] || 0;
      const careTags = buildCareTags(request);
      const formattedDateRange = formatDateRange(
        request.start_date,
        request.end_date
      );
      const formattedPrice = formatPrice(request.price_offered_gbp);
      const statusLabel = getStatusLabel(request.status);
      const statusBadgeClass = getStatusBadgeClass(request.status);

      return {
        ...request,
        ownerProfile,
        ownerName,
        ownerRating,
        unreadCount,
        careTags,
        formattedDateRange,
        formattedPrice,
        statusLabel,
        statusBadgeClass,
      };
    });
  }, [profilesById, requests, reviewStatsByUserId, unreadByRequestId]);

  const filteredRequestCards = useMemo(() => {
    const filtered = requestCards.filter((request) => {
      const postcodeText = (request.postcode || "").toLowerCase();
      const postcodeNeedle = postcodeQuery.trim().toLowerCase();

      if (postcodeNeedle && !postcodeText.includes(postcodeNeedle)) {
        return false;
      }

      if (
        visitFrequencyFilter !== "any" &&
        request.visit_frequency !== visitFrequencyFilter
      ) {
        return false;
      }

      if (onlyWatering && !request.need_watering) return false;
      if (onlyHarvesting && !request.need_harvesting) return false;
      if (onlyGreenhouse && !request.has_greenhouse) return false;
      if (onlyVegBeds && !request.has_veg_beds) return false;
      if (onlyPots && !request.has_pots) return false;
      if (onlySeedlings && !request.has_seedlings) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at) - new Date(b.created_at);
      }

      if (sortBy === "soonest_start") {
        return new Date(a.start_date) - new Date(b.start_date);
      }

      if (sortBy === "lowest_price") {
        const aPrice = a.price_offered_gbp ?? Number.POSITIVE_INFINITY;
        const bPrice = b.price_offered_gbp ?? Number.POSITIVE_INFINITY;
        return aPrice - bPrice;
      }

      if (sortBy === "highest_price") {
        const aPrice = a.price_offered_gbp ?? Number.NEGATIVE_INFINITY;
        const bPrice = b.price_offered_gbp ?? Number.NEGATIVE_INFINITY;
        return bPrice - aPrice;
      }

      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [
    requestCards,
    postcodeQuery,
    visitFrequencyFilter,
    onlyWatering,
    onlyHarvesting,
    onlyGreenhouse,
    onlyVegBeds,
    onlyPots,
    onlySeedlings,
    sortBy,
  ]);

  const hasActiveFilters =
    postcodeQuery.trim() !== "" ||
    visitFrequencyFilter !== "any" ||
    onlyWatering ||
    onlyHarvesting ||
    onlyGreenhouse ||
    onlyVegBeds ||
    onlyPots ||
    onlySeedlings ||
    sortBy !== "newest";

  function clearFilters() {
    setPostcodeQuery("");
    setVisitFrequencyFilter("any");
    setOnlyWatering(false);
    setOnlyHarvesting(false);
    setOnlyGreenhouse(false);
    setOnlyVegBeds(false);
    setOnlyPots(false);
    setOnlySeedlings(false);
    setSortBy("newest");
  }

  const fieldClass = "mt-1 wmp-field rounded-lg";

  return (
    <main className="wmp-page">
      <div className="wmp-shell wmp-stack">
        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
            <div>
              <p className="wmp-eyebrow">
                Browse jobs
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Find local plot care jobs from growers who need help.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Browse live requests before signing up. Filter by area, visit
                pattern, and practical growing tasks like watering, harvesting,
                seedlings, greenhouse care, pots, and veg beds.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-[#f4f8ef] p-4 shadow-sm">
              <p className="text-sm font-bold text-zinc-900">
                Need someone to watch your plot?
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Post a request with dates, budget, and the exact care your
                plants need.
              </p>

              <Link
                href="/requests/new"
                className="mt-4 wmp-button wmp-button-clay w-full"
              >
                Post a request
              </Link>
            </div>
          </div>
        </section>

        <section className="wmp-panel space-y-4 rounded-lg">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-zinc-700">
                Postcode / area
              </label>

              <input
                className={fieldClass}
                value={postcodeQuery}
                onChange={(e) => setPostcodeQuery(e.target.value)}
                placeholder="e.g. N13"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">
                Visit frequency
              </label>

              <select
                className={fieldClass}
                value={visitFrequencyFilter}
                onChange={(e) => setVisitFrequencyFilter(e.target.value)}
              >
                <option value="any">Any</option>
                <option value="daily">Once a day</option>
                <option value="every_2_days">Every 2 days</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-700">
                Sort by
              </label>

              <select
                className={fieldClass}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="soonest_start">Soonest start date</option>
                <option value="lowest_price">Lowest price</option>
                <option value="highest_price">Highest price</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-zinc-700">
                Only show requests with:
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-medium text-emerald-900 underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={onlyWatering}
                  onChange={(e) => setOnlyWatering(e.target.checked)}
                  className="accent-emerald-900"
                />
                Watering
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={onlyHarvesting}
                  onChange={(e) => setOnlyHarvesting(e.target.checked)}
                  className="accent-emerald-900"
                />
                Harvesting
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={onlyGreenhouse}
                  onChange={(e) => setOnlyGreenhouse(e.target.checked)}
                  className="accent-emerald-900"
                />
                Greenhouse
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={onlyVegBeds}
                  onChange={(e) => setOnlyVegBeds(e.target.checked)}
                  className="accent-emerald-900"
                />
                Veg beds
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={onlyPots}
                  onChange={(e) => setOnlyPots(e.target.checked)}
                  className="accent-emerald-900"
                />
                Pots / containers
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={onlySeedlings}
                  onChange={(e) => setOnlySeedlings(e.target.checked)}
                  className="accent-emerald-900"
                />
                Seedlings / young plants
              </label>
            </div>
          </div>
        </section>

        {loading && (
          <div className="wmp-card rounded-lg text-sm text-zinc-600">
            Loading requests...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-sm leading-6 text-red-800 shadow-sm">
            <p className="font-medium">We could not load garden jobs.</p>
            <p className="mt-1">{friendlyError(errorMsg)}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 wmp-button border border-red-200 bg-white text-red-800 hover:bg-red-50"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !errorMsg && (
          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="wmp-eyebrow">
                  Live requests
                </p>

                <h2 className="mt-1 text-2xl font-bold text-zinc-900">
                  Plot care opportunities
                </h2>
              </div>

              <p className="text-sm text-zinc-500">
                Showing {filteredRequestCards.length} of {requestCards.length}{" "}
                request{requestCards.length === 1 ? "" : "s"}
              </p>
            </div>

            {filteredRequestCards.length === 0 ? (
              <div className="wmp-card rounded-lg">
                <p className="font-medium text-zinc-900">
                  {hasActiveFilters
                    ? "No requests match your current filters."
                    : "No garden jobs available right now"}
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {hasActiveFilters
                    ? "Try clearing one or two filters to see more plot care requests."
                    : "Check back soon or complete your profile so you're ready to offer."}
                </p>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className={`mt-4 w-full sm:w-auto ${secondaryButtonClass}`}
                  >
                    Clear filters
                  </button>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link href="/profile" className={`w-full sm:w-auto ${primaryButtonClass}`}>
                      Complete profile
                    </Link>
                    <Link
                      href="/requests/new"
                      className={`w-full sm:w-auto ${secondaryButtonClass}`}
                    >
                      Post a request
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              filteredRequestCards.map((r) => (
                <Link
                  key={r.id}
                  href={`/requests/${r.id}`}
                  className="wmp-card-link rounded-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar profile={r.ownerProfile} fallback={r.ownerName} />

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-bold">{r.title}</h2>

                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${r.statusBadgeClass}`}
                          >
                            {r.statusLabel}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                          <p>Owner: {r.ownerName}</p>
                          <p>Trust: {r.ownerRating}</p>
                        </div>

                        <p className="mt-2 text-sm text-zinc-600">
                          {r.postcode || "No postcode"} •{" "}
                          {r.formattedDateRange}
                        </p>

                        {r.formattedPrice && (
                          <p className="mt-1 text-sm font-medium text-emerald-900">
                            Offered: {r.formattedPrice}
                          </p>
                        )}

                        {r.careTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.careTags.map((tag) => (
                              <span
                                key={tag}
                                className="wmp-chip"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {r.unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-emerald-900 px-3 py-1 text-xs font-medium text-white">
                        {r.unreadCount} unread
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </section>
        )}
      </div>
    </main>
  );
}
