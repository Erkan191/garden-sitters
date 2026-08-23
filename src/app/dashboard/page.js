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

const primaryButtonClass =
  "inline-flex justify-center rounded-xl bg-emerald-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800";
const secondaryButtonClass =
  "inline-flex justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50";

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

function EmptyState({ title, children, href, actionLabel }) {
  return (
    <div className="mt-4 rounded-[1.25rem] border border-dashed border-stone-300 bg-stone-50 p-5">
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{children}</p>
      {href && actionLabel && (
        <Link href={href} className={`mt-4 ${primaryButtonClass}`}>
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function ErrorState({ title = "We couldn't load this just now.", message }) {
  return (
    <div className="mt-6 rounded-[1.25rem] border border-red-100 bg-red-50 p-5 text-sm leading-6 text-red-800">
      <p className="font-medium">{title}</p>
      <p className="mt-1">{friendlyError(message)}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-50"
      >
        Retry
      </button>
    </div>
  );
}

function ActionCard({
  title,
  children,
  href,
  actionLabel,
  onClick,
  disabled = false,
  srActionText = "",
}) {
  return (
    <div className="rounded-[1.25rem] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{children}</p>

      {href && actionLabel && (
        <Link href={href} className={`mt-4 w-full sm:w-auto ${primaryButtonClass}`}>
          {actionLabel}
        </Link>
      )}

      {onClick && actionLabel && (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`mt-4 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${primaryButtonClass}`}
        >
          {actionLabel}
          {srActionText && <span className="sr-only">{srActionText}</span>}
        </button>
      )}
    </div>
  );
}

function filterButtonClass(active) {
  return `rounded-full border px-3 py-1 text-sm font-medium ${
    active
      ? "border-emerald-900 bg-emerald-900 text-white"
      : "border-stone-300 bg-white text-zinc-700 hover:bg-stone-50"
  }`;
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
  const requestsAwaitingOffers = requests.filter(
    (request) =>
      request.status === "open" && (offerCountsByRequestId[request.id] ?? 0) === 0
  );
  const requestsWithOffers = requests.filter(
    (request) =>
      request.status === "open" && (offerCountsByRequestId[request.id] ?? 0) > 0
  );
  const bookingsNeedingPayment = liveOwnerRequests.filter((request) => {
    const acceptedOffer = acceptedOfferByRequestId[request.id] ?? null;
    const booking = bookingByRequestId[request.id] ?? null;

    return acceptedOffer && (!booking || booking.status === "pending_payment");
  });
  const jobsAwaitingCompletion = liveOwnerRequests.filter((request) => {
    const booking = bookingByRequestId[request.id] ?? null;

    return booking?.status === "paid";
  });
  const setupNeeds = [
    !profileReady && {
      title: "Complete your public profile",
      body: "Add your name and basic details so owners and gardeners know who they are dealing with.",
      href: "/profile",
      actionLabel: "Complete profile",
    },
    !payoutConnected && {
      title: "Payout setup needed",
      body: "Connect Stripe payouts before owners can confidently accept you for paid work.",
      href: "/profile",
      actionLabel: "Set up payouts",
    },
  ].filter(Boolean);
  const hasActionNeeded =
    setupNeeds.length > 0 ||
    requestsWithOffers.length > 0 ||
    bookingsNeedingPayment.length > 0 ||
    jobsAwaitingCompletion.length > 0 ||
    liveGardenerOffers.length > 0 ||
    totalUnreadCount > 0;

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
                  Browse jobs
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
                <p className="mt-3 text-sm leading-6 text-amber-700">
                  {friendlyError(profileError)}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white/95 p-6 text-zinc-900 shadow-[0_12px_35px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Start here
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Needs your attention</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                These are the account, owner, and gardener tasks most likely to
                need a decision before the next booking can move forward.
              </p>
            </div>

            <Link
              href="/requests/new"
              className={`w-full sm:w-auto ${secondaryButtonClass}`}
            >
              Post a request
            </Link>
          </div>

          {hasActionNeeded ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {setupNeeds.map((item) => (
                <ActionCard
                  key={item.title}
                  title={item.title}
                  href={item.href}
                  actionLabel={item.actionLabel}
                >
                  {item.body}
                </ActionCard>
              ))}

              {requestsWithOffers.slice(0, 3).map((request) => {
                const offerCount = offerCountsByRequestId[request.id] ?? 0;

                return (
                  <ActionCard
                    key={`review-${request.id}`}
                    title="Review offers"
                    href={`/requests/${request.id}#offers`}
                    actionLabel="Review offers"
                  >
                    {offerCount} {offerCount === 1 ? "offer" : "offers"} received
                    for {request.title}. Compare the gardeners before accepting one.
                  </ActionCard>
                );
              })}

              {bookingsNeedingPayment.slice(0, 3).map((request) => {
                const acceptedOffer = acceptedOfferByRequestId[request.id];

                return (
                  <ActionCard
                    key={`pay-${request.id}`}
                    title="Pay to confirm booking"
                    onClick={() => bookAndPay(acceptedOffer.id, request.id)}
                    disabled={payingOfferId === acceptedOffer.id}
                    actionLabel={
                      payingOfferId === acceptedOffer.id
                        ? "Creating checkout..."
                        : "Confirm booking and pay"
                    }
                    srActionText=" Book and pay"
                  >
                    Owner pays through Stripe. The gardener is not paid until
                    completion. Private beta issues and refunds are handled case by
                    case.
                  </ActionCard>
                );
              })}

              {jobsAwaitingCompletion.slice(0, 3).map((request) => {
                const booking = bookingByRequestId[request.id];

                return (
                  <ActionCard
                    key={`complete-${request.id}`}
                    title="Job awaiting completion"
                    href={booking?.id ? `/bookings/${booking.id}` : `/requests/${request.id}`}
                    actionLabel="Open booking"
                  >
                    {request.title} is paid and scheduled. Open the booking when
                    the garden care is finished so completion can be recorded.
                  </ActionCard>
                );
              })}

              {liveGardenerOffers.slice(0, 3).map((offer) => {
                const request = requestsById[offer.request_id];

                return (
                  <ActionCard
                    key={`job-${offer.id}`}
                    title="Upcoming garden job"
                    href={`/requests/${offer.request_id}/chat`}
                    actionLabel="Open chat"
                  >
                    You have been accepted for {request?.title || "this request"}.
                    Agree the final access details and care instructions before the
                    visit.
                  </ActionCard>
                );
              })}

              {totalUnreadCount > 0 && (
                <ActionCard
                  title="Unread messages"
                  href="#live-work"
                  actionLabel="Open live work"
                >
                  You have {totalUnreadCount} unread{" "}
                  {totalUnreadCount === 1 ? "message" : "messages"} across active
                  requests and jobs.
                </ActionCard>
              )}
            </div>
          ) : (
            <EmptyState
              title="Nothing urgent right now."
              href="/requests/new"
              actionLabel="Post a request"
            >
              Post a request, browse jobs, or keep your profile ready for the next
              booking.
            </EmptyState>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                Requests awaiting offers
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {requestsAwaitingOffers.length}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                Offers received
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {requestsWithOffers.length}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                Bookings needing payment
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {bookingsNeedingPayment.length}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                Upcoming jobs
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {liveGardenerOffers.length}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.5rem] border border-emerald-100 bg-white p-6 text-zinc-900 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-emerald-800/70">
              Your owner dashboard
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
              Your gardener dashboard
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

        <section
          id="live-work"
          className="rounded-[2rem] border border-stone-200 bg-white/95 p-8 text-zinc-900 shadow-[0_12px_35px_rgba(0,0,0,0.06)]"
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">What happens next</h2>
            <p className="text-sm text-zinc-600">
              Active owner requests and gardener jobs, with the next practical step.
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
                    Accepted owner requests will appear here after you choose a
                    gardener. If payment is still needed, this section will show
                    the next step.
                  </p>
                  <Link
                    href="/requests/new"
                    className={`mt-3 w-full sm:w-auto ${primaryButtonClass}`}
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
                            className={`w-full sm:w-auto ${primaryButtonClass}`}
                          >
                            Open chat
                          </Link>

                          {canBookAndPay && (
                            <div className="w-full rounded-[1rem] border border-emerald-100 bg-emerald-50/70 p-3 sm:max-w-md">
                              <p className="text-sm leading-6 text-emerald-950">
                                Owner pays through Stripe. The gardener is not paid
                                until completion. Private beta issues and refunds
                                are handled case by case.
                              </p>
                              <button
                                type="button"
                                onClick={() => bookAndPay(acceptedOffer.id, request.id)}
                                disabled={payingOfferId === acceptedOffer.id}
                                className={`mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${primaryButtonClass}`}
                              >
                                {payingOfferId === acceptedOffer.id
                                  ? "Creating checkout..."
                                  : "Confirm booking and pay"}
                                <span className="sr-only"> Book and pay</span>
                              </button>
                            </div>
                          )}

                          {paymentError && (
                            <p className="mt-3 text-sm text-red-600">
                              {paymentError}
                            </p>
                          )}

                          <Link
                            href={`/requests/${request.id}`}
                            className={`w-full sm:w-auto ${secondaryButtonClass}`}
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
                    Jobs you win as a gardener will appear here once an owner
                    accepts your offer.
                  </p>
                  <Link
                    href="/requests"
                    className={`mt-3 w-full sm:w-auto ${primaryButtonClass}`}
                  >
                    Browse jobs
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
                            className={`w-full sm:w-auto ${primaryButtonClass}`}
                          >
                            Open chat
                          </Link>

                          <Link
                            href={`/requests/${offer.request_id}`}
                            className={`w-full sm:w-auto ${secondaryButtonClass}`}
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
                className={filterButtonClass(requestFilter === "all")}
              >
                All
              </button>

              <button
                onClick={() => setRequestFilter("open")}
                className={filterButtonClass(requestFilter === "open")}
              >
                Open
              </button>

              <button
                onClick={() => setRequestFilter("accepted")}
                className={filterButtonClass(requestFilter === "accepted")}
              >
                Accepted
              </button>

              <button
                onClick={() => setRequestFilter("completed")}
                className={filterButtonClass(requestFilter === "completed")}
              >
                Completed
              </button>

              <button
                onClick={() => setRequestFilter("closed")}
                className={filterButtonClass(requestFilter === "closed")}
              >
                Closed
              </button>
            </div>
          </div>

          {requestsError ? (
            <ErrorState title="Could not load your requests." message={requestsError} />
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title={
                requests.length === 0
                  ? "No requests yet"
                  : "No requests match this filter."
              }
              href="/requests/new"
              actionLabel="Post a request"
            >
              {requests.length === 0
                ? "Post your first garden care request."
                : "Try another status or post a new request to get work started."}
            </EmptyState>
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
                        className={`w-full sm:w-auto ${secondaryButtonClass}`}
                      >
                        View request
                      </Link>

                      {request.status === "open" && (
                        <Link
                          href={`/requests/${request.id}/edit`}
                          className={`w-full sm:w-auto ${secondaryButtonClass}`}
                        >
                          Edit request
                        </Link>
                      )}

                      {request.status === "closed" && (
                        <Link
                          href={`/requests/${request.id}`}
                          className={`w-full sm:w-auto ${secondaryButtonClass}`}
                        >
                          Reopen request
                        </Link>
                      )}

                      {request.status === "accepted" && (
                        <Link
                          href={`/requests/${request.id}/chat`}
                          className={`w-full sm:w-auto ${primaryButtonClass}`}
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
                className={filterButtonClass(offerFilter === "all")}
              >
                All
              </button>

              <button
                onClick={() => setOfferFilter("pending")}
                className={filterButtonClass(offerFilter === "pending")}
              >
                Pending
              </button>

              <button
                onClick={() => setOfferFilter("accepted")}
                className={filterButtonClass(offerFilter === "accepted")}
              >
                Accepted
              </button>

              <button
                onClick={() => setOfferFilter("rejected")}
                className={filterButtonClass(offerFilter === "rejected")}
              >
                Rejected
              </button>
            </div>
          </div>

          {offersError ? (
            <ErrorState title="Could not load your offers." message={offersError} />
          ) : filteredOffers.length === 0 ? (
            <EmptyState
              title={
                offers.length === 0 ? "No offers yet" : "No offers match this filter."
              }
              href="/requests"
              actionLabel="Browse jobs"
            >
              {offers.length === 0
                ? "Browse garden jobs and send a practical offer when you find a good fit."
                : "Try another status or browse jobs and send a new offer."}
            </EmptyState>
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
                          className={`w-full sm:w-auto ${secondaryButtonClass}`}
                        >
                          View request
                        </Link>

                        {request?.status === "accepted" && offer.status === "accepted" && (
                          <Link
                            href={`/requests/${offer.request_id}/chat`}
                            className={`w-full sm:w-auto ${primaryButtonClass}`}
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
