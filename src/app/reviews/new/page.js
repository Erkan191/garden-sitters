"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function NewReviewPageContent() {
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

  const inputClass =
    "mt-1 wmp-field rounded-lg";

  const labelClass = "wmp-label";

  return (
    <main className="wmp-page">
      <div className="wmp-shell wmp-stack">
        <Link
          href="/bookings"
          className="wmp-back-link"
        >
          Back to bookings
        </Link>

        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="wmp-eyebrow">
                Review
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Leave a review.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Share a clear, fair note about how the booking went. Reviews are
                only available after a booking has been completed.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-[#f4f8ef] p-4 shadow-sm">
              <p className="text-sm font-bold text-zinc-900">
                Keep it useful
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Mention reliability, communication, and whether the agreed garden
                care was handled well.
              </p>
            </div>
          </div>
        </section>

        <section className="wmp-panel rounded-lg">
          <div>
            <p className="wmp-eyebrow">
              Booking feedback
            </p>
            <h2 className="mt-1 text-2xl font-bold text-zinc-900">
              How did it go?
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              A short, honest review helps the next owner or gardener decide
              whether this person is a good fit.
            </p>
          </div>

          {loading && (
            <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50/70 p-5 text-sm text-zinc-600">
              {msg || "Checking whether this booking can be reviewed..."}
            </div>
          )}

          {!loading && msg && (
            <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50/70 p-5 text-sm leading-6 text-zinc-600">
              {msg}
            </div>
          )}

          {!loading && canSubmit && (
            <form onSubmit={submitReview} className="mt-6 space-y-5">
              <div>
                <label className={labelClass}>Rating</label>
                <select
                  className={inputClass}
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
                <label className={labelClass}>Comment (optional)</label>
                <textarea
                  className={`${inputClass} min-h-32 resize-y leading-6`}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What should others know about working with this person?"
                />
                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Helpful reviews are specific, fair, and focused on the booking.
                </p>
              </div>

              <button
                type="submit"
                className="wmp-button wmp-button-primary"
              >
                Submit review
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default function NewReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="wmp-page">
          <div className="wmp-shell wmp-card rounded-lg text-sm text-zinc-600">
            Loading review form...
          </div>
        </main>
      }
    >
      <NewReviewPageContent />
    </Suspense>
  );
}
