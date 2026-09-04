"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BetaNotice, SafetyNotice } from "../../LaunchNotices";

const MAX_PRICE_GBP = 999999.99;

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

  return text;
}

function CareCheckbox({ checked, onChange, label, helper }) {
  return (
    <label className="rounded-lg border border-stone-200 bg-[#fbfbf7] p-4 text-sm text-zinc-700">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-1 accent-emerald-900"
        />

        <div>
          <p className="font-bold text-zinc-900">{label}</p>
          {helper && <p className="mt-1 text-xs leading-5 text-zinc-500">{helper}</p>}
        </div>
      </div>
    </label>
  );
}

export default function NewRequestPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [postcode, setPostcode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");

  const [visitFrequency, setVisitFrequency] = useState("daily");
  const [needWatering, setNeedWatering] = useState(true);
  const [needHarvesting, setNeedHarvesting] = useState(false);
  const [hasGreenhouse, setHasGreenhouse] = useState(false);
  const [hasVegBeds, setHasVegBeds] = useState(false);
  const [hasPots, setHasPots] = useState(false);
  const [hasSeedlings, setHasSeedlings] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setMsg("Creating request...");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return router.push("/login");

    if (title.trim() === "") {
      setMsg("Please add a title for your request.");
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setMsg("End date cannot be before start date.");
      return;
    }

    const parsedPrice = price === "" ? null : Number(price);

    if (
      parsedPrice !== null &&
      (!Number.isFinite(parsedPrice) ||
        parsedPrice <= 0 ||
        parsedPrice > MAX_PRICE_GBP ||
        Math.round(parsedPrice * 100) !== parsedPrice * 100)
    ) {
      setMsg(
        "Price must be between £0.01 and £999,999.99, with no more than 2 decimal places."
      );
      return;
    }

    const { data: createdRequest, error } = await supabase
      .from("care_requests")
      .insert({
        owner_id: user.id,
        title: title.trim(),
        details: details.trim() === "" ? null : details.trim(),
        postcode: postcode.trim() === "" ? null : postcode.trim(),
        start_date: startDate,
        end_date: endDate,
        price_offered_gbp: parsedPrice,
        visit_frequency: visitFrequency,
        need_watering: needWatering,
        need_harvesting: needHarvesting,
        has_greenhouse: hasGreenhouse,
        has_veg_beds: hasVegBeds,
        has_pots: hasPots,
        has_seedlings: hasSeedlings,
      })
      .select("id")
      .single();

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push(`/requests/${createdRequest.id}`);
  }

  const inputClass =
    "mt-1 wmp-field rounded-lg";

  const labelClass = "wmp-label";

  return (
    <main className="wmp-page">
      <div className="wmp-shell wmp-stack">
        <Link
          href="/dashboard"
          className="wmp-back-link"
        >
          ← Back to dashboard
        </Link>

        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="wmp-eyebrow">
                New request
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Post a garden care request.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Tell local growers what needs looking after while you’re away:
                watering, seedlings, harvesting, greenhouse care, pots, veg beds, or
                anything else that keeps your garden ticking over.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-[#f4f8ef] p-4 shadow-sm">
              <p className="text-sm font-bold text-zinc-900">
                A good request is specific.
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Mention visit frequency, watering routines, greenhouse vents, what can
                be harvested, and any plants that need special attention.
              </p>
            </div>
          </div>
        </section>

        <BetaNotice />

        <form
          onSubmit={handleCreate}
          className="grid gap-6 lg:grid-cols-[1fr_0.38fr] lg:items-start"
        >
          <section className="wmp-panel space-y-6 rounded-lg">
            <div>
              <p className="wmp-eyebrow">
                Request details
              </p>
              <h2 className="mt-1 text-2xl font-bold text-zinc-900">
                What do you need help with?
              </h2>
            </div>

            <div>
              <label className={labelClass}>Title</label>
              <input
                className={inputClass}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Water veg beds and check greenhouse tomatoes"
              />
            </div>

            <div>
              <label className={labelClass}>Details</label>
              <textarea
                className={`${inputClass} min-h-36 resize-y leading-6`}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={6}
                placeholder="What needs doing? Mention watering routines, greenhouse instructions, harvesting notes, feeding, compost, seedlings, pots, or anything else useful."
              />
            </div>

            <div>
              <label className={labelClass}>Postcode / area</label>
              <input
                className={inputClass}
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g. N13"
              />
              <p className="mt-1 text-xs text-zinc-500">
                Keep it rough. You can share exact details later once the job is agreed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Start date</label>
                <input
                  className={inputClass}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>End date</label>
                <input
                  className={inputClass}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Visit frequency</label>
              <select
                className={inputClass}
                value={visitFrequency}
                onChange={(e) => setVisitFrequency(e.target.value)}
              >
                <option value="daily">Once a day</option>
                <option value="every_2_days">Every 2 days</option>
                <option value="custom">Custom / see details</option>
              </select>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <p className="text-sm font-bold text-zinc-900">What needs care?</p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Choose the things that matter so gardeners can see whether they’re a
                good fit.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <CareCheckbox
                  checked={needWatering}
                  onChange={(e) => setNeedWatering(e.target.checked)}
                  label="Watering"
                  helper="Beds, pots, greenhouse crops, or anything thirsty."
                />

                <CareCheckbox
                  checked={needHarvesting}
                  onChange={(e) => setNeedHarvesting(e.target.checked)}
                  label="Harvesting"
                  helper="Pick crops so plants keep producing."
                />

                <CareCheckbox
                  checked={hasGreenhouse}
                  onChange={(e) => setHasGreenhouse(e.target.checked)}
                  label="Greenhouse"
                  helper="Vents, watering, tomatoes, cucumbers, seedlings."
                />

                <CareCheckbox
                  checked={hasVegBeds}
                  onChange={(e) => setHasVegBeds(e.target.checked)}
                  label="Veg beds"
                  helper="Raised beds, allotment-style plots, or productive beds."
                />

                <CareCheckbox
                  checked={hasPots}
                  onChange={(e) => setHasPots(e.target.checked)}
                  label="Pots / containers"
                  helper="Pots dry out fast, especially in warm weather."
                />

                <CareCheckbox
                  checked={hasSeedlings}
                  onChange={(e) => setHasSeedlings(e.target.checked)}
                  label="Seedlings / young plants"
                  helper="Small plants that need careful checking."
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Budget / price offered (GBP) optional</label>
              <input
                className={inputClass}
                type="number"
                min="0.01"
                max="999999.99"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                placeholder="e.g. 30"
              />
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Gardeners can send their own total offer. If you accept one, you
                confirm the booking and pay through Stripe.
              </p>
            </div>

            <SafetyNotice title="Before posting">
              Keep public details broad. Do not share exact addresses, access
              codes, key locations, alarm information, or other sensitive access
              details until you are comfortable with the gardener. You are
              responsible for agreeing dates, price, access, keys, and care
              instructions clearly.
            </SafetyNotice>

            <button className="wmp-button wmp-button-primary w-full">
              Post request
            </button>

            {msg && (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-zinc-600">
                {friendlyError(msg)}
              </div>
            )}
          </section>

          <aside className="wmp-panel space-y-4 rounded-lg lg:sticky lg:top-6">
            <div>
              <p className="wmp-eyebrow">
                Tips
              </p>
              <h2 className="mt-1 text-xl font-bold text-zinc-900">
                Make it easy for the right gardener to say yes.
              </h2>
            </div>

            <div className="space-y-3 text-sm leading-6 text-zinc-600">
              <p>
                <span className="font-medium text-zinc-900">Be practical:</span>{" "}
                say what needs doing, not just “water plants”.
              </p>

              <p>
                <span className="font-medium text-zinc-900">Mention timings:</span>{" "}
                morning or evening watering, greenhouse venting, or harvest windows.
              </p>

              <p>
                <span className="font-medium text-zinc-900">Use the details box:</span>{" "}
                this is where you explain anything unusual.
              </p>

              <p>
                <span className="font-medium text-zinc-900">Exact address later:</span>{" "}
                keep the public area rough until you’ve agreed the job.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-sm font-bold text-emerald-950">
                Example title
              </p>
              <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                Water greenhouse tomatoes, check seedlings, and harvest courgettes.
              </p>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50/70 p-4">
              <p className="text-sm font-bold text-zinc-900">
                What happens next
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Your request goes live, gardeners send offers, you choose who to
                accept, then you pay through Stripe to confirm the booking.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}
