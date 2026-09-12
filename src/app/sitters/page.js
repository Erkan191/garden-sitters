"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const skillFilters = [
  { key: "watering", label: "Watering" },
  { key: "harvesting", label: "Harvesting" },
  { key: "greenhouse", label: "Greenhouse" },
  { key: "veg beds", label: "Veg beds" },
  { key: "pots", label: "Pots / containers" },
  { key: "seedlings", label: "Seedlings" },
];

function normaliseSkill(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
}

function buildSkillTags(profile) {
  if (!profile) return [];

  const tags = [];

  if (profile.skill_watering) tags.push("Watering");
  if (profile.skill_harvesting) tags.push("Harvesting");
  if (profile.skill_greenhouse) tags.push("Greenhouse");
  if (profile.skill_veg_beds) tags.push("Veg beds");
  if (profile.skill_pots) tags.push("Pots / containers");
  if (profile.skill_seedlings) tags.push("Seedlings");

  for (const skill of profile.skills || []) {
    const normalised = normaliseSkill(skill);
    if (!normalised) continue;

    const label =
      normalised === "veg beds"
        ? "Veg beds"
        : normalised === "pots"
          ? "Pots / containers"
          : normalised === "seedlings"
            ? "Seedlings"
            : normalised.charAt(0).toUpperCase() + normalised.slice(1);

    if (!tags.some((tag) => normaliseSkill(tag) === normaliseSkill(label))) {
      tags.push(label);
    }
  }

  return tags;
}

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
  return `${(stats.total / stats.count).toFixed(1)} stars (${stats.count})`;
}

function averageRating(stats) {
  if (!stats || !stats.count) return 0;
  return stats.total / stats.count;
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

function Avatar({ profile, fallback }) {
  const safeFallback =
    typeof fallback === "string" && fallback.trim() !== ""
      ? fallback.trim()
      : "Garden sitter";

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={safeFallback}
        className="h-16 w-16 rounded-full border border-stone-200 object-cover"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-xl font-bold text-emerald-900">
      {safeFallback.slice(0, 1).toUpperCase()}
    </div>
  );
}

function hasGardenerSignal(profile) {
  const role = profile?.role;
  const tags = buildSkillTags(profile);

  return (
    role === "gardener" ||
    role === "both" ||
    Boolean(profile?.stripe_onboarding_complete) ||
    Boolean(profile?.stripe_account_id) ||
    Boolean(profile?.price_per_visit_gbp) ||
    Boolean(profile?.experience_level) ||
    tags.length > 0
  );
}

export default function SittersPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [reviewStatsByUserId, setReviewStatsByUserId] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  const [areaQuery, setAreaQuery] = useState("");
  const [activeSkills, setActiveSkills] = useState([]);
  const [sortBy, setSortBy] = useState("best_reviewed");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const area = params.get("area") || params.get("postcode");

    if (area) {
      setAreaQuery(area);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg("");

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, role, display_name, full_name, location, postcode, bio, avatar_url, skills, experience_level, price_per_visit_gbp, stripe_account_id, stripe_onboarding_complete, created_at, updated_at, skill_watering, skill_harvesting, skill_greenhouse, skill_veg_beds, skill_pots, skill_seedlings"
        )
        .order("updated_at", { ascending: false });

      if (error) {
        setErrorMsg(error.message);
        setProfiles([]);
        setReviewStatsByUserId({});
        setLoading(false);
        return;
      }

      const sitterProfiles = (data || []).filter(hasGardenerSignal);
      setProfiles(sitterProfiles);

      const sitterIds = sitterProfiles.map((profile) => profile.id).filter(Boolean);

      if (sitterIds.length > 0) {
        const { data: reviewRows, error: reviewErr } = await supabase
          .from("reviews")
          .select("reviewee_id, rating")
          .in("reviewee_id", sitterIds);

        if (reviewErr) {
          setErrorMsg(reviewErr.message);
          setReviewStatsByUserId({});
        } else {
          setReviewStatsByUserId(buildReviewStats(reviewRows || []));
        }
      } else {
        setReviewStatsByUserId({});
      }

      setLoading(false);
    }

    load();
  }, []);

  const sitterCards = useMemo(() => {
    return profiles.map((profile) => {
      const displayName =
        profile.full_name?.trim() ||
        profile.display_name?.trim() ||
        "Garden sitter";
      const location =
        profile.location?.trim() ||
        profile.postcode?.trim() ||
        "Area not listed";
      const skillTags = buildSkillTags(profile);
      const stats = reviewStatsByUserId[profile.id];
      const price = formatPrice(profile.price_per_visit_gbp);

      return {
        ...profile,
        displayName,
        location,
        skillTags,
        ratingLabel: formatRating(stats),
        ratingValue: averageRating(stats),
        reviewCount: stats?.count || 0,
        priceLabel: price ? `From ${price} per visit` : "Rate not listed yet",
        hasPayouts: Boolean(profile.stripe_onboarding_complete),
      };
    });
  }, [profiles, reviewStatsByUserId]);

  const filteredSitterCards = useMemo(() => {
    const areaNeedle = areaQuery.trim().toLowerCase();

    const filtered = sitterCards.filter((sitter) => {
      const haystack = `${sitter.location || ""} ${sitter.postcode || ""}`.toLowerCase();

      if (areaNeedle && !haystack.includes(areaNeedle)) {
        return false;
      }

      if (activeSkills.length > 0) {
        const sitterSkills = sitter.skillTags.map(normaliseSkill);

        const hasEverySkill = activeSkills.every((skill) =>
          sitterSkills.some((tag) => tag.includes(skill))
        );

        if (!hasEverySkill) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }

      if (sortBy === "lowest_price") {
        const aPrice = a.price_per_visit_gbp ?? Number.POSITIVE_INFINITY;
        const bPrice = b.price_per_visit_gbp ?? Number.POSITIVE_INFINITY;
        return aPrice - bPrice;
      }

      if (sortBy === "payouts_ready") {
        return Number(b.hasPayouts) - Number(a.hasPayouts);
      }

      if (b.ratingValue !== a.ratingValue) {
        return b.ratingValue - a.ratingValue;
      }

      return b.reviewCount - a.reviewCount;
    });
  }, [activeSkills, areaQuery, sitterCards, sortBy]);

  const hasActiveFilters =
    areaQuery.trim() !== "" || activeSkills.length > 0 || sortBy !== "best_reviewed";

  function toggleSkill(skill) {
    setActiveSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
    );
  }

  function clearFilters() {
    setAreaQuery("");
    setActiveSkills([]);
    setSortBy("best_reviewed");
  }

  return (
    <main className="wmp-page">
      <div className="wmp-shell wmp-stack">
        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <p className="wmp-eyebrow">Find sitters</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Browse local garden sitters before you post.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Look through public gardener profiles, skills, reviews, and broad
                areas first. When you find the right kind of help, post a request
                with the dates, jobs, and budget.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/requests/new" className="wmp-button wmp-button-clay">
                  Post a request
                </Link>
                <Link href="/requests" className="wmp-button wmp-button-secondary">
                  Browse paid jobs
                </Link>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-[#f4f8ef] p-4 shadow-sm">
              <p className="text-sm font-bold text-zinc-900">
                Want to be listed here?
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Create a gardener profile with your broad area, skills, bio, and
                Stripe payout setup.
              </p>
              <Link
                href="/signup?intent=gardener"
                className="mt-4 wmp-button wmp-button-secondary w-full"
              >
                Become a gardener
              </Link>
            </div>
          </div>
        </section>

        <section className="wmp-panel space-y-4 rounded-lg">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_0.75fr]">
            <div>
              <label className="wmp-label">Postcode / area</label>
              <input
                className="mt-1 wmp-field rounded-lg"
                value={areaQuery}
                onChange={(e) => setAreaQuery(e.target.value)}
                placeholder="e.g. N13, Enfield, Palmers Green"
              />
            </div>

            <div>
              <label className="wmp-label">Sort by</label>
              <select
                className="mt-1 wmp-field rounded-lg"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="best_reviewed">Best reviewed</option>
                <option value="newest">Newest profiles</option>
                <option value="lowest_price">Lowest listed rate</option>
                <option value="payouts_ready">Payouts connected</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-bold text-zinc-700">
                Care skills
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-bold text-emerald-900 underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {skillFilters.map((skill) => {
                const active = activeSkills.includes(skill.key);

                return (
                  <button
                    key={skill.key}
                    type="button"
                    onClick={() => toggleSkill(skill.key)}
                    className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
                      active
                        ? "border-emerald-950 bg-emerald-950 text-white"
                        : "border-stone-200 bg-white text-zinc-700 hover:border-emerald-900/30 hover:bg-emerald-50"
                    }`}
                  >
                    {skill.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {loading && (
          <div className="wmp-card rounded-lg text-sm text-zinc-600">
            Loading garden sitters...
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-sm leading-6 text-red-800 shadow-sm">
            <p className="font-bold">We could not load garden sitters.</p>
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
                <p className="wmp-eyebrow">Public profiles</p>
                <h2 className="mt-1 text-2xl font-bold text-zinc-900">
                  Garden sitters near you
                </h2>
              </div>

              <p className="text-sm text-zinc-500">
                Showing {filteredSitterCards.length} of {sitterCards.length}{" "}
                sitter{sitterCards.length === 1 ? "" : "s"}
              </p>
            </div>

            {filteredSitterCards.length === 0 ? (
              <div className="wmp-card rounded-lg">
                <p className="font-bold text-zinc-900">
                  {hasActiveFilters
                    ? "No sitters match those filters yet."
                    : "No public garden sitter profiles yet."}
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {hasActiveFilters
                    ? "Try widening the area or clearing one skill filter."
                    : "Post a request so local gardeners can offer, or create the first public gardener profile."}
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="wmp-button wmp-button-secondary"
                    >
                      Clear filters
                    </button>
                  ) : (
                    <>
                      <Link href="/requests/new" className="wmp-button wmp-button-clay">
                        Post a request
                      </Link>
                      <Link
                        href="/signup?intent=gardener"
                        className="wmp-button wmp-button-secondary"
                      >
                        Become a gardener
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredSitterCards.map((sitter) => (
                  <Link
                    key={sitter.id}
                    href={`/users/${sitter.id}`}
                    className="wmp-card-link rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar profile={sitter} fallback={sitter.displayName} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-bold text-zinc-950">
                              {sitter.displayName}
                            </h3>
                            <p className="mt-1 text-sm text-zinc-600">
                              {sitter.location}
                            </p>
                          </div>

                          {sitter.hasPayouts && (
                            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                              Payouts ready
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                          <p>
                            <span className="font-bold text-zinc-900">Trust:</span>{" "}
                            {sitter.ratingLabel}
                          </p>
                          <p>
                            <span className="font-bold text-zinc-900">Rate:</span>{" "}
                            {sitter.priceLabel}
                          </p>
                        </div>

                        {sitter.bio && (
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">
                            {sitter.bio}
                          </p>
                        )}

                        {sitter.skillTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {sitter.skillTags.slice(0, 5).map((tag) => (
                              <span key={tag} className="wmp-chip">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <span className="mt-4 inline-flex text-sm font-bold text-emerald-900">
                          View profile
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
