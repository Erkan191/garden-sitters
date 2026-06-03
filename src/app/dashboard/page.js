"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
  return `£${Number(value).toFixed(0)}`;
}

function formatVisitFrequency(value) {
  if (value === "daily") return "Once a day";
  if (value === "every_2_days") return "Every 2 days";
  if (value === "custom") return "Custom visits";
  if (!value) return null;
  return value;
}

function getStatusLabel(status) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getRequestStatusBadgeClass(status) {
  if (status === "open") return "bg-green-100 text-green-800 border-green-200";
  if (status === "accepted") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "completed") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getOfferStatusBadgeClass(status) {
  if (status === "pending") return "bg-gray-100 text-gray-700 border-gray-200";
  if (status === "accepted") return "bg-green-100 text-green-800 border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getBookingStatusLabel(status, fallbackStatus) {
  if (status === "pending_payment") return "Payment pending";
  if (status === "paid") return "Booking paid";
  if (status === "completed") return "Completed";
  return getStatusLabel(fallbackStatus);
}

function getBookingStatusBadgeClass(status, fallbackStatus) {
  if (status === "pending_payment") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }
  if (status === "paid") {
    return "bg-sky-100 text-sky-800 border-sky-200";
  }
  if (status === "completed") {
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  }
  return getRequestStatusBadgeClass(fallbackStatus);
}

function getPayoutStatusLabel(status) {
  if (status === "paid") return "Payout paid";
  if (status === "pending") return "Payout pending";
  if (status === "failed") return "Payout failed";
  return "Payout not started";
}

function getPayoutStatusBadgeClass(status) {
  if (status === "paid") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "pending") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "failed") return "bg-red-100 text-red-800 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

function buildRequestTags(request) {
  if (!request) return [];

  const tags = [];

  const frequencyLabel = formatVisitFrequency(request.visit_frequency);
  if (frequencyLabel) tags.push(frequencyLabel);
  if (request.need_watering) tags.push("Watering");
  if (request.need_harvesting) tags.push("Harvesting");
  if (request.has_greenhouse) tags.push("Greenhouse");
  if (request.has_veg_beds) tags.push("Veg beds");
  if (request.has_pots) tags.push("Pots");
  if (request.has_seedlings) tags.push("Seedlings");

  return tags;
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState("");

  const [requests, setRequests] = useState([]);

  const [requestsError, setRequestsError] = useState("");
  const [offerCountsByRequestId, setOfferCountsByRequestId] = useState({});
  const [acceptedOfferByRequestId, setAcceptedOfferByRequestId] = useState({});
  const [unreadCountsByRequestId, setUnreadCountsByRequestId] = useState({});

  const [offers, setOffers] = useState([]);

  const [offersError, setOffersError] = useState("");
  const [requestsById, setRequestsById] = useState({});
  const [bookingByRequestId, setBookingByRequestId] = useState({});

  const [requestFilter, setRequestFilter] = useState("all");
  const [offerFilter, setOfferFilter] = useState("all");
  const [payingOfferId, setPayingOfferId] = useState("");
  const [paymentErrorByRequestId, setPaymentErrorByRequestId] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data } = await supabase.auth.getUser();

      if (!data?.user) {
        router.push("/login");
        return;
      }

      const currentUser = data.user;

      setEmail(currentUser.email ?? "");
      setUserId(currentUser.id ?? "");

            const [
        { data: requestRows, error: requestError },
        { data: offerRows, error: offerError },
        { data: unreadRows, error: unreadError },
        { data: profileRow, error: profileLoadError },
      ] = await Promise.all([
        supabase
          .from("care_requests")
          .select(
            "id, owner_id, title, postcode, start_date, end_date, price_offered_gbp, status, created_at, visit_frequency, need_watering, need_harvesting, has_greenhouse, has_veg_beds, has_pots, has_seedlings"
          )
          .eq("owner_id", currentUser.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("offers")
          .select("id, request_id, message, proposed_price_gbp, status, created_at")
          .eq("gardener_id", currentUser.id)
          .order("created_at", { ascending: false }),

        supabase.rpc("get_my_unread_request_counts"),

        supabase
          .from("profiles")
          .select("id, full_name, stripe_account_id, stripe_onboarding_complete")
          .eq("id", currentUser.id)
          .maybeSingle(),
      ]);

      const safeRequests = requestRows ?? [];
      const safeProfile = profileRow ?? null;
      const ownerRequestIds = requestError
        ? []
        : [...new Set(safeRequests.map((request) => request.id).filter(Boolean))];

      async function loadBookingsForRequestIds(requestIds) {
        const uniqueRequestIds = [...new Set(requestIds.filter(Boolean))];

        if (uniqueRequestIds.length === 0) {
          setBookingByRequestId({});
          return;
        }

        const { data: bookingRows, error: bookingError } = await supabase
          .from("bookings")
          .select("id, request_id, offer_id, status, payout_status, stripe_transfer_id")
          .in("request_id", uniqueRequestIds);

        if (bookingError) {
          setBookingByRequestId({});
          return;
        }

        const bookingMap = {};

        for (const row of bookingRows ?? []) {
          bookingMap[row.request_id] = row;
        }

        setBookingByRequestId(bookingMap);
      }

      if (profileLoadError) {
        setProfile(null);
        setProfileError(profileLoadError.message);
      } else {
        setProfile(safeProfile);
        setProfileError("");
      }

      if (requestError) {
        setRequests([]);
        setRequestsError(requestError.message);
        setOfferCountsByRequestId({});
      } else {
        setRequests(safeRequests);
        setRequestsError("");

        if (ownerRequestIds.length === 0) {
          setOfferCountsByRequestId({});
          setAcceptedOfferByRequestId({});
        } else {
          const { data: ownerOfferRows, error: ownerOfferError } = await supabase
            .from("offers")
            .select("id, request_id, proposed_price_gbp, status")
            .in("request_id", ownerRequestIds);

          if (ownerOfferError) {
            setOfferCountsByRequestId({});
            setAcceptedOfferByRequestId({});
          } else {
            const counts = {};
            const acceptedMap = {};

            for (const row of ownerOfferRows ?? []) {
              counts[row.request_id] = (counts[row.request_id] || 0) + 1;

              if (row.status === "accepted") {
                acceptedMap[row.request_id] = row;
              }
            }

            setOfferCountsByRequestId(counts);
            setAcceptedOfferByRequestId(acceptedMap);
          }
        }
      }

      if (unreadError) {
        setUnreadCountsByRequestId({});
      } else {
        const safeUnreadRows = unreadRows ?? [];
        const unreadMap = {};

        for (const row of safeUnreadRows) {
          unreadMap[row.request_id] = Number(row.unread_count || 0);
        }

        setUnreadCountsByRequestId(unreadMap);
      }

      const safeOffers = offerRows ?? [];

      if (offerError) {
        setOffers([]);
        setOffersError(offerError.message);
        setRequestsById({});
        await loadBookingsForRequestIds(ownerRequestIds);
        setLoading(false);
        return;
      }

      setOffers(safeOffers);
      setOffersError("");

      const requestIds = [
        ...new Set(safeOffers.map((offer) => offer.request_id).filter(Boolean)),
      ];

      if (requestIds.length === 0) {
        setRequestsById({});
        await loadBookingsForRequestIds(ownerRequestIds);
        setLoading(false);
        return;
      }

      const { data: relatedRequestRows, error: relatedRequestsError } = await supabase
        .from("care_requests")
        .select("id, title, postcode, start_date, end_date, status")
        .in("id", requestIds);

      if (relatedRequestsError) {
        setRequestsById({});
        setOffersError(relatedRequestsError.message);
        await loadBookingsForRequestIds(ownerRequestIds);
        setLoading(false);
        return;
      }

      const requestMap = {};
      for (const row of relatedRequestRows ?? []) {
        requestMap[row.id] = row;
      }

      setRequestsById(requestMap);
      await loadBookingsForRequestIds([...ownerRequestIds, ...requestIds]);
      setLoading(false);
    }

    load();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function bookAndPay(offerId, requestId) {
    setPayingOfferId(offerId);
    setPaymentErrorByRequestId((prev) => ({
      ...prev,
      [requestId]: "",
    }));

    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    if (!token) {
      setPaymentErrorByRequestId((prev) => ({
        ...prev,
        [requestId]: "Not logged in.",
      }));
      setPayingOfferId("");
      return;
    }

    try {
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
        setPaymentErrorByRequestId((prev) => ({
          ...prev,
          [requestId]: json.error || "Failed to create checkout session",
        }));
        setPayingOfferId("");
        return;
      }

      window.location.assign(json.url);
    } catch (error) {
      setPaymentErrorByRequestId((prev) => ({
        ...prev,
        [requestId]: "Something went wrong starting checkout.",
      }));
      setPayingOfferId("");
    }
  }

  const liveOwnerRequests = requests.filter((request) => {
    const booking = bookingByRequestId[request.id];
    return request.status === "accepted" && booking?.status !== "completed";
  });

  const liveGardenerOffers = offers.filter((offer) => {
    const request = requestsById[offer.request_id];
    const booking = bookingByRequestId[offer.request_id];
    return (
      offer.status === "accepted" &&
      request?.status === "accepted" &&
      booking?.status !== "completed"
    );
  });

  const filteredRequests = requests.filter((request) => {
    if (requestFilter === "all") return true;
    if (requestFilter === "completed") {
      return (
        request.status === "completed" ||
        bookingByRequestId[request.id]?.status === "completed"
      );
    }
    if (requestFilter === "accepted") {
      return (
        request.status === "accepted" &&
        bookingByRequestId[request.id]?.status !== "completed"
      );
    }
    return request.status === requestFilter;
  });

  const filteredOffers = offers.filter((offer) => {
    if (offerFilter === "all") return true;
    return offer.status === offerFilter;
  });

  const displayName =
    profile?.full_name?.trim() || email.split("@")[0] || "there";

  const totalUnreadCount = Object.values(unreadCountsByRequestId).reduce(
    (sum, count) => sum + Number(count || 0),
    0
  );

  const openRequestsCount = requests.filter(
    (request) => request.status === "open"
  ).length;

  const completedRequestsCount = requests.filter((request) => {
    return (
      request.status === "completed" ||
      bookingByRequestId[request.id]?.status === "completed"
    );
  }).length;

  const closedRequestsCount = requests.filter(
    (request) => request.status === "closed"
  ).length;

  const pendingOffersCount = offers.filter(
    (offer) => offer.status === "pending"
  ).length;

  const payoutConnected = Boolean(profile?.stripe_onboarding_complete);
  const profileReady = Boolean(profile?.full_name?.trim());

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
            <p className="text-sm text-zinc-500">Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/60 p-8 text-zinc-900 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-900/70">
                Watch My Plot
              </p>

              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                Welcome back, {displayName}
              </h1>

              <p className="mt-3 max-w-2xl text-sm text-zinc-600">
                This is your Watch My Plot home base for both sides of the community:
                post requests, track offers, jump into chats, and keep your profile and payout setup in order.
              </p>

              <p className="mt-3 text-sm text-zinc-500">Logged in as: {email}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/requests"
                  className="inline-block rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800"
                >
                  Browse requests
                </Link>

                <Link
                  href="/requests/new"
                  className="inline-block rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
                >
                  Post a request
                </Link>

                <Link
                  href="/profile"
                  className="inline-block rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
                >
                  Edit profile
                </Link>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-emerald-100 bg-white/80 p-5 shadow-sm backdrop-blur">
              <p className="text-sm font-medium text-zinc-900">
                Profile and payouts
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                Keep both your public profile and payout setup in good shape so owners can book you confidently.
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Public profile</p>
                    <p className="text-xs text-zinc-500">
                      {profileReady ? "Basic profile details added" : "Add your name and details"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${
                      profileReady
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {profileReady ? "Ready" : "Needs work"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">Payout setup</p>
                    <p className="text-xs text-zinc-500">
                      {payoutConnected ? "Stripe payouts connected" : "Finish Stripe payout setup"}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-2 py-1 text-xs font-medium ${
                      payoutConnected
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {payoutConnected ? "Connected" : "Needed"}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/profile"
                  className="inline-block rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800"
                >
                  Manage profile
                </Link>

                <Link
                  href={`/users/${userId}`}
                  className="inline-block rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
                >
                  View public profile
                </Link>
              </div>

              {profileError && (
                <p className="mt-3 text-sm text-amber-700">
                  Could not load profile status: {profileError}
                </p>
              )}
            </div>
          </div>
        </section>



                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-6 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-emerald-800/70">
              Owner side
            </p>
            <p className="mt-3 text-sm text-zinc-500">Your requests</p>
            <p className="mt-2 text-3xl font-semibold">{requests.length}</p>
            <p className="mt-2 text-sm text-zinc-600">
              {openRequestsCount} open • {liveOwnerRequests.length} live •{" "}
              {completedRequestsCount} completed • {closedRequestsCount} closed
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-sky-100 bg-white p-6 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-sky-800/70">
              Gardener side
            </p>
            <p className="mt-3 text-sm text-zinc-500">Your offers</p>
            <p className="mt-2 text-3xl font-semibold">{offers.length}</p>
            <p className="mt-2 text-sm text-zinc-600">
              {pendingOffersCount} pending • {liveGardenerOffers.length} live
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-amber-100 bg-white p-6 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-amber-800/70">
              In progress
            </p>
            <p className="mt-3 text-sm text-zinc-500">Live work</p>
            <p className="mt-2 text-3xl font-semibold">
              {liveOwnerRequests.length + liveGardenerOffers.length}
            </p>
            <p className="mt-2 text-sm text-zinc-600">
              Accepted, payment-pending, or paid jobs currently in progress.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
              Messages
            </p>
            <p className="mt-3 text-sm text-zinc-500">Unread chats</p>
            <p className="mt-2 text-3xl font-semibold">{totalUnreadCount}</p>
            <p className="mt-2 text-sm text-zinc-600">
              Messages waiting across your active requests and jobs.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-8 text-zinc-900 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Live work</h2>
            <p className="text-sm text-zinc-600">
              Jobs and active chats that still need attention.
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Requests needing action
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Accepted, payment-pending, or paid requests that still need your attention.
                  </p>
                </div>

                <div className="text-sm text-zinc-500">
                  {liveOwnerRequests.length}{" "}
                  {liveOwnerRequests.length === 1 ? "request" : "requests"}
                </div>
              </div>

              {liveOwnerRequests.length === 0 ? (
                <div className="mt-4 rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50 p-4">
                  <p className="text-sm font-medium text-zinc-700">
                    No live requests need action.
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    When someone accepts one of your offers, it will appear here for quick access.
                  </p>
                  <Link
                    href="/requests/new"
                    className="mt-3 inline-block rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-100"
                  >
                    Post a request
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {liveOwnerRequests.map((request) => {
                    const unreadCount =
                      unreadCountsByRequestId[request.id] ?? 0;
                    const acceptedOffer =
                      acceptedOfferByRequestId[request.id] ?? null;
                    const booking = bookingByRequestId[request.id] ?? null;
                    const canBookAndPay =
                      acceptedOffer &&
                      (!booking || booking.status === "pending_payment");
                    const paymentError =
                      paymentErrorByRequestId[request.id] ?? "";

                    return (
                      <div
                        key={request.id}
                        className="rounded-2xl border border-zinc-200 p-4"
                      >
                        <h4 className="text-base font-semibold text-zinc-900">
                          {request.title}
                        </h4>

                        <p className="mt-1 text-sm text-zinc-600">
                          {request.postcode || "No postcode"} •{" "}
                          {formatDateRange(request.start_date, request.end_date)}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getBookingStatusBadgeClass(
                              booking?.status,
                              request.status
                            )}`}
                          >
                            {getBookingStatusLabel(booking?.status, request.status)}
                          </span>

                          {booking && (
                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-medium ${getPayoutStatusBadgeClass(
                                booking.payout_status
                              )}`}
                            >
                              {getPayoutStatusLabel(booking.payout_status)}
                            </span>
                          )}

                          <span>{formatPrice(request.price_offered_gbp) || "No price"}</span>
                          <span>•</span>
                          <span>{unreadCount} unread</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/requests/${request.id}/chat`}
                            className="inline-block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                          >
                            Open chat
                          </Link>

                          {canBookAndPay && (
                            <button
                              onClick={() => bookAndPay(acceptedOffer.id, request.id)}
                              disabled={payingOfferId === acceptedOffer.id}
                              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {payingOfferId === acceptedOffer.id
                                ? "Creating checkout..."
                                : "Book and pay"}
                            </button>
                          )}

                          {paymentError && (
                            <p className="mt-3 text-sm text-red-600">
                              {paymentError}
                            </p>
                          )}

                          <Link
                            href={`/requests/${request.id}`}
                            className="inline-block rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
                          >
                            View request
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Live jobs
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Jobs you’ve won as a gardener that are not completed yet.
                  </p>
                </div>

                <div className="text-sm text-zinc-500">
                  {liveGardenerOffers.length}{" "}
                  {liveGardenerOffers.length === 1 ? "job" : "jobs"}
                </div>
              </div>

              {liveGardenerOffers.length === 0 ? (
                <div className="mt-4 rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50 p-4">
                  <p className="text-sm font-medium text-zinc-700">
                    No live jobs yet.
                  </p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Accepted gardening jobs will show here so you can jump straight into live work.
                  </p>
                  <Link
                    href="/requests"
                    className="mt-3 inline-block rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-100"
                  >
                    Browse requests
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {liveGardenerOffers.map((offer) => {
                    const request = requestsById[offer.request_id];
                    const booking = bookingByRequestId[offer.request_id] ?? null;
                    const unreadCount =
                      unreadCountsByRequestId[offer.request_id] ?? 0;

                    return (
                      <div
                        key={offer.id}
                        className="rounded-2xl border border-zinc-200 p-4"
                      >
                        <h4 className="text-base font-semibold text-zinc-900">
                          {request?.title || "Request"}
                        </h4>

                        <p className="mt-1 text-sm text-zinc-600">
                          {request?.postcode || "No postcode"} •{" "}
                          {formatDateRange(
                            request?.start_date,
                            request?.end_date
                          )}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getBookingStatusBadgeClass(
                              booking?.status,
                              request?.status
                            )}`}
                          >
                            {getBookingStatusLabel(booking?.status, request?.status)}
                          </span>

                          {booking && (
                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-medium ${getPayoutStatusBadgeClass(
                                booking.payout_status
                              )}`}
                            >
                              {getPayoutStatusLabel(booking.payout_status)}
                            </span>
                          )}

                          <span>
                            {offer.proposed_price_gbp != null
                              ? formatPrice(offer.proposed_price_gbp)
                              : "No price"}
                          </span>
                          <span>•</span>
                          <span>{unreadCount} unread</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            href={`/requests/${offer.request_id}/chat`}
                            className="inline-block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                          >
                            Open chat
                          </Link>

                          <Link
                            href={`/requests/${offer.request_id}`}
                            className="inline-block rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
                          >
                            View request
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-8 text-zinc-900 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your requests</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Requests you’ve posted as an owner.
                </p>
              </div>

              <div className="text-sm text-zinc-500">
                {filteredRequests.length}{" "}
                {filteredRequests.length === 1 ? "request" : "requests"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRequestFilter("all")}
                className={`rounded-full border px-3 py-1 text-sm ${requestFilter === "all"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                  }`}
              >
                All
              </button>

              <button
                onClick={() => setRequestFilter("open")}
                className={`rounded-full border px-3 py-1 text-sm ${requestFilter === "open"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                  }`}
              >
                Open
              </button>

              <button
                onClick={() => setRequestFilter("accepted")}
                className={`rounded-full border px-3 py-1 text-sm ${requestFilter === "accepted"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                  }`}
              >
                Accepted
              </button>

              <button
                onClick={() => setRequestFilter("completed")}
                className={`rounded-full border px-3 py-1 text-sm ${requestFilter === "completed"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                  }`}
              >
                Completed
              </button>

              <button
                onClick={() => setRequestFilter("closed")}
                className={`rounded-full border px-3 py-1 text-sm ${requestFilter === "closed"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                  }`}
              >
                Closed
              </button>
            </div>
          </div>

          {requestsError ? (
            <p className="mt-6 text-sm text-red-600">
              Could not load your requests: {requestsError}
            </p>
          ) : filteredRequests.length === 0 ? (
            <div className="mt-6 rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50 p-6">
              <p className="text-sm font-medium text-zinc-700">
                No requests match this filter.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Try another status or post a new request to get work started.
              </p>
              <Link
                href="/requests/new"
                className="mt-4 inline-block rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Post a request
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredRequests.map((request) => {
                const requestTags = buildRequestTags(request);
                const offerCount = offerCountsByRequestId[request.id] ?? 0;
                const unreadCount = unreadCountsByRequestId[request.id] ?? 0;
                const booking = bookingByRequestId[request.id] ?? null;

                return (
                  <div
                    key={request.id}
                    className="rounded-[1.5rem] border border-stone-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          {request.title}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-600">
                          {request.postcode || "No postcode"} •{" "}
                          {formatDateRange(request.start_date, request.end_date)}
                        </p>

                        <div className="mt-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getBookingStatusBadgeClass(
                              booking?.status,
                              request.status
                            )}`}
                          >
                            {getBookingStatusLabel(booking?.status, request.status)}
                          </span>

                          {booking && (
                            <span
                              className={`ml-2 rounded-full border px-2 py-1 text-xs font-medium ${getPayoutStatusBadgeClass(
                                booking.payout_status
                              )}`}
                            >
                              {getPayoutStatusLabel(booking.payout_status)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-sm font-medium text-zinc-700">
                          {formatPrice(request.price_offered_gbp) || "No price"}
                        </div>

                        <div className="mt-1 text-sm text-zinc-500">
                          {offerCount} {offerCount === 1 ? "offer" : "offers"}
                        </div>

                        {request.status === "accepted" && (
                          <div className="mt-1 text-sm text-zinc-500">
                            {unreadCount} unread
                          </div>
                        )}
                      </div>
                    </div>

                    {requestTags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {requestTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-zinc-200 px-2 py-1 text-xs text-zinc-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/requests/${request.id}`}
                        className="inline-block rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
                      >
                        View request
                      </Link>

                      {request.status === "open" && (
                        <Link
                          href={`/requests/${request.id}/edit`}
                          className="inline-block rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
                        >
                          Edit request
                        </Link>
                      )}

                      {request.status === "closed" && (
                        <Link
                          href={`/requests/${request.id}`}
                          className="inline-block rounded-xl border border-emerald-300 px-4 py-2 text-sm font-medium text-emerald-700"
                        >
                          Reopen request
                        </Link>
                      )}

                      {request.status === "accepted" && (
                        <Link
                          href={`/requests/${request.id}/chat`}
                          className="inline-block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                        >
                          Open chat
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-8 text-zinc-900 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your offers</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Offers you’ve sent as a gardener.
                </p>
              </div>

              <div className="text-sm text-zinc-500">
                {filteredOffers.length}{" "}
                {filteredOffers.length === 1 ? "offer" : "offers"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setOfferFilter("all")}
                className={`rounded-full border px-3 py-1 text-sm ${offerFilter === "all"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                  }`}
              >
                All
              </button>

              <button
                onClick={() => setOfferFilter("pending")}
                className={`rounded-full border px-3 py-1 text-sm ${offerFilter === "pending"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                  }`}
              >
                Pending
              </button>

              <button
                onClick={() => setOfferFilter("accepted")}
                className={`rounded-full border px-3 py-1 text-sm ${offerFilter === "accepted"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                  }`}
              >
                Accepted
              </button>

              <button
                onClick={() => setOfferFilter("rejected")}
                className={`rounded-full border px-3 py-1 text-sm ${offerFilter === "rejected"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                  }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {offersError ? (
            <p className="mt-6 text-sm text-red-600">
              Could not load your offers: {offersError}
            </p>
          ) : filteredOffers.length === 0 ? (
            <div className="mt-6 rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50 p-6">
              <p className="text-sm font-medium text-zinc-700">
                No offers match this filter.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Try another status or browse requests and send a new offer.
              </p>
              <Link
                href="/requests"
                className="mt-4 inline-block rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Browse requests
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredOffers.map((offer) => {
                const request = requestsById[offer.request_id];
                const booking = bookingByRequestId[offer.request_id] ?? null;
                const unreadCount = unreadCountsByRequestId[offer.request_id] ?? 0;

                return (
                  <div
                    key={offer.id}
                    className="rounded-[1.5rem] border border-stone-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-900">
                          {request?.title || "Request"}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-600">
                          {request?.postcode || "No postcode"} •{" "}
                          {formatDateRange(request?.start_date, request?.end_date)}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getOfferStatusBadgeClass(
                              offer.status
                            )}`}
                          >
                            {getStatusLabel(offer.status)}
                          </span>

                          {offer.proposed_price_gbp != null && (
                            <span className="text-sm text-zinc-600">
                              {formatPrice(offer.proposed_price_gbp)}
                            </span>
                          )}

                          {request?.status && (
                            <span className="text-sm text-zinc-500">
                              Request: {getBookingStatusLabel(booking?.status, request.status)}
                            </span>
                          )}

                          {booking && (
                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-medium ${getPayoutStatusBadgeClass(
                                booking.payout_status
                              )}`}
                            >
                              {getPayoutStatusLabel(booking.payout_status)}
                            </span>
                          )}

                          {request?.status === "accepted" && (
                            <span className="text-sm text-zinc-500">
                              {unreadCount} unread
                            </span>
                          )}
                        </div>

                        {offer.message && (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-700">
                            {offer.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/requests/${offer.request_id}`}
                          className="inline-block rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
                        >
                          View request
                        </Link>

                        {request?.status === "accepted" && offer.status === "accepted" && (
                          <Link
                            href={`/requests/${offer.request_id}/chat`}
                            className="inline-block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                          >
                            Open chat
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>


        <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-8 text-zinc-900 shadow-[0_12px_35px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Quick links</h2>
            <p className="text-sm text-zinc-600">
              A few useful shortcuts for keeping your account in good shape.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-stone-200 p-5">
              <h3 className="text-base font-semibold">Profile and payouts</h3>
              <p className="mt-2 text-sm text-zinc-600">
                {payoutConnected
                  ? "Your payout setup is connected and ready."
                  : "Finish your profile and payout setup before taking on paid work."}
              </p>

              <Link
                href="/profile"
                className="mt-4 inline-block rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Manage profile
              </Link>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 p-5">
              <h3 className="text-base font-semibold">Your public profile</h3>
              <p className="mt-2 text-sm text-zinc-600">
                See your profile the same way owners and gardeners will see it.
              </p>

              <Link
                href={`/users/${userId}`}
                className="mt-4 inline-block rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
              >
                View public profile
              </Link>
            </div>

            <div className="rounded-[1.5rem] border border-stone-200 p-5">
              <h3 className="text-base font-semibold">Account</h3>
              <p className="mt-2 text-sm text-zinc-600">
                Sign out securely when you’re done.
              </p>

              <button
                onClick={logout}
                className="mt-4 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
              >
                Log out
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
