"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

    const { error } = await supabase.from("care_requests").insert({
      owner_id: user.id,
      title: title.trim(),
      details: details.trim() === "" ? null : details.trim(),
      postcode: postcode.trim() === "" ? null : postcode.trim(),
      start_date: startDate,
      end_date: endDate,
      price_offered_gbp: price === "" ? null : Number(price),
      visit_frequency: visitFrequency,
      need_watering: needWatering,
      need_harvesting: needHarvesting,
      has_greenhouse: hasGreenhouse,
      has_veg_beds: hasVegBeds,
      has_pots: hasPots,
      has_seedlings: hasSeedlings,
    });

    if (error) return setMsg(error.message);

    router.push("/requests");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">New care request</h1>

        <form onSubmit={handleCreate} className="mt-6 space-y-5">
          <div>
            <label className="text-sm">Title</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. Water veg beds + check tomatoes"
            />
          </div>

          <div>
            <label className="text-sm">Details</label>
            <textarea
              className="mt-1 w-full rounded-xl border p-2"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={5}
              placeholder="What needs doing? Tomatoes, cucumbers, courgettes, harvest notes, greenhouse instructions, compost, feeding, etc."
            />
          </div>

          <div>
            <label className="text-sm">Postcode (rough)</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="e.g. N13"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm">Start date</label>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm">End date</label>
              <input
                className="mt-1 w-full rounded-xl border p-2"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm">Visit frequency</label>
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={visitFrequency}
              onChange={(e) => setVisitFrequency(e.target.value)}
            >
              <option value="daily">Once a day</option>
              <option value="every_2_days">Every 2 days</option>
              <option value="custom">Custom / see details</option>
            </select>
          </div>

          <div className="rounded-2xl border p-4">
            <p className="text-sm font-medium">What needs care?</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={needWatering}
                  onChange={(e) => setNeedWatering(e.target.checked)}
                />
                Watering needed
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={needHarvesting}
                  onChange={(e) => setNeedHarvesting(e.target.checked)}
                />
                Harvesting needed
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasGreenhouse}
                  onChange={(e) => setHasGreenhouse(e.target.checked)}
                />
                Greenhouse involved
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasVegBeds}
                  onChange={(e) => setHasVegBeds(e.target.checked)}
                />
                Veg beds involved
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={hasPots}
                  onChange={(e) => setHasPots(e.target.checked)}
                />
                Pots / containers involved
              </label>

              <label className="flex items-center gap-2 text-sm">
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
            <label className="text-sm">Price offered (£) (optional)</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 30"
            />
          </div>

          <button className="w-full rounded-xl bg-black text-white p-2">
            Create request
          </button>

          {msg && <p className="text-sm opacity-80">{msg}</p>}
        </form>
      </div>
    </main>
  );
}