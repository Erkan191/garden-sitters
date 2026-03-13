"use client";

import { useEffect, useMemo, useState } from "react";
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

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userErr || !user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

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
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="underline"
        >
          ← Back
        </button>

        {loading && <p>Loading...</p>}
        {msg && <p>{msg}</p>}

        {!loading && (
          <>
            <div className="rounded-2xl border p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="shrink-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="h-24 w-24 rounded-full border object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border text-3xl">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-semibold">
                    {isOwnProfile ? "Your profile" : displayName}
                  </h1>

                  {profile?.location && (
                    <p className="mt-2 text-sm opacity-70">{profile.location}</p>
                  )}

                  {profile?.bio ? (
                    <p className="mt-4 whitespace-pre-wrap">{profile.bio}</p>
                  ) : (
                    <p className="mt-4 text-sm opacity-70">
                      No bio yet.
                    </p>
                  )}

                  {skillTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {skillTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border px-2 py-1 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {isOwnProfile && (
                    <div className="mt-4">
                      <a href="/profile" className="underline">
                        Edit your profile
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <p className="text-sm opacity-70">Average rating</p>
                  <p className="mt-2 text-3xl font-semibold">
                    {averageRating ? `${averageRating}/5` : "No rating yet"}
                  </p>
                </div>

                <div className="rounded-2xl border p-4">
                  <p className="text-sm opacity-70">Reviews</p>
                  <p className="mt-2 text-3xl font-semibold">{totalReviews}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">What people said</h2>

              {reviews.length === 0 ? (
                <p className="mt-3 text-sm opacity-80">No reviews yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {reviews.map((review) => {
                    const reviewer = reviewerProfiles[review.reviewer_id];
                    const reviewerName = reviewer?.full_name?.trim() || "User";

                    return (
                      <div key={review.id} className="rounded-xl border p-4">
                        <p className="text-sm opacity-80">
                          Rating: {review.rating}/5 •{" "}
                          {new Date(review.created_at).toLocaleString()}
                        </p>

                        <p className="mt-2 text-sm opacity-70">
                          From: {reviewerName}
                        </p>

                        {review.comment ? (
                          <p className="mt-2 whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        ) : (
                          <p className="mt-2 italic opacity-70">
                            No written comment left.
                          </p>
                        )}

                        <p className="mt-2 text-xs opacity-60">
                          Verified review from a completed booking
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}