"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

  async function retryPayout() {
    setMsg("Retrying payout...");

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    if (!token) {
      setMsg("Not logged in.");
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
      setMsg(json.error || "Failed to retry payout.");
      return;
    }

    setMsg(`Payout sent ✅ Transfer: ${json.transferId}`);
    await load();
  }

  async function markCompleted() {
    setMsg("Marking booking as completed...");

    const { error } = await supabase.rpc("complete_booking", {
      p_booking_id: id,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    await load();
    setMsg("Booking marked as completed ✅");
  }

  const isOwner = booking && userId && booking.owner_id === userId;
  const isGardener = booking && userId && booking.gardener_id === userId;
  const isParticipant = booking && userId && (isOwner || isGardener);

  const canMarkCompleted =
    booking &&
    isParticipant &&
    booking.status === "paid";

  const canLeaveReview =
    booking &&
    isParticipant &&
    booking.status === "completed" &&
    !myReviewExists;

  const ownerName =
    profilesById[booking?.owner_id]?.full_name?.trim() || "Owner";

  const gardenerName =
    profilesById[booking?.gardener_id]?.full_name?.trim() || "Gardener";

  let reviewMessage = "";

  if (booking) {
    if (!isParticipant) {
      reviewMessage = "Only the owner or gardener on this booking can leave a review.";
    } else if (booking.status !== "completed") {
      reviewMessage = `Review not available yet. Booking status is "${booking.status}". It must be "completed".`;
    } else if (myReviewExists) {
      reviewMessage = "You already left a review for this booking.";
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <a href="/bookings" className="underline">
          ← Back to bookings
        </a>

        {loading && <p>Loading...</p>}
        {msg && <p>{msg}</p>}

        {!loading && booking && (
          <>
            <div className="rounded-2xl border p-6">
              <h1 className="text-2xl font-semibold">Booking</h1>

              <p className="mt-2 text-sm opacity-80">
                Status: {booking.status} • £{booking.amount_gbp}
              </p>

              <p className="mt-4 text-sm">
                <span className="opacity-70">Owner:</span>{" "}
                <a href={`/users/${booking.owner_id}`} className="underline">
                  {ownerName}
                </a>
              </p>

              <p className="mt-2 text-sm">
                <span className="opacity-70">Gardener:</span>{" "}
                <a href={`/users/${booking.gardener_id}`} className="underline">
                  {gardenerName}
                </a>
              </p>

              <p className="mt-4 text-xs opacity-60">
                Payout status: {booking.payout_status || "not_started"}
              </p>

              {booking.payout_error && (
                <p className="mt-2 text-xs opacity-60">
                  Payout error: {booking.payout_error}
                </p>
              )}

              {booking.stripe_payment_intent_id && (
                <p className="mt-2 text-xs opacity-60">
                  PaymentIntent: {booking.stripe_payment_intent_id}
                </p>
              )}

              {booking.stripe_transfer_id && (
                <p className="mt-2 text-xs opacity-60">
                  Transfer: {booking.stripe_transfer_id}
                </p>
              )}

              {isOwner && booking.payout_status === "failed" && !booking.stripe_transfer_id && (
                <button
                  type="button"
                  onClick={retryPayout}
                  className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
                >
                  Retry payout
                </button>
              )}

              {canMarkCompleted && (
                <button
                  type="button"
                  onClick={markCompleted}
                  className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
                >
                  Mark booking as completed
                </button>
              )}

              <div className="mt-6 flex flex-wrap gap-4">
                <a href={`/requests/${booking.request_id}`} className="underline">
                  View request
                </a>

                <a href={`/requests/${booking.request_id}/chat`} className="underline">
                  Open chat
                </a>
              </div>

              {canLeaveReview && (
                <div className="mt-6">
                  <a
                    href={`/reviews/new?bookingId=${booking.id}`}
                    className="underline"
                  >
                    Leave a review
                  </a>
                </div>
              )}

              {!canLeaveReview && (
                <p className="mt-4 text-sm opacity-80">
                  {reviewMessage}
                </p>
              )}
            </div>

            <div className="rounded-2xl border p-6">
              <h2 className="text-xl font-semibold">Reviews</h2>

              {reviews.length === 0 ? (
                <p className="mt-3 text-sm opacity-80">No reviews yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {reviews.map((review) => {
                    const reviewerName =
                      profilesById[review.reviewer_id]?.full_name?.trim() || "User";

                    return (
                      <div key={review.id} className="rounded-xl border p-4">
                        <p className="text-sm opacity-80">
                          Rating: {review.rating}/5 •{" "}
                          {new Date(review.created_at).toLocaleString()}
                        </p>

                        <p className="mt-2 text-sm opacity-70">
                          From: {reviewerName}
                        </p>

                        {review.comment && (
                          <p className="mt-2 whitespace-pre-wrap">
                            {review.comment}
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