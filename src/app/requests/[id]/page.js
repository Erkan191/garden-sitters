"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

function Avatar({ profile, fallback, size = 56 }) {
  const safeFallback =
    typeof fallback === "string" && fallback.trim() !== ""
      ? fallback.trim()
      : "U";

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={safeFallback}
        width={size}
        height={size}
        className="shrink-0 rounded-full border object-cover bg-gray-100"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="shrink-0 rounded-full border bg-gray-100 text-black font-semibold flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {safeFallback.slice(0, 1).toUpperCase()}
    </div>
  );
}

function buildCareTags(request) {
  if (!request) return [];

  const tags = [];

  if (request.visit_frequency === "daily") tags.push("Once a day");
  if (request.visit_frequency === "every_2_days") tags.push("Every 2 days");
  if (request.visit_frequency === "custom") tags.push("Custom visits");

  if (request.need_watering) tags.push("Watering needed");
  if (request.need_harvesting) tags.push("Harvesting needed");
  if (request.has_greenhouse) tags.push("Greenhouse");
  if (request.has_veg_beds) tags.push("Veg beds");
  if (request.has_pots) tags.push("Pots / containers");
  if (request.has_seedlings) tags.push("Seedlings / young plants");

  return tags;
}

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

export default function RequestDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState(null);
  const [offers, setOffers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [msg, setMsg] = useState("");

  const [offerMessage, setOfferMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");

  const [profilesById, setProfilesById] = useState({});
  const [reviewStatsByUserId, setReviewStatsByUserId] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  const isOwner = req && userId && req.owner_id === userId;

  async function loadAll() {
    setLoading(true);
    setMsg("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data: requestData, error: requestError } = await supabase
      .from("care_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (requestError) {
      setMsg(requestError.message);
      setLoading(false);
      return;
    }

    setReq(requestData);

    const { data: offersData, error: offersError } = await supabase
      .from("offers")
      .select("id, message, proposed_price_gbp, status, created_at, gardener_id")
      .eq("request_id", id)
      .order("created_at", { ascending: false });

    if (offersError) {
      setMsg(offersError.message);
      setOffers([]);
      setLoading(false);
      return;
    }

    const safeOffers = offersData ?? [];
    setOffers(safeOffers);

    const profileIds = [
      requestData?.owner_id,
      ...safeOffers.map((o) => o.gardener_id),
    ].filter(Boolean);

    const uniqueProfileIds = [...new Set(profileIds)];

    if (uniqueProfileIds.length > 0) {
      const { data: profileRows, error: profileErr } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          avatar_url,
          location,
          skill_watering,
          skill_harvesting,
          skill_greenhouse,
          skill_veg_beds,
          skill_pots,
          skill_seedlings
        `)
        .in("id", uniqueProfileIds);

      if (profileErr) {
        setMsg(profileErr.message);
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
        .in("reviewee_id", uniqueProfileIds);

      if (reviewErr) {
        setMsg(reviewErr.message);
      } else {
        setReviewStatsByUserId(buildReviewStats(reviewRows || []));
      }
    } else {
      setProfilesById({});
      setReviewStatsByUserId({});
    }

    const { data: unreadRows } = await supabase.rpc("get_my_unread_request_counts");
    const matchingUnread = (unreadRows || []).find((row) => row.request_id === id);
    setUnreadCount(Number(matchingUnread?.unread_count || 0));

    setLoading(false);
  }

  useEffect(() => {
    if (id) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitOffer(e) {
    e.preventDefault();
    setMsg("Submitting offer...");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return router.push("/login");

    if (user.id === req?.owner_id) {
      setMsg("Owners cannot send offers on their own request.");
      return;
    }

    const alreadyOffered = offers.some((o) => o.gardener_id === user.id);
    if (alreadyOffered) {
      setMsg("You already sent an offer for this request.");
      return;
    }

    const { error } = await supabase.from("offers").insert({
      request_id: id,
      gardener_id: user.id,
      message: offerMessage.trim() === "" ? null : offerMessage.trim(),
      proposed_price_gbp: offerPrice === "" ? null : Number(offerPrice),
    });

    if (error) {
      if (
        error.message?.toLowerCase().includes("duplicate") ||
        error.message?.toLowerCase().includes("unique")
      ) {
        setMsg("You already sent an offer for this request.");
        return;
      }

      return setMsg(error.message);
    }

    setMsg("Offer sent ✅");
    setOfferMessage("");
    setOfferPrice("");
    await loadAll();
  }

  async function acceptOffer(offerId) {
    setMsg("Accepting offer...");

    const { error } = await supabase.rpc("accept_offer_safely", {
      p_request_id: id,
      p_offer_id: offerId,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Offer accepted ✅");
    await loadAll();
  }

  async function bookAndPay(offerId) {
    setMsg("Creating checkout...");

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return setMsg("Not logged in.");

    const res = await fetch("/api/stripe/checkout/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offerId }),
    });

    const json = await res.json();
    if (!res.ok) return setMsg(json.error || "Failed to create checkout session");

    window.location.href = json.url;
  }

  const acceptedOffer = offers.find((o) => o.status === "accepted");
  const isAcceptedGardener =
    acceptedOffer && userId && acceptedOffer.gardener_id === userId;
  const canOpenChat =
    String(req?.status) === "accepted" && (isOwner || isAcceptedGardener);

  const ownerProfile = profilesById[req?.owner_id];
  const ownerName = ownerProfile?.full_name?.trim() || "Owner";
  const ownerLocation = ownerProfile?.location?.trim() || "";
  const ownerRating =
    req?.owner_id ? formatRating(reviewStatsByUserId[req.owner_id]) : "No reviews yet";

  const myExistingOffer = offers.find((o) => o.gardener_id === userId);

  const canSubmitOffer =
    !isOwner &&
    String(req?.status) === "open" &&
    !myExistingOffer;

  const careTags = buildCareTags(req);

  const offersWithTrust = useMemo(() => {
    return offers.map((offer) => {
      const gardenerProfile = profilesById[offer.gardener_id];
      return {
        ...offer,
        gardenerProfile,
        gardenerName: gardenerProfile?.full_name?.trim() || "Gardener",
        gardenerLocation: gardenerProfile?.location?.trim() || "",
        gardenerRating: formatRating(reviewStatsByUserId[offer.gardener_id]),
        gardenerSkillTags: buildSkillTags(gardenerProfile),
      };
    });
  }, [offers, profilesById, reviewStatsByUserId]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <p>Loading...</p>
      </main>
    );
  }

  if (!req) {
    return (
      <main className="min-h-screen p-6">
        <p>Request not found.</p>
        {msg && <p className="mt-2">{msg}</p>}
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <a className="underline" href="/requests">
          ← Back to requests
        </a>

        <div className="rounded-2xl border p-6">
          <div className="flex items-start gap-4">
            <Avatar profile={ownerProfile} fallback={ownerName} />

            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold">{req.title}</h1>

              <p className="mt-3 text-sm">
                Owner:{" "}
                <a href={`/users/${req.owner_id}`} className="underline">
                  {ownerName}
                </a>
              </p>

              <p className="mt-1 text-sm opacity-80">
                Trust: {ownerRating}
              </p>

              {ownerLocation && (
                <p className="mt-1 text-sm opacity-80">
                  Location: {ownerLocation}
                </p>
              )}

              <p className="mt-3 text-sm opacity-80">
                {req.postcode || "No postcode"} • {req.start_date} → {req.end_date}
              </p>

              <p className="mt-2 text-sm opacity-80">Status: {String(req.status)}</p>

              {canOpenChat && (
                <a className="mt-3 inline-block underline" href={`/requests/${id}/chat`}>
                  Open chat{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}
                </a>
              )}

              {req.price_offered_gbp != null && (
                <p className="mt-2 text-sm">Price offered: £{req.price_offered_gbp}</p>
              )}
            </div>
          </div>

          {careTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {careTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border px-2 py-1 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {req.details && <p className="mt-4 whitespace-pre-wrap">{req.details}</p>}

          {isOwner && String(req.status) === "accepted" && acceptedOffer && (
            <button
              onClick={() => bookAndPay(acceptedOffer.id)}
              className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
            >
              Book & Pay
            </button>
          )}
        </div>

        {canSubmitOffer && (
          <div className="rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">Offer to help</h2>

            <form onSubmit={submitOffer} className="mt-4 space-y-3">
              <div>
                <label className="text-sm">Message (optional)</label>
                <textarea
                  className="mt-1 w-full rounded-xl border p-2"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm">Proposed price (£) (optional)</label>
                <input
                  className="mt-1 w-full rounded-xl border p-2"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  inputMode="decimal"
                />
              </div>

              <button className="rounded-xl bg-black px-4 py-2 text-white">
                Send offer
              </button>
            </form>
          </div>
        )}

        {!isOwner && String(req.status) === "open" && myExistingOffer && (
          <div className="rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">Your offer</h2>

            <p className="mt-3 text-sm opacity-80">
              You already sent an offer for this request.
            </p>

            <p className="mt-2 text-sm opacity-80">
              Status: {myExistingOffer.status}
              {myExistingOffer.proposed_price_gbp != null
                ? ` • £${myExistingOffer.proposed_price_gbp}`
                : ""}
            </p>

            {myExistingOffer.message && (
              <p className="mt-3 whitespace-pre-wrap">{myExistingOffer.message}</p>
            )}
          </div>
        )}

        {isOwner && (
          <div className="rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">Offers</h2>

            {offersWithTrust.length === 0 ? (
              <p className="mt-3 text-sm opacity-80">No offers yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {offersWithTrust.map((o) => (
                  <div key={o.id} className="rounded-xl border p-4">
                    <div className="flex items-start gap-4">
                      <Avatar profile={o.gardenerProfile} fallback={o.gardenerName} />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          Gardener:{" "}
                          <a href={`/users/${o.gardener_id}`} className="underline">
                            {o.gardenerName}
                          </a>
                        </p>

                        <p className="mt-1 text-sm opacity-80">
                          Trust: {o.gardenerRating}
                        </p>

                        {o.gardenerLocation && (
                          <p className="mt-1 text-sm opacity-80">
                            Location: {o.gardenerLocation}
                          </p>
                        )}

                        {o.gardenerSkillTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {o.gardenerSkillTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border px-2 py-1 text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="mt-2 text-sm opacity-80">
                          Status: {o.status}
                          {o.proposed_price_gbp != null ? ` • £${o.proposed_price_gbp}` : ""}
                        </p>

                        {o.message && (
                          <p className="mt-2 whitespace-pre-wrap">{o.message}</p>
                        )}

                        {String(req.status) === "open" && o.status === "pending" && (
                          <button
                            onClick={() => acceptOffer(o.id)}
                            className="mt-3 rounded-xl bg-black px-3 py-2 text-white"
                          >
                            Accept offer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {msg && <p className="text-sm opacity-80">{msg}</p>}
      </div>
    </main>
  );
}