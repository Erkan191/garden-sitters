"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function buildSkillTags(profile) {
  if (!profile) return [];

  const tags = [];

  if (profile.skill_watering) tags.push("Watering");
  if (profile.skill_harvesting) tags.push("Harvesting");
  if (profile.skill_greenhouse) tags.push("Greenhouse");
  if (profile.skill_veg_beds) tags.push("Veg beds");
  if (profile.skill_pots) tags.push("Pots / containers");
  if (profile.skill_seedlings) tags.push("Seedlings / young plants");

  return tags;
}

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewerProfiles, setReviewerProfiles] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMsg("");

            const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user || null;

      setCurrentUserId(user?.id || null);

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          location,
          bio,
          avatar_url,
          skill_watering,
          skill_harvesting,
          skill_greenhouse,
          skill_veg_beds,
          skill_pots,
          skill_seedlings
        `)
        .eq("id", id)
        .maybeSingle();

      if (profileErr) {
        setMsg(profileErr.message);
        setLoading(false);
        return;
      }

      setProfile(profileData || null);

      const { data: reviewData, error: reviewErr } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id")
        .eq("reviewee_id", id)
        .order("created_at", { ascending: false });

      if (reviewErr) {
        setMsg(reviewErr.message);
        setReviews([]);
        setLoading(false);
        return;
      }

      const safeReviews = reviewData ?? [];
      setReviews(safeReviews);

      const reviewerIds = [...new Set(safeReviews.map((r) => r.reviewer_id).filter(Boolean))];

      if (reviewerIds.length > 0) {
        const { data: reviewerData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", reviewerIds);

        const map = {};
        for (const row of reviewerData || []) {
          map[row.id] = row;
        }
        setReviewerProfiles(map);
      } else {
        setReviewerProfiles({});
      }

      setLoading(false);
    }

    if (id) {
      load();
    }
  }, [id, router]);

  const totalReviews = reviews.length;

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const isOwnProfile = currentUserId === id;
  const displayName =
    profile?.full_name?.trim() || (isOwnProfile ? "You" : "User");
  const skillTags = useMemo(() => buildSkillTags(profile), [profile]);

      return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-emerald-900"
        >
          ← Back
        </button>

        {loading && (
          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
            Loading profile...
          </div>
        )}

        {msg && (
          <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-6 text-sm text-red-700">
            {msg}
          </div>
        )}

        {!loading && !profile && (
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="font-medium text-zinc-900">Profile not found.</p>
            <p className="mt-2 text-sm text-zinc-600">
              This user profile may no longer exist or may not be public.
            </p>

            <Link
              href="/requests"
              className="mt-4 inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
            >
              Browse jobs
            </Link>
          </section>
        )}

        {!loading && profile && (
          <>
            <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.35fr] lg:items-start">
                <div>
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="shrink-0">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="h-24 w-24 rounded-full border border-stone-200 bg-stone-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-3xl font-semibold text-emerald-900">
                          {displayName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                        Public profile
                      </p>

                      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                        {isOwnProfile ? "Your profile" : displayName}
                      </h1>

                      {profile.location && (
                        <p className="mt-2 text-sm text-zinc-600">
                          {profile.location}
                        </p>
                      )}

                      {profile.bio ? (
                        <p className="mt-5 max-w-2xl whitespace-pre-wrap rounded-[1.25rem] border border-stone-200 bg-white/75 p-4 text-sm leading-6 text-zinc-700">
                          {profile.bio}
                        </p>
                      ) : (
                        <p className="mt-5 max-w-2xl rounded-[1.25rem] border border-stone-200 bg-white/75 p-4 text-sm leading-6 text-zinc-600">
                          No bio yet.
                        </p>
                      )}

                      {skillTags.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {skillTags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-stone-200 bg-white/80 px-2 py-1 text-xs text-zinc-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {isOwnProfile && (
                        <div className="mt-5">
                          <Link
                            href="/profile"
                            className="inline-flex rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
                          >
                            Edit your profile
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <aside className="rounded-[1.5rem] border border-emerald-100 bg-white/80 p-5 shadow-sm">
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                    Trust summary
                  </p>

                  <div className="mt-4 grid gap-3">
                    <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4">
                      <p className="text-sm text-zinc-500">Average rating</p>
                      <p className="mt-1 text-3xl font-semibold text-zinc-900">
                        {averageRating ? `${averageRating}/5` : "No rating yet"}
                      </p>
                    </div>

                    <div className="rounded-[1.25rem] border border-stone-200 bg-white p-4">
                      <p className="text-sm text-zinc-500">Reviews</p>
                      <p className="mt-1 text-3xl font-semibold text-zinc-900">
                        {totalReviews}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 text-zinc-900 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                    Reviews
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                    What people said
                  </h2>
                </div>

                <p className="text-sm text-zinc-500">
                  {totalReviews} review{totalReviews === 1 ? "" : "s"}
                </p>
              </div>

              {reviews.length === 0 ? (
                <div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
                  <p className="text-sm font-medium text-zinc-900">
                    No reviews yet.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    Reviews from completed bookings will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {reviews.map((review) => {
                    const reviewer = reviewerProfiles[review.reviewer_id];
                    const reviewerName = reviewer?.full_name?.trim() || "User";

                    return (
                      <div
                        key={review.id}
                        className="rounded-[1.5rem] border border-stone-200 bg-stone-50/60 p-5"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-medium text-zinc-900">
                              {review.rating}/5 rating
                            </p>
                            <p className="mt-1 text-sm text-zinc-600">
                              From: {reviewerName}
                            </p>
                          </div>

                          <p className="text-xs text-zinc-500">
                            {new Date(review.created_at).toLocaleString()}
                          </p>
                        </div>

                        {review.comment ? (
                          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-6 text-zinc-700">
                            {review.comment}
                          </p>
                        ) : (
                          <p className="mt-4 rounded-xl bg-white p-4 text-sm italic leading-6 text-zinc-500">
                            No written comment left.
                          </p>
                        )}

                        <p className="mt-3 text-xs font-medium text-emerald-900">
                          Verified review from a completed booking
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
