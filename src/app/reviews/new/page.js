"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [userId, setUserId] = useState(null);
  const [revieweeId, setRevieweeId] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [canSubmit, setCanSubmit] = useState(false);

  const trimmedComment = useMemo(() => comment.trim(), [comment]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setMsg("");
      setCanSubmit(false);

      if (!bookingId) {
        setMsg("Missing bookingId in URL.");
        setLoading(false);
        return;
      }

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userErr || !user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .select("id, status, owner_id, gardener_id")
        .eq("id", bookingId)
        .maybeSingle();

      if (bookingErr || !booking) {
        setMsg(bookingErr?.message || "Booking not found.");
        setLoading(false);
        return;
      }

      let otherUserId = null;

      if (user.id === booking.owner_id) {
        otherUserId = booking.gardener_id;
      } else if (user.id === booking.gardener_id) {
        otherUserId = booking.owner_id;
      } else {
        setMsg("You are not part of this booking.");
        setLoading(false);
        return;
      }

      if (booking.status !== "completed") {
        setMsg("Booking must be completed before leaving a review.");
        setLoading(false);
        return;
      }

      const { data: existingReview, error: existingErr } = await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .eq("reviewer_id", user.id)
        .maybeSingle();

      if (existingErr) {
        setMsg(existingErr.message);
        setLoading(false);
        return;
      }

      if (existingReview?.id) {
        setMsg("You already left a review for this booking.");
        setLoading(false);
        return;
      }

      setRevieweeId(otherUserId);
      setCanSubmit(true);
      setLoading(false);
    }

    load();
  }, [bookingId, router]);

  async function submitReview(e) {
    e.preventDefault();

    if (!bookingId || !userId || !revieweeId) {
      setMsg("Missing review info.");
      return;
    }

    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      setMsg("Rating must be between 1 and 5.");
      return;
    }

    setMsg("Submitting review...");

    const { error } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      reviewer_id: userId,
      reviewee_id: revieweeId,
      rating: Number(rating),
      comment: trimmedComment === "" ? null : trimmedComment,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push(`/bookings/${bookingId}`);
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-xl space-y-4">
        <a href="/bookings" className="underline">
          ← Back to bookings
        </a>

        <div className="rounded-2xl border p-6">
          <h1 className="text-2xl font-semibold">Leave a review</h1>

          {loading && <p className="mt-4">{msg || "Loading..."}</p>}

          {!loading && msg && (
            <p className="mt-4">{msg}</p>
          )}

          {!loading && canSubmit && (
            <form onSubmit={submitReview} className="mt-4 space-y-4">
              <div>
                <label className="text-sm">Rating</label>
                <select
                  className="mt-1 w-full rounded-xl border p-2"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  <option value={5}>5 - Great</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - OK</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Bad</option>
                </select>
              </div>

              <div>
                <label className="text-sm">Comment (optional)</label>
                <textarea
                  className="mt-1 w-full rounded-xl border p-2"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Anything helpful for others?"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-black px-4 py-2 text-white"
              >
                Submit review
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}