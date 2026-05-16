"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function formatPrice(value) {
  if (value == null) return "Not set";
  return `£${Number(value).toFixed(0)}`;
}

function formatDateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function getStatusLabel(status) {
  if (!status) return "Unknown";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusBadgeClass(status) {
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

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [userId, setUserId] = useState(null);
  const [msg, setMsg] = useState("");

  const [reviews, setReviews] = useState([]);
  const [myReviewExists, setMyReviewExists] = useState(false);
  const [profilesById, setProfilesById] = useState({});
  const [completingBooking, setCompletingBooking] = useState(false);

  async function load() {
    setLoading(true);
    setMsg("");

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userErr || !user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data: bookingData, error: bookingErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (bookingErr) {
      setMsg(bookingErr.message);
      setLoading(false);
      return;
    }

    if (!bookingData) {
      setMsg("Booking not found.");
      setLoading(false);
      return;
    }

    setBooking(bookingData);

    const { data: reviewData, error: reviewErr } = await supabase
      .from("reviews")
      .select("id, booking_id, reviewer_id, reviewee_id, rating, comment, created_at")
      .eq("booking_id", id)
      .order("created_at", { ascending: false });

    if (reviewErr) {
      setMsg(reviewErr.message);
      setReviews([]);
      setMyReviewExists(false);
      setLoading(false);
      return;
    }

    const safeReviews = reviewData ?? [];
    setReviews(safeReviews);
    setMyReviewExists(safeReviews.some((r) => r.reviewer_id === user.id));

    const profileIds = [
      bookingData.owner_id,
      bookingData.gardener_id,
      ...safeReviews.map((r) => r.reviewer_id),
      ...safeReviews.map((r) => r.reviewee_id),
    ].filter(Boolean);

    const uniqueProfileIds = [...new Set(profileIds)];

    if (uniqueProfileIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", uniqueProfileIds);

      const map = {};

      for (const row of profileRows || []) {
        map[row.id] = row;
      }

      setProfilesById(map);
    } else {
      setProfilesById({});
    }

    setLoading(false);
  }

  useEffect(() => {
    if (id) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function completeAndPayGardener() {
    if (!booking?.id) return;

    setCompletingBooking(true);
    setMsg("Completing booking and releasing gardener payout...");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

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
      body: JSON.stringify({ bookingId: id }),
    });

    const json = await res.json();

    if (!res.ok) {
      setMsg(json.error || "Failed to complete booking and release payout.");
      setCompletingBooking(false);
      await load();
      return;
    }

    setMsg("Booking completed and gardener payout triggered ✅");
    setCompletingBooking(false);
    await load();
  }

  const isOwner = booking && userId && booking.owner_id === userId;
  const isGardener = booking && userId && booking.gardener_id === userId;
  const isParticipant = booking && userId && (isOwner || isGardener);

  const ownerName =
    profilesById[booking?.owner_id]?.full_name?.trim() || "Owner";

  const gardenerName =
    profilesById[booking?.gardener_id]?.full_name?.trim() || "Gardener";

  const bookingStatusLabel = getStatusLabel(booking?.status);
  const bookingStatusBadgeClass = getStatusBadgeClass(booking?.status);

  const payoutStatus = booking?.payout_status || "not_started";
  const payoutStatusLabel = getStatusLabel(payoutStatus);
  const payoutStatusBadgeClass = getPayoutStatusBadgeClass(payoutStatus);

  const canCompleteAndPay =
    booking &&
    isOwner &&
    booking.status === "paid" &&
    !booking.stripe_transfer_id;

  const canLeaveReview =
    booking &&
    isParticipant &&
    booking.status === "completed" &&
    !myReviewExists;

  let reviewMessage = "";

  if (booking) {
    if (!isParticipant) {
      reviewMessage = "Only the owner or gardener on this booking can leave a review.";
    } else if (booking.status !== "completed") {
      reviewMessage =
        "Reviews unlock once the booking has been completed.";
    } else if (myReviewExists) {
      reviewMessage = "You have already left a review for this booking.";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-stone-200 bg-white p-6 text-sm text-zinc-600 shadow-sm">
          Loading booking...
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-900">
        <div className="mx-auto max-w-6xl rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <p className="font-medium text-zinc-900">Booking not found.</p>
          {msg && <p className="mt-2 text-sm text-zinc-600">{msg}</p>}

          <Link
            href="/bookings"
            className="mt-4 inline-flex rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
          >
            Back to bookings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link
          href="/bookings"
          className="inline-flex text-sm font-medium text-zinc-600 hover:text-emerald-900"
        >
          ← Back to bookings
        </Link>

        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-emerald-50/70 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.35fr] lg:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Booking
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Booking details and completion.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Track the booking status, return to the request chat, and once the
                garden care has been carried out, complete the booking to release the
                gardener payout.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-medium ${bookingStatusBadgeClass}`}
                >
                  Booking: {bookingStatusLabel}
                </span>

                <span
                  className={`rounded-full border px-2 py-1 text-xs font-medium ${payoutStatusBadgeClass}`}
                >
                  Payout: {payoutStatusLabel}
                </span>
              </div>
            </div>

            <aside className="rounded-[1.5rem] border border-emerald-100 bg-white/80 p-5 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Summary
              </p>

              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <p>
                  <span className="font-medium text-zinc-900">Amount:</span>{" "}
                  {formatPrice(booking.amount_gbp)}
                </p>

                <p>
                  <span className="font-medium text-zinc-900">Platform fee:</span>{" "}
                  {formatPrice(booking.platform_fee_gbp)}
                </p>

                {booking.created_at && (
                  <p>
                    <span className="font-medium text-zinc-900">Created:</span>{" "}
                    {formatDateTime(booking.created_at)}
                  </p>
                )}

                {booking.completed_at && (
                  <p>
                    <span className="font-medium text-zinc-900">Completed:</span>{" "}
                    {formatDateTime(booking.completed_at)}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </section>

        {msg && (
          <div className="rounded-[1.5rem] border border-stone-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
            {msg}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_0.38fr] lg:items-start">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                People
              </p>

              <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                Owner and gardener
              </h2>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-4">
                  <p className="text-sm text-zinc-500">Owner</p>
                  <Link
                    href={`/users/${booking.owner_id}`}
                    className="mt-1 inline-flex font-medium text-emerald-900 hover:underline"
                  >
                    {ownerName}
                  </Link>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-4">
                  <p className="text-sm text-zinc-500">Gardener</p>
                  <Link
                    href={`/users/${booking.gardener_id}`}
                    className="mt-1 inline-flex font-medium text-emerald-900 hover:underline"
                  >
                    {gardenerName}
                  </Link>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/requests/${booking.request_id}`}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
                >
                  View request
                </Link>

                <Link
                  href={`/requests/${booking.request_id}/chat`}
                  className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-stone-50"
                >
                  Open chat
                </Link>
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                    Reviews
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                    Booking reviews
                  </h2>
                </div>

                <p className="text-sm text-zinc-500">
                  {reviews.length} review{reviews.length === 1 ? "" : "s"}
                </p>
              </div>

              {reviews.length === 0 ? (
                <div className="mt-5 rounded-[1.5rem] border border-stone-200 bg-stone-50/70 p-5">
                  <p className="text-sm font-medium text-zinc-900">
                    No reviews yet.
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">
                    Reviews unlock once the booking is completed.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {reviews.map((review) => {
                    const reviewerName =
                      profilesById[review.reviewer_id]?.full_name?.trim() || "User";

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
                            {formatDateTime(review.created_at)}
                          </p>
                        </div>

                        {review.comment && (
                          <p className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-6 text-zinc-700">
                            {review.comment}
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

              {canLeaveReview ? (
                <Link
                  href={`/reviews/new?bookingId=${booking.id}`}
                  className="mt-5 inline-flex rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800"
                >
                  Leave a review
                </Link>
              ) : reviewMessage && reviews.length > 0 ? (
                <p className="mt-5 text-sm leading-6 text-zinc-600">
                  {reviewMessage}
                </p>
              ) : null}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Completion
              </p>

              <h2 className="mt-1 text-xl font-semibold text-zinc-900">
                {booking.payout_status === "failed"
                  ? "Payout needs attention."
                  : "Release payout after the job."}
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                {booking.payout_status === "failed"
                  ? "The booking is paid, but the gardener payout could not be released. The gardener may need to connect Stripe in their profile, then the owner can retry the payout."
                  : "The owner should only complete the booking once the agreed plot care has actually been carried out. Completing the booking releases the gardener payout."}
              </p>

              {canCompleteAndPay ? (
                <button
                  type="button"
                  onClick={completeAndPayGardener}
                  disabled={completingBooking}
                  className="mt-5 w-full rounded-xl bg-emerald-900 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {completingBooking
                    ? "Trying payout..."
                    : booking.payout_status === "failed"
                    ? "Retry gardener payout"
                    : "Complete booking and release payout"}
                </button>
              ) : booking.status === "completed" ? (
                <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
                  This booking is complete. Reviews can now be left.
                </div>
              ) : isGardener ? (
                <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-zinc-600">
                  The owner marks the booking complete after the job has been carried out.
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-zinc-600">
                  This booking cannot be completed yet.
                </div>
              )}

              {booking.payout_error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  Payout issue: {booking.payout_error}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-emerald-800/70">
                Payment note
              </p>

              <p className="mt-3 text-sm leading-6 text-zinc-600">
                Payment is handled securely through Watch My Plot. The gardener is not
                paid out until the booking is completed.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}