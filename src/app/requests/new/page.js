"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const MAX_PRICE_GBP = 999999.99;

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

    if (endDate < startDate) {
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

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 text-zinc-900">
        <a href="/dashboard" className="text-sm text-zinc-600 underline">
          ← Back to dashboard
        </a>

        <h1 className="mt-4 text-2xl font-semibold">New care request</h1>

        <form onSubmit={handleCreate} className="mt-6 space-y-5">
          <div>
            <label className="text-sm text-zinc-700">Title</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Water veg beds + check tomatoes"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Details</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
              placeholder="What needs doing? Tomatoes, cucumbers, courgettes, harvest notes, greenhouse instructions, compost, feeding, etc."
            />
          </div>

          <div>
            <label className="text-sm text-zinc-700">Postcode (rough)</label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="e.g. N13"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-zinc-700">Start date</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-zinc-700">End date</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-700">Visit frequency</label>
            <select
              className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
              value={visitFrequency}
              onChange={(e) => setVisitFrequency(e.target.value)}
            >
              <option value="daily">Once a day</option>
              <option value="every_2_days">Every 2 days</option>
              <option value="custom">Custom / see details</option>
            </select>
          </div>

          <div className="rounded-2xl border border-zinc-200 p-4">
            <p className="text-sm font-medium text-zinc-900">What needs care?</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={needWatering}
                  onChange={(e) => setNeedWatering(e.target.checked)}
                />
                Watering needed
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={needHarvesting}
                  onChange={(e) => setNeedHarvesting(e.target.checked)}
                />
                Harvesting needed
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={hasGreenhouse}
                  onChange={(e) => setHasGreenhouse(e.target.checked)}
                />
                Greenhouse involved
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={hasVegBeds}
                  onChange={(e) => setHasVegBeds(e.target.checked)}
                />
                Veg beds involved
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={hasPots}
                  onChange={(e) => setHasPots(e.target.checked)}
                />
                Pots / containers involved
              </label>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={hasSeedlings}
                  onChange={(e) => setHasSeedlings(e.target.checked)}
                />
                Seedlings / young plants involved
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-700">
              Price offered (£) (optional)
            </label>
            <input
              className="mt-1 w-full rounded-xl border border-zinc-300 p-2 text-zinc-900"
              type="number"
              min="0.01"
              max="999999.99"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 30"
            />
            <p className="mt-1 text-xs text-zinc-500">Maximum £999,999.99</p>
          </div>

          <button className="w-full rounded-xl bg-black p-2 text-white">
            Create request
          </button>

          {msg && <p className="text-sm text-zinc-600">{msg}</p>}
        </form>
      </div>
    </main>
  );
}