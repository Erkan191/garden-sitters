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
      className="flex shrink-0 items-center justify-center rounded-full border bg-gray-100 font-semibold text-black"
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

function buildMatchData(request, profile) {
  if (!request || !profile) {
    return {
      goodMatches: [],
      missingSkills: [],
    };
  }

  const checks = [
    { requestKey: "need_watering", skillKey: "skill_watering", label: "Watering" },
    { requestKey: "need_harvesting", skillKey: "skill_harvesting", label: "Harvesting" },
    { requestKey: "has_greenhouse", skillKey: "skill_greenhouse", label: "Greenhouse" },
    { requestKey: "has_veg_beds", skillKey: "skill_veg_beds", label: "Veg beds" },
    { requestKey: "has_pots", skillKey: "skill_pots", label: "Pots / containers" },
    { requestKey: "has_seedlings", skillKey: "skill_seedlings", label: "Seedlings / young plants" },
  ];

  const relevantChecks = checks.filter((item) => request[item.requestKey]);

  return {
    goodMatches: relevantChecks
      .filter((item) => profile[item.skillKey])
      .map((item) => item.label),

    missingSkills: relevantChecks
      .filter((item) => !profile[item.skillKey])
      .map((item) => item.label),
  };
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

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function formatPrice(value) {
  if (value == null) return null;
  return `£${Number(value).toFixed(0)}`;
}

function getStatusBadgeClass(status) {
  if (status === "open") return "bg-green-100 text-green-800 border-green-200";
  if (status === "accepted") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "completed") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getStatusLabel(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getOfferStatusBadgeClass(status) {
  if (status === "pending") return "bg-gray-100 text-gray-700 border-gray-200";
  if (status === "accepted") return "bg-green-100 text-green-800 border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getBookingStatusBadgeClass(status) {
  if (status === "pending_payment") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }
  if (status === "paid") {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  return "bg-gray-100 text-gray-700 border-gray-200";
}

const MAX_PRICE_GBP = 999999.99;

export default function RequestDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [req, setReq] = useState(null);
  const [offers, setOffers] = useState([]);
  const [booking, setBooking] = useState(null);
  const [bookingReviews, setBookingReviews] = useState([]);
  const [userId, setUserId] = useState(null);
  const [msg, setMsg] = useState("");

  const [offerMessage, setOfferMessage] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [completingBooking, setCompletingBooking] = useState(false);

  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [profilesById, setProfilesById] = useState({});
  const [reviewStatsByUserId, setReviewStatsByUserId] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  const isOwner = req && userId && req.owner_id === userId;

  async function loadAll() {
    setLoading(true);
    setMsg("");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user || null;

    setUserId(user?.id || null);

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

    let safeOffers = [];

    if (user) {
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

      safeOffers = offersData ?? [];
    }

    setOffers(safeOffers);

    const { data: bookingRow, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, request_id, offer_id, owner_id, gardener_id, amount_gbp, platform_fee_gbp, status, stripe_checkout_session_id, stripe_payment_intent_id, created_at, payout_status, payout_error, completed_at"
      )
      .eq("request_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bookingError) {
      setMsg(bookingError.message);
      setBooking(null);
      setBookingReviews([]);
      setLoading(false);
      return;
    }

    setBooking(bookingRow ?? null);

    if (bookingRow?.id) {
      const { data: bookingReviewRows, error: bookingReviewsError } = await supabase
        .from("reviews")
        .select("id, booking_id, reviewer_id, reviewee_id, rating, comment, created_at")
        .eq("booking_id", bookingRow.id)
        .order("created_at", { ascending: true });

      if (bookingReviewsError) {
        setMsg(bookingReviewsError.message);
        setBookingReviews([]);
      } else {
        setBookingReviews(bookingReviewRows ?? []);
      }
    } else {
      setBookingReviews([]);
    }

    const profileIds = [
      requestData?.owner_id,
      ...(bookingRow?.gardener_id ? [bookingRow.gardener_id] : []),
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

    if (user) {
      const { data: unreadRows } = await supabase.rpc("get_my_unread_request_counts");
      const matchingUnread = (unreadRows || []).find((row) => row.request_id === id);
      setUnreadCount(Number(matchingUnread?.unread_count || 0));
    } else {
      setUnreadCount(0);
    }

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

    const parsedOfferPrice = offerPrice === "" ? null : Number(offerPrice);

    if (
      parsedOfferPrice !== null &&
      (!Number.isFinite(parsedOfferPrice) ||
        parsedOfferPrice <= 0 ||
        parsedOfferPrice > MAX_PRICE_GBP ||
        Math.round(parsedOfferPrice * 100) !== parsedOfferPrice * 100)
    ) {
      setMsg(
        "Price must be between £0.01 and £999,999.99, with no more than 2 decimal places."
      );
      return;
    }

    const { error } = await supabase.from("offers").insert({
      request_id: id,
      gardener_id: user.id,
      message: offerMessage.trim() === "" ? null : offerMessage.trim(),
      proposed_price_gbp: parsedOfferPrice,
    });

    if (error) {
      if (
        error.message?.toLowerCase().includes("duplicate") ||
        error.message?.toLowerCase().includes("unique")
      ) {
        setMsg("You already sent an offer for this request.");
        return;
      }

      setMsg(error.message);
      return;
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

    if (!token) {
      setMsg("Not logged in.");
      return;
    }

    const res = await fetch("/api/stripe/checkout/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ offerId }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(json.error || "Failed to create checkout session");
      return;
    }

    window.location.href = json.url;
  }

  async function completeAndPayGardener() {
    if (!booking?.id) return;

    setCompletingBooking(true);
    setMsg("Completing booking and paying gardener...");

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    if (!token) {
      setMsg("Please log in again.");
      setCompletingBooking(false);
      return;
    }

    const res = await fetch("/api/stripe/payout/complete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId: booking.id }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(json.error || "Failed to pay gardener");
      setCompletingBooking(false);
      return;
    }

    setMsg(`Completed ✅ Transfer: ${json.transferId}`);
    setCompletingBooking(false);
    await loadAll();
  }

  async function submitReview(e) {
    e.preventDefault();

    if (!booking?.id || booking.status !== "completed") {
      setMsg("Reviews only unlock once the booking is completed.");
      return;
    }

    if (!userId) {
      router.push("/login");
      return;
    }

    const ratingNumber = Number(reviewRating);

    if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      setMsg("Rating must be between 1 and 5.");
      return;
    }

    let revieweeId = null;

    if (userId === booking.owner_id) {
      revieweeId = booking.gardener_id;
    } else if (userId === booking.gardener_id) {
      revieweeId = booking.owner_id;
    } else {
      setMsg("You cannot review this booking.");
      return;
    }

    setReviewSubmitting(true);
    setMsg("Submitting review...");

    const { error } = await supabase.from("reviews").insert({
      booking_id: booking.id,
      reviewer_id: userId,
      reviewee_id: revieweeId,
      rating: ratingNumber,
      comment: reviewComment.trim() === "" ? null : reviewComment.trim(),
    });

    if (error) {
      if (
        error.message?.toLowerCase().includes("duplicate") ||
        error.message?.toLowerCase().includes("unique")
      ) {
        setMsg("You have already reviewed this booking.");
      } else {
        setMsg(error.message);
      }
      setReviewSubmitting(false);
      return;
    }

    setReviewComment("");
    setReviewRating("5");
    setReviewSubmitting(false);
    setMsg("Review submitted ✅");
    await loadAll();
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
  const requestStatusLabel = getStatusLabel(req?.status);
  const requestStatusBadgeClass = getStatusBadgeClass(req?.status);
  const formattedRequestDateRange = formatDateRange(req?.start_date, req?.end_date);
  const formattedRequestPrice = formatPrice(req?.price_offered_gbp);

  const myExistingOffer = offers.find((o) => o.gardener_id === userId);

  const canSubmitOffer =
    !isOwner &&
    String(req?.status) === "open" &&
    !myExistingOffer;

  const careTags = buildCareTags(req);

  const bookingGardenerProfile = booking?.gardener_id
    ? profilesById[booking.gardener_id]
    : null;

  const bookingGardenerName =
    bookingGardenerProfile?.full_name?.trim() || "Gardener";

  const bookingGardenerRating = booking?.gardener_id
    ? formatRating(reviewStatsByUserId[booking.gardener_id])
    : "No reviews yet";

  const bookingStatusLabel = getStatusLabel(booking?.status);
  const bookingStatusBadgeClass = getBookingStatusBadgeClass(booking?.status);

  const canReview =
    booking?.status === "completed" &&
    userId &&
    (userId === booking.owner_id || userId === booking.gardener_id);

  const myBookingReview = bookingReviews.find((review) => review.reviewer_id === userId);

  const reviewTargetId =
    userId === booking?.owner_id
      ? booking?.gardener_id
      : userId === booking?.gardener_id
      ? booking?.owner_id
      : null;

  const reviewTargetProfile = reviewTargetId ? profilesById[reviewTargetId] : null;
  const reviewTargetName =
    reviewTargetProfile?.full_name?.trim() ||
    (userId === booking?.owner_id ? "Gardener" : "Owner");

  const offersWithTrust = useMemo(() => {
    return offers.map((offer) => {
      const gardenerProfile = profilesById[offer.gardener_id];
      const matchData = buildMatchData(req, gardenerProfile);

      return {
        ...offer,
        gardenerProfile,
        gardenerName: gardenerProfile?.full_name?.trim() || "Gardener",
        gardenerLocation: gardenerProfile?.location?.trim() || "",
        gardenerRating: formatRating(reviewStatsByUserId[offer.gardener_id]),
        gardenerSkillTags: buildSkillTags(gardenerProfile),
        goodMatches: matchData.goodMatches,
        missingSkills: matchData.missingSkills,
        statusLabel: getStatusLabel(offer.status),
        statusBadgeClass: getOfferStatusBadgeClass(offer.status),
        formattedPrice: formatPrice(offer.proposed_price_gbp),
      };
    });
  }, [offers, profilesById, reviewStatsByUserId, req]);

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
        {msg && <p className="mt-2 text-zinc-600">{msg}</p>}
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <a className="underline text-zinc-700" href="/requests">
          ← Back to requests
        </a>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
          <div className="flex items-start gap-4">
            <Avatar profile={ownerProfile} fallback={ownerName} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{req.title}</h1>

                <span
                  className={`rounded-full border px-2 py-1 text-xs font-medium ${requestStatusBadgeClass}`}
                >
                  {requestStatusLabel}
                </span>
              </div>

              <p className="mt-3 text-sm text-zinc-700">
                Owner:{" "}
                <a href={`/users/${req.owner_id}`} className="underline">
                  {ownerName}
                </a>
              </p>

              <p className="mt-1 text-sm text-zinc-600">Trust: {ownerRating}</p>

              {ownerLocation && (
                <p className="mt-1 text-sm text-zinc-600">
                  Location: {ownerLocation}
                </p>
              )}

              <p className="mt-3 text-sm text-zinc-600">
                {req.postcode || "No postcode"} • {formattedRequestDateRange}
              </p>

              {formattedRequestPrice && (
                <p className="mt-2 text-sm text-zinc-600">
                  Offered: {formattedRequestPrice}
                </p>
              )}

              {canOpenChat && (
                <a
                  className="mt-3 inline-block underline text-zinc-700"
                  href={`/requests/${id}/chat`}
                >
                  Open chat{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}
                </a>
              )}
            </div>
          </div>

          {careTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {careTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {req.details && <p className="mt-4 whitespace-pre-wrap">{req.details}</p>}

          {isOwner &&
            String(req.status) === "accepted" &&
            acceptedOffer &&
            !booking && (
              <button
                onClick={() => bookAndPay(acceptedOffer.id)}
                className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
              >
                Book and pay
              </button>
            )}
        </div>

        {booking && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">Booking</h2>

              <span
                className={`rounded-full border px-2 py-1 text-xs font-medium ${bookingStatusBadgeClass}`}
              >
                {bookingStatusLabel}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-zinc-600">
              <p>
                Gardener:{" "}
                <a href={`/users/${booking.gardener_id}`} className="underline">
                  {bookingGardenerName}
                </a>
              </p>

              <p>Trust: {bookingGardenerRating}</p>

              <p>Amount: {formatPrice(booking.amount_gbp) || "No amount"}</p>

              <p>
                Platform fee: {formatPrice(booking.platform_fee_gbp) || "No fee"}
              </p>

              <p>Payout status: {booking.payout_status || "unknown"}</p>

              {booking.created_at && (
                <p>Created: {formatDateTime(booking.created_at)}</p>
              )}

              {booking.completed_at && (
                <p>Completed: {formatDateTime(booking.completed_at)}</p>
              )}

              {booking.payout_error && (
                <p className="text-red-600">Payout error: {booking.payout_error}</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {isOwner && booking.status === "pending_payment" && acceptedOffer && (
                <button
                  onClick={() => bookAndPay(acceptedOffer.id)}
                  className="rounded-xl bg-black px-4 py-2 text-white"
                >
                  Complete payment
                </button>
              )}

              {isOwner && booking.status === "paid" && (
                <button
                  onClick={completeAndPayGardener}
                  disabled={completingBooking}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {completingBooking
                    ? "Completing booking..."
                    : "Complete booking and pay gardener"}
                </button>
              )}

              {canOpenChat && (
                <a
                  href={`/requests/${id}/chat`}
                  className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
                >
                  Open chat
                </a>
              )}
            </div>

            {booking.status === "completed" && (
              <p className="mt-4 text-sm text-emerald-700">
                This booking is complete.
              </p>
            )}
          </div>
        )}

        {booking && booking.status === "completed" && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
            <h2 className="text-xl font-semibold">Reviews</h2>

            <div className="mt-4 space-y-4">
              {bookingReviews.length === 0 ? (
                <p className="text-sm text-zinc-600">
                  No reviews have been left for this booking yet.
                </p>
              ) : (
                bookingReviews.map((review) => {
                  const reviewerProfile = profilesById[review.reviewer_id];
                  const reviewerName =
                    reviewerProfile?.full_name?.trim() || "User";

                  return (
                    <div
                      key={review.id}
                      className="rounded-xl border border-zinc-200 p-4"
                    >
                      <p className="text-sm text-zinc-700">
                        Reviewer: {reviewerName}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        Rating: {review.rating} / 5
                      </p>
                      {review.comment && (
                        <p className="mt-2 whitespace-pre-wrap text-zinc-800">
                          {review.comment}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-zinc-500">
                        {formatDateTime(review.created_at)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {canReview && !myBookingReview && (
              <form onSubmit={submitReview} className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Leave a review for {reviewTargetName}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Leave an honest review of how it went.
                  </p>
                </div>

                <div>
                  <label className="text-sm text-zinc-700">Rating</label>
                  <select
                    className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Good</option>
                    <option value="3">3 - Okay</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Very poor</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-zinc-700">
                    Comment (optional)
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="How did it go?"
                  />
                </div>

                <button
                  disabled={reviewSubmitting}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {reviewSubmitting ? "Submitting review..." : "Submit review"}
                </button>
              </form>
            )}

            {canReview && myBookingReview && (
              <p className="mt-6 text-sm text-zinc-600">
                You have already left a review for this booking.
              </p>
            )}
          </div>
        )}

        {canSubmitOffer && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
            <h2 className="text-xl font-semibold">Offer to help</h2>

            <form onSubmit={submitOffer} className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-zinc-700">Message (optional)</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm text-zinc-700">
                  Proposed price (£) (optional)
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
                  type="number"
                  min="0.01"
                  max="999999.99"
                  step="0.01"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  inputMode="decimal"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Maximum £999,999.99
                </p>
              </div>

              <button className="rounded-xl bg-black px-4 py-2 text-white">
                Send offer
              </button>
            </form>
          </div>
        )}

        {!isOwner && String(req.status) === "open" && myExistingOffer && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
            <h2 className="text-xl font-semibold">Your offer</h2>

            <p className="mt-3 text-sm text-zinc-600">
              You already sent an offer for this request.
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
              <span
                className={`rounded-full border px-2 py-1 text-xs font-medium ${getOfferStatusBadgeClass(
                  myExistingOffer.status
                )}`}
              >
                {getStatusLabel(myExistingOffer.status)}
              </span>

              {myExistingOffer.proposed_price_gbp != null && (
                <span>• {formatPrice(myExistingOffer.proposed_price_gbp)}</span>
              )}
            </div>

            {myExistingOffer.message && (
              <p className="mt-3 whitespace-pre-wrap">{myExistingOffer.message}</p>
            )}
          </div>
        )}

        {isOwner && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
            <h2 className="text-xl font-semibold">Offers</h2>

            {offersWithTrust.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">No offers yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {offersWithTrust.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-xl border border-zinc-200 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar profile={o.gardenerProfile} fallback={o.gardenerName} />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-700">
                          Gardener:{" "}
                          <a href={`/users/${o.gardener_id}`} className="underline">
                            {o.gardenerName}
                          </a>
                        </p>

                        <p className="mt-1 text-sm text-zinc-600">
                          Trust: {o.gardenerRating}
                        </p>

                        {o.gardenerLocation && (
                          <p className="mt-1 text-sm text-zinc-600">
                            Location: {o.gardenerLocation}
                          </p>
                        )}

                        {o.gardenerSkillTags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {o.gardenerSkillTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {(o.goodMatches.length > 0 || o.missingSkills.length > 0) && (
                          <div className="mt-3 space-y-1 text-sm">
                            {o.goodMatches.length > 0 && (
                              <p className="text-zinc-600">
                                Good match: {o.goodMatches.join(", ")}
                              </p>
                            )}

                            {o.missingSkills.length > 0 && (
                              <p className="text-zinc-500">
                                Missing: {o.missingSkills.join(", ")}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${o.statusBadgeClass}`}
                          >
                            {o.statusLabel}
                          </span>

                          {o.formattedPrice && <span>• {o.formattedPrice}</span>}
                        </div>

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

        {msg && <p className="text-sm text-zinc-600">{msg}</p>}
      </div>
    </main>
  );
}