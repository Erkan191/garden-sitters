"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
        className="shrink-0 rounded-full border border-stone-200 bg-stone-100 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 font-semibold text-emerald-900"
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
  if (status === "open") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (status === "accepted") return "bg-amber-50 text-amber-800 border-amber-100";
  if (status === "completed") return "bg-stone-100 text-stone-700 border-stone-200";
  if (status === "closed") return "bg-zinc-100 text-zinc-600 border-zinc-200";
  return "bg-stone-100 text-stone-700 border-stone-200";
}

function getStatusLabel(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getOfferStatusBadgeClass(status) {
  if (status === "pending") return "bg-stone-100 text-stone-700 border-stone-200";
  if (status === "accepted") return "bg-emerald-50 text-emerald-800 border-emerald-100";
  if (status === "rejected") return "bg-red-50 text-red-700 border-red-100";
  return "bg-stone-100 text-stone-700 border-stone-200";
}
function getBookingStatusBadgeClass(status) {
  if (status === "pending_payment") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }
  if (status === "paid") {
    return "bg-sky-50 text-sky-800 border-sky-100";
  }
  if (status === "completed") {
    return "bg-emerald-50 text-emerald-800 border-emerald-100";
  }
  return "bg-stone-100 text-stone-700 border-stone-200";
}

function getPayoutStatusBadgeClass(status) {
  if (status === "paid") {
    return "bg-emerald-50 text-emerald-800 border-emerald-100";
  }
  if (status === "pending") {
    return "bg-amber-50 text-amber-800 border-amber-100";
  }
  if (status === "failed") {
    return "bg-red-50 text-red-700 border-red-100";
  }
  return "bg-stone-100 text-stone-700 border-stone-200";
}

function getPayoutStatusLabel(status) {
  if (status === "paid") return "Payout paid";
  if (status === "pending") return "Payout pending";
  if (status === "failed") return "Payout failed";
  return "Payout not started";
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
  const [deletingRequest, setDeletingRequest] = useState(false);
  const [closingRequest, setClosingRequest] = useState(false);
  const [reopeningRequest, setReopeningRequest] = useState(false);
  const [withdrawingOfferId, setWithdrawingOfferId] = useState("");
  const [rejectingOfferId, setRejectingOfferId] = useState("");

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
          skill_seedlings,
          stripe_onboarding_complete
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

    async function withdrawOffer(offerId) {
    setWithdrawingOfferId(offerId);
    setMsg("Withdrawing offer...");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        setMsg("Please log in again.");
        setWithdrawingOfferId("");
        return;
      }

      const res = await fetch("/api/offers/withdraw", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offerId }),
      });

      const text = await res.text();
      let json = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (!res.ok) {
        setMsg(json.error || "Failed to withdraw offer");
        setWithdrawingOfferId("");
        return;
      }

      setWithdrawingOfferId("");
      setMsg("Offer withdrawn ✅");
      await loadAll();
    } catch (error) {
      setMsg("Something went wrong withdrawing this offer.");
      setWithdrawingOfferId("");
    }
  }

  async function rejectOffer(offerId) {
    setRejectingOfferId(offerId);
    setMsg("Rejecting offer...");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        setMsg("Please log in again.");
        setRejectingOfferId("");
        return;
      }

      const res = await fetch("/api/offers/reject", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ offerId }),
      });

      const text = await res.text();
      let json = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (!res.ok) {
        setMsg(json.error || "Failed to reject offer");
        setRejectingOfferId("");
        return;
      }

      setRejectingOfferId("");
      setMsg("Offer rejected ✅");
      await loadAll();
    } catch (error) {
      setMsg("Something went wrong rejecting this offer.");
      setRejectingOfferId("");
    }
  }


  async function acceptOffer(offerId) {
    const offer = offers.find((row) => row.id === offerId);
    const gardenerProfile = offer ? profilesById[offer.gardener_id] : null;
    const payoutReady = Boolean(gardenerProfile?.stripe_onboarding_complete);

    if (!payoutReady) {
      setMsg("Gardener needs to connect payouts before this offer can be accepted.");
      return;
    }

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

     async function reopenRequest() {
    if (!req?.id) return;

    const confirmed = window.confirm(
      "Reopen this request? Gardeners will be able to send offers on it again."
    );

    if (!confirmed) {
      return;
    }

    setReopeningRequest(true);
    setMsg("Reopening request...");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        setMsg("Please log in again.");
        setReopeningRequest(false);
        return;
      }

      const res = await fetch("/api/requests/reopen", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId: req.id }),
      });

      const text = await res.text();
      let json = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (!res.ok) {
        setMsg(json.error || "Failed to reopen request");
        setReopeningRequest(false);
        return;
      }

      setReopeningRequest(false);
      await loadAll();
      setMsg("Request reopened ✅");
    } catch (error) {
      setMsg("Something went wrong reopening this request.");
      setReopeningRequest(false);
    }
  }

  async function closeRequest() {
    if (!req?.id) return;

    const confirmed = window.confirm(
      "Close this request? It will stay visible to you, but gardeners will no longer be able to offer on it."
    );

    if (!confirmed) {
      return;
    }

    setClosingRequest(true);
    setMsg("Closing request...");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        setMsg("Please log in again.");
        setClosingRequest(false);
        return;
      }

      const res = await fetch("/api/requests/close", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId: req.id }),
      });

      const text = await res.text();
      let json = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (!res.ok) {
        setMsg(json.error || "Failed to close request");
        setClosingRequest(false);
        return;
      }

      setClosingRequest(false);
      await loadAll();
      setMsg("Request closed ✅");
    } catch (error) {
      setMsg("Something went wrong closing this request.");
      setClosingRequest(false);
    }
  }

  async function deleteRequest() {
    if (!req?.id) return;

    const confirmed = window.confirm(
      "Delete this open request? This will also remove any offers on it."
    );

    if (!confirmed) {
      return;
    }

    setDeletingRequest(true);
    setMsg("Deleting request...");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;

      if (!token) {
        setMsg("Please log in again.");
        setDeletingRequest(false);
        return;
      }

      const res = await fetch("/api/requests/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId: req.id }),
      });

      const text = await res.text();
      let json = {};

      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = {};
      }

      if (!res.ok) {
        setMsg(json.error || "Failed to delete request");
        setDeletingRequest(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (error) {
      setMsg("Something went wrong deleting this request.");
      setDeletingRequest(false);
    }
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
  const hasBookingStatus =
    booking?.status === "paid" ||
    booking?.status === "completed" ||
    booking?.status === "pending_payment";
  const topStatusLabel =
    booking?.status === "paid"
      ? "Booking paid"
      : booking?.status === "completed"
      ? "Completed"
      : booking?.status === "pending_payment"
      ? "Payment pending"
      : requestStatusLabel;
  const topStatusBadgeClass = hasBookingStatus
    ? getBookingStatusBadgeClass(booking.status)
    : requestStatusBadgeClass;
  const payoutStatus = booking?.payout_status || "not_started";
  const payoutStatusLabel = getPayoutStatusLabel(payoutStatus);
  const payoutStatusBadgeClass = getPayoutStatusBadgeClass(payoutStatus);
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
        payoutReady: Boolean(gardenerProfile?.stripe_onboarding_complete),
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
      <main className="min-h-screen bg-stone-50 px-4 py-10 text-zinc-900 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-stone-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          Loading request...
        </div>
      </main>
    );
  }

  if (!req) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 py-10 text-zinc-900 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-stone-200 bg-white p-6 shadow-sm">
          <p className="font-medium text-zinc-900">Request not found.</p>
          {msg && <p className="mt-2 text-sm text-zinc-600">{msg}</p>}

          <Link
            href="/requests"
            className="mt-4 inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
          >
            Back to requests
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-10 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-emerald-900"
          href="/requests"
        >
          ← Back to requests
        </Link>

                <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.35fr] lg:items-start">
            <div>
              <div className="flex items-start gap-4">
                <Avatar profile={ownerProfile} fallback={ownerName} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold text-zinc-900">
                      {req.title}
                    </h1>

                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-medium ${topStatusBadgeClass}`}
                    >
                      {topStatusLabel}
                    </span>

                    {booking && (
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${payoutStatusBadgeClass}`}
                      >
                        {payoutStatusLabel}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-zinc-700">
                    Owner:{" "}
                    <Link
                      href={`/users/${req.owner_id}`}
                      className="font-medium text-emerald-900 hover:underline"
                    >
                      {ownerName}
                    </Link>
                  </p>

                  <p className="mt-1 text-sm text-zinc-600">
                    Trust: {ownerRating}
                  </p>

                  {ownerLocation && (
                    <p className="mt-1 text-sm text-zinc-600">
                      Location: {ownerLocation}
                    </p>
                  )}

                  <p className="mt-3 text-sm text-zinc-600">
                    {req.postcode || "No postcode"} • {formattedRequestDateRange}
                  </p>

                  {formattedRequestPrice && (
                    <p className="mt-2 text-sm font-medium text-emerald-900">
                      Offered: {formattedRequestPrice}
                    </p>
                  )}

                  {canOpenChat && (
                    <Link
                      className="mt-4 inline-flex rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-50"
                      href={`/requests/${id}/chat`}
                    >
                      Open chat{unreadCount > 0 ? ` (${unreadCount} unread)` : ""}
                    </Link>
                  )}
                </div>
              </div>

              {careTags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {careTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-stone-200 bg-white/80 px-2 py-1 text-xs text-zinc-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {req.details && (
                <p className="mt-5 whitespace-pre-wrap rounded-[1.25rem] border border-stone-200 bg-white/75 p-4 text-sm leading-6 text-zinc-700">
                  {req.details}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {isOwner && String(req.status) === "open" && (
                  <>
                    <Link
                      href={`/requests/${req.id}/edit`}
                      className="inline-block rounded-xl border border-stone-300 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-900 hover:bg-stone-50 sm:w-auto"
                    >
                      Edit request
                    </Link>

                    <button
                      type="button"
                      onClick={closeRequest}
                      disabled={closingRequest}
                      className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {closingRequest ? "Closing..." : "Close request"}
                    </button>

                    <button
                      type="button"
                      onClick={deleteRequest}
                      disabled={deletingRequest}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {deletingRequest ? "Deleting..." : "Delete request"}
                    </button>
                  </>
                )}

                {isOwner && String(req.status) === "closed" && (
                  <button
                    type="button"
                    onClick={reopenRequest}
                    disabled={reopeningRequest}
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {reopeningRequest ? "Reopening..." : "Reopen request"}
                  </button>
                )}

                {isOwner &&
                  String(req.status) === "accepted" &&
                  acceptedOffer &&
                  !booking && (
                    <div className="w-full rounded-[1.25rem] border border-emerald-100 bg-white/80 p-4">
                      <p className="text-sm font-medium text-zinc-900">
                        Ready to confirm this booking?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-zinc-600">
                        You’ll pay securely through Watch My Plot. The gardener is only
                        paid after the job is marked complete.
                      </p>

                      <button
                        type="button"
                        onClick={() => bookAndPay(acceptedOffer.id)}
                        className="mt-4 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800"
                      >
                        Confirm booking and pay securely
                      </button>
                    </div>
                  )}
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-100 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Request summary
              </p>

              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <p>
                  <span className="font-medium text-zinc-900">Area:</span>{" "}
                  {req.postcode || "No postcode"}
                </p>
                <p>
                  <span className="font-medium text-zinc-900">Dates:</span>{" "}
                  {formattedRequestDateRange}
                </p>
                <p>
                  <span className="font-medium text-zinc-900">Budget:</span>{" "}
                  {formattedRequestPrice || "Not set"}
                </p>
                <p>
                  <span className="font-medium text-zinc-900">Status:</span>{" "}
                  {topStatusLabel}
                </p>
                {booking && (
                  <p>
                    <span className="font-medium text-zinc-900">Payout:</span>{" "}
                    {payoutStatusLabel}
                  </p>
                )}
              </div>

              {!userId && (
                <Link
                  href="/login"
                  className="mt-5 inline-flex w-full justify-center rounded-xl bg-emerald-900 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Log in to send an offer
                </Link>
              )}
            </aside>
          </div>
        </section>


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
                  Confirm booking and pay securely
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
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 text-zinc-900 shadow-sm">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Send an offer
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                Offer to help with this plot
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                Tell the owner why you’re a good fit and suggest a price if you want to.
                A useful message is better than a vague one.
              </p>
            </div>

            <form onSubmit={submitOffer} className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-zinc-700">Message (optional)</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:bg-white"
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
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:bg-white"
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

              <button className="rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800">
                Send offer
              </button>
            </form>
          </section>
        )}

        {!isOwner && String(req.status) === "open" && myExistingOffer && (
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 text-zinc-900 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
              Your offer
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
              You’ve offered to help
            </h2>

                        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
              Your offer has been sent to the owner.
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
              <p className="mt-4 whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50/70 p-4 text-sm leading-6 text-zinc-700">
                {myExistingOffer.message}
              </p>
            )}

            {myExistingOffer.status === "pending" && (
              <button
                type="button"
                onClick={() => withdrawOffer(myExistingOffer.id)}
                disabled={withdrawingOfferId === myExistingOffer.id}
                className="mt-4 rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {withdrawingOfferId === myExistingOffer.id
                  ? "Withdrawing..."
                  : "Withdraw offer"}
              </button>
            )}
          </section>
        )}

        {isOwner && (
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 text-zinc-900 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                  Offers
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                  Gardeners offering to help
                </h2>
              </div>

              <p className="text-sm text-zinc-500">
                {offersWithTrust.length} offer
                {offersWithTrust.length === 1 ? "" : "s"}
              </p>
            </div>

            {offersWithTrust.length === 0 ? (
              <div className="mt-4 rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
                <p className="text-sm font-medium text-zinc-900">No offers yet.</p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  When gardeners offer to help with this request, they’ll appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {offersWithTrust.map((o) => (
                  <div
                    key={o.id}
                    className="rounded-[1.5rem] border border-stone-200 bg-stone-50/60 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar profile={o.gardenerProfile} fallback={o.gardenerName} />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-700">
                          Gardener:{" "}
                          <Link
                            href={`/users/${o.gardener_id}`}
                            className="font-medium text-emerald-900 hover:underline"
                          >
                            {o.gardenerName}
                          </Link>
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
                                className="rounded-full border border-stone-200 bg-white px-2 py-1 text-xs text-zinc-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {(o.goodMatches.length > 0 || o.missingSkills.length > 0) && (
                          <div className="mt-3 rounded-xl border border-stone-200 bg-white p-3 text-sm">
                            {o.goodMatches.length > 0 && (
                              <p className="text-emerald-900">
                                Good match: {o.goodMatches.join(", ")}
                              </p>
                            )}

                            {o.missingSkills.length > 0 && (
                              <p className="mt-1 text-zinc-500">
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

                          {o.formattedPrice && (
                            <span className="font-medium text-emerald-900">
                              • {o.formattedPrice}
                            </span>
                          )}

                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${
                              o.payoutReady
                                ? "border-emerald-100 bg-emerald-50 text-emerald-800"
                                : "border-amber-100 bg-amber-50 text-amber-800"
                            }`}
                          >
                            {o.payoutReady ? "Payouts ready" : "Needs payout setup"}
                          </span>
                        </div>

                        {o.message && (
                          <p className="mt-3 whitespace-pre-wrap rounded-xl bg-white p-3 text-sm leading-6 text-zinc-700">
                            {o.message}
                          </p>
                        )}

                                                  {String(req.status) === "open" && o.status === "pending" && (
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                              {o.payoutReady ? (
                                <button
                                  onClick={() => acceptOffer(o.id)}
                                  className="w-full rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 sm:w-auto"
                                >
                                  Accept offer
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="w-full cursor-not-allowed rounded-xl border border-amber-100 bg-amber-50 px-4 py-2 text-left text-sm font-medium text-amber-800 opacity-90 sm:w-auto sm:text-center"
                                >
                                  Gardener needs to connect payouts before this offer can be accepted.
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => rejectOffer(o.id)}
                                disabled={rejectingOfferId === o.id}
                                className="w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                              >
                                {rejectingOfferId === o.id ? "Rejecting..." : "Reject offer"}
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {msg && <p className="text-sm text-zinc-600">{msg}</p>}
      </div>
    </main>
  );
}
