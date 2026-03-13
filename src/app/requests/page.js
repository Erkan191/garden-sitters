"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={fallback}
        className={`${size} rounded-full border object-cover`}
      />
    );
  }

  return (
    <div
      className={`${size} flex items-center justify-center rounded-full border text-sm font-semibold`}
    >
      {fallback.slice(0, 1).toUpperCase()}
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

export default function RequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [reviewStatsByUserId, setReviewStatsByUserId] = useState({});
  const [unreadByRequestId, setUnreadByRequestId] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg("");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("care_requests")
        .select(
          "id, owner_id, title, postcode, start_date, end_date, price_offered_gbp, status, created_at, visit_frequency, need_watering, need_harvesting, has_greenhouse, has_veg_beds, has_pots, has_seedlings"
        )
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

      const ownerIds = [...new Set(safeRequests.map((r) => r.owner_id).filter(Boolean))];

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

      setLoading(false);
    }

    load();
  }, [router]);

  const requestCards = useMemo(() => {
    return requests.map((request) => {
      const ownerProfile = profilesById[request.owner_id];
      const ownerName = ownerProfile?.full_name?.trim() || "Owner";
      const ownerRating = formatRating(reviewStatsByUserId[request.owner_id]);
      const unreadCount = unreadByRequestId[request.id] || 0;
      const careTags = buildCareTags(request);

      return {
        ...request,
        ownerProfile,
        ownerName,
        ownerRating,
        unreadCount,
        careTags,
      };
    });
  }, [profilesById, requests, reviewStatsByUserId, unreadByRequestId]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Care requests</h1>
          <a className="underline" href="/requests/new">
            New request
          </a>
        </div>

        {loading && <p className="mt-4">Loading...</p>}
        {errorMsg && <p className="mt-4">{errorMsg}</p>}

        {!loading && !errorMsg && (
          <div className="mt-6 space-y-3">
            {requestCards.length === 0 ? (
              <p>No requests yet.</p>
            ) : (
              requestCards.map((r) => (
                <a
                  key={r.id}
                  href={`/requests/${r.id}`}
                  className="block rounded-2xl border p-4 hover:bg-gray-50 hover:text-black"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar profile={r.ownerProfile} fallback={r.ownerName} />

                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold">{r.title}</h2>

                        <p className="mt-1 text-sm opacity-80">
                          Owner: {r.ownerName}
                        </p>

                        <p className="mt-1 text-sm opacity-80">
                          Trust: {r.ownerRating}
                        </p>

                        <p className="mt-2 text-sm opacity-80">
                          {r.postcode || "No postcode"} • {r.start_date} → {r.end_date}
                        </p>

                        <p className="mt-1 text-sm opacity-80">
                          Status: {r.status}
                          {r.price_offered_gbp != null ? ` • £${r.price_offered_gbp}` : ""}
                        </p>

                        {r.careTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {r.careTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border px-2 py-1 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {r.unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-black px-3 py-1 text-xs text-white">
                        {r.unreadCount} unread
                      </span>
                    )}
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}