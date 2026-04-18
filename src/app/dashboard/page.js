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

function getOfferStatusBadgeClass(status) {
  if (status === "pending") return "bg-gray-100 text-gray-700 border-gray-200";
  if (status === "accepted") return "bg-green-100 text-green-800 border-green-200";
  if (status === "rejected") return "bg-red-100 text-red-800 border-red-200";
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

    const [requests, setRequests] = useState([]);
  const [requestsError, setRequestsError] = useState("");
  const [offerCountsByRequestId, setOfferCountsByRequestId] = useState({});
  const [acceptedOfferByRequestId, setAcceptedOfferByRequestId] = useState({});
  const [unreadCountsByRequestId, setUnreadCountsByRequestId] = useState({});

  const [offers, setOffers] = useState([]);

  const [offersError, setOffersError] = useState("");
  const [requestsById, setRequestsById] = useState({});

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
      ]);

      const safeRequests = requestRows ?? [];

      if (requestError) {
        setRequests([]);
        setRequestsError(requestError.message);
        setOfferCountsByRequestId({});
      } else {
        setRequests(safeRequests);
        setRequestsError("");

        const ownerRequestIds = [
          ...new Set(safeRequests.map((request) => request.id).filter(Boolean)),
        ];

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
        setLoading(false);
        return;
      }

      const requestMap = {};
      for (const row of relatedRequestRows ?? []) {
        requestMap[row.id] = row;
      }

      setRequestsById(requestMap);
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

      window.location.href = json.url;
    } catch (error) {
      setPaymentErrorByRequestId((prev) => ({
        ...prev,
        [requestId]: "Something went wrong starting checkout.",
      }));
      setPayingOfferId("");
    }
  }

  const acceptedOwnerRequests = requests.filter(
    (request) => request.status === "accepted"
  );

  const acceptedGardenerOffers = offers.filter((offer) => {
    const request = requestsById[offer.request_id];
    return offer.status === "accepted" && request?.status === "accepted";
  });

  const filteredRequests = requests.filter((request) => {
    if (requestFilter === "all") return true;
    return request.status === requestFilter;
  });

  const filteredOffers = offers.filter((offer) => {
    if (offerFilter === "all") return true;
    return offer.status === offerFilter;
  });

  if (loading) {
    return (
      <main className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
            <p className="text-sm text-zinc-500">Loading dashboard...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Welcome back
          </h1>

          <p className="mt-3 text-sm text-zinc-600">Logged in as: {email}</p>
        </section>

        

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <h2 className="text-lg font-semibold">Browse care requests</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Look through live requests and find jobs that suit your skills.
            </p>

            <Link
              href="/requests"
              className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Open requests
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <h2 className="text-lg font-semibold">Your public profile</h2>
            <p className="mt-2 text-sm text-zinc-600">
              See how owners will view your profile, reviews, and trust signals.
            </p>

            <Link
              href={`/users/${userId}`}
              className="mt-4 inline-block rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
            >
              View profile
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <h2 className="text-lg font-semibold">Create a request</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Post a new care request for your garden, veg beds, greenhouse, or pots.
            </p>

            <Link
              href="/requests/new"
              className="mt-4 inline-block rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Post a request
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm">
            <h2 className="text-lg font-semibold">Account</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Sign out securely when you’re done.
            </p>

            <button
              onClick={logout}
              className="mt-4 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900"
            >
              Log out
            </button>
          </div>
        </section>

                <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold">Live work</h2>
            <p className="text-sm text-zinc-600">
              Accepted jobs and active chats that need attention.
            </p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Accepted requests
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Requests you own that are now live.
                  </p>
                </div>

                <div className="text-sm text-zinc-500">
                  {acceptedOwnerRequests.length}{" "}
                  {acceptedOwnerRequests.length === 1 ? "request" : "requests"}
                </div>
              </div>

              {acceptedOwnerRequests.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4">
                  <p className="text-sm text-zinc-600">
                    No accepted requests yet.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {acceptedOwnerRequests.map((request) => {
                    const unreadCount =
                      unreadCountsByRequestId[request.id] ?? 0;
                    const acceptedOffer =
                      acceptedOfferByRequestId[request.id] ?? null;
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

                          {acceptedOffer && (
                            <button
                              onClick={() => bookAndPay(acceptedOffer.id, request.id)}
                              disabled={payingOfferId === acceptedOffer.id}
                              className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {payingOfferId === acceptedOffer.id
                                ? "Creating checkout..."
                                : "Book & Pay"}
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

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    Accepted jobs
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">
                    Jobs you’ve won as a gardener.
                  </p>
                </div>

                <div className="text-sm text-zinc-500">
                  {acceptedGardenerOffers.length}{" "}
                  {acceptedGardenerOffers.length === 1 ? "job" : "jobs"}
                </div>
              </div>

              {acceptedGardenerOffers.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4">
                  <p className="text-sm text-zinc-600">
                    No accepted jobs yet.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {acceptedGardenerOffers.map((offer) => {
                    const request = requestsById[offer.request_id];
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

        <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
          
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
                className={`rounded-full border px-3 py-1 text-sm ${
                  requestFilter === "all"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setRequestFilter("open")}
                className={`rounded-full border px-3 py-1 text-sm ${
                  requestFilter === "open"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                Open
              </button>

              <button
                onClick={() => setRequestFilter("accepted")}
                className={`rounded-full border px-3 py-1 text-sm ${
                  requestFilter === "accepted"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                Accepted
              </button>

              <button
                onClick={() => setRequestFilter("completed")}
                className={`rounded-full border px-3 py-1 text-sm ${
                  requestFilter === "completed"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {requestsError ? (
            <p className="mt-6 text-sm text-red-600">
              Could not load your requests: {requestsError}
            </p>
          ) : filteredRequests.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-6">
              <p className="text-sm text-zinc-600">
                No requests match this filter.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Try another status or create a new request.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredRequests.map((request) => {
                const requestTags = buildRequestTags(request);
                const offerCount = offerCountsByRequestId[request.id] ?? 0;
                const unreadCount = unreadCountsByRequestId[request.id] ?? 0;

                return (
                  <div
                    key={request.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5"
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

                        <p className="mt-1 text-sm text-zinc-500">
                          Status: {getStatusLabel(request.status)}
                        </p>
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

        <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
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
                className={`rounded-full border px-3 py-1 text-sm ${
                  offerFilter === "all"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setOfferFilter("pending")}
                className={`rounded-full border px-3 py-1 text-sm ${
                  offerFilter === "pending"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                Pending
              </button>

              <button
                onClick={() => setOfferFilter("accepted")}
                className={`rounded-full border px-3 py-1 text-sm ${
                  offerFilter === "accepted"
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 text-zinc-700"
                }`}
              >
                Accepted
              </button>

              <button
                onClick={() => setOfferFilter("rejected")}
                className={`rounded-full border px-3 py-1 text-sm ${
                  offerFilter === "rejected"
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
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-6">
              <p className="text-sm text-zinc-600">
                No offers match this filter.
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Try another status or browse requests and send a new offer.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredOffers.map((offer) => {
                const request = requestsById[offer.request_id];
                const unreadCount = unreadCountsByRequestId[offer.request_id] ?? 0;

                return (
                  <div
                    key={offer.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5"
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
                              Request: {getStatusLabel(request.status)}
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


        <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
          <h2 className="text-xl font-semibold">What this page is for</h2>
          <p className="mt-3 max-w-3xl text-sm text-zinc-600">
            This is your signed-in home base. It now shows the requests you’ve
            posted and the offers you’ve sent, so both sides of the marketplace
            have a clear place to check their activity.
          </p>
        </section>
      </div>
    </main>
  );
}