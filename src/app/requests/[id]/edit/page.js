"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const MAX_PRICE_GBP = 999999.99;

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

export default function EditRequestPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
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

  useEffect(() => {
    async function loadRequest() {
      setLoading(true);
      setMsg("");

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: requestRow, error } = await supabase
        .from("care_requests")
        .select(`
          id,
          owner_id,
          status,
          title,
          details,
          postcode,
          start_date,
          end_date,
          price_offered_gbp,
          visit_frequency,
          need_watering,
          need_harvesting,
          has_greenhouse,
          has_veg_beds,
          has_pots,
          has_seedlings
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) {
        setMsg(error.message);
        setCanEdit(false);
        setLoading(false);
        return;
      }

      if (!requestRow) {
        setMsg("Request not found.");
        setCanEdit(false);
        setLoading(false);
        return;
      }

      if (requestRow.owner_id !== user.id) {
        setMsg("You can only edit your own request.");
        setCanEdit(false);
        setLoading(false);
        return;
      }

      if (requestRow.status !== "open") {
        setMsg("Only open requests can be edited.");
        setCanEdit(false);
        setLoading(false);
        return;
      }

      setTitle(requestRow.title || "");
      setDetails(requestRow.details || "");
      setPostcode(requestRow.postcode || "");
      setStartDate(requestRow.start_date || "");
      setEndDate(requestRow.end_date || "");
      setPrice(
        requestRow.price_offered_gbp == null
          ? ""
          : String(requestRow.price_offered_gbp)
      );

      setVisitFrequency(requestRow.visit_frequency || "daily");
      setNeedWatering(Boolean(requestRow.need_watering));
      setNeedHarvesting(Boolean(requestRow.need_harvesting));
      setHasGreenhouse(Boolean(requestRow.has_greenhouse));
      setHasVegBeds(Boolean(requestRow.has_veg_beds));
      setHasPots(Boolean(requestRow.has_pots));
      setHasSeedlings(Boolean(requestRow.has_seedlings));

      setCanEdit(true);
      setLoading(false);
    }

    if (id) {
      loadRequest();
    }
  }, [id, router]);

  async function handleUpdate(e) {
    e.preventDefault();
    setMsg("Saving changes...");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!canEdit) {
      setMsg("This request cannot be edited.");
      return;
    }

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

    const { data: updatedRow, error } = await supabase
      .from("care_requests")
      .update({
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
      .eq("id", id)
      .eq("owner_id", user.id)
      .eq("status", "open")
      .select("id")
      .maybeSingle();

    if (error) {
      setMsg(error.message);
      return;
    }

    if (!updatedRow) {
      setMsg("This request could not be updated. It may no longer be open.");
      return;
    }

    router.push(`/requests/${id}`);
  }

  const inputClass =
    "mt-1 wmp-field rounded-lg";

  const labelClass = "wmp-label";

  if (loading) {
    return (
      <main className="wmp-page">
        <div className="wmp-shell wmp-card rounded-lg text-sm text-zinc-600">
          Loading request...
        </div>
      </main>
    );
  }

  return (
    <main className="wmp-page">
      <div className="wmp-shell wmp-stack">
        <Link
          href={`/requests/${id}`}
          className="wmp-back-link"
        >
          ← Back to request
        </Link>

        <section className="wmp-hero rounded-lg bg-[#fffdf8]">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="wmp-eyebrow">
                Edit request
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Update your plot care request.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Adjust the dates, details, visit frequency, budget, and care needs
                while the request is still open.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-[#f4f8ef] p-4 shadow-sm">
              <p className="text-sm font-bold text-zinc-900">
                Only open requests can be edited.
              </p>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Once a request has been accepted, closed, or completed, changes are
                limited to protect both gardener and garden owner.
              </p>
            </div>
          </div>
        </section>

        {!canEdit ? (
          <section className="wmp-panel rounded-lg">
            <p className="font-bold text-zinc-900">
              This request cannot be edited.
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {msg || "Only the owner can edit an open request."}
            </p>

            <Link
              href={`/requests/${id}`}
              className="mt-4 wmp-button wmp-button-secondary"
            >
              Back to request
            </Link>
          </section>
        ) : (
          <form
            onSubmit={handleUpdate}
            className="grid gap-6 lg:grid-cols-[1fr_0.38fr] lg:items-start"
          >
            <section className="wmp-panel space-y-6 rounded-lg">
              <div>
                <p className="wmp-eyebrow">
                  Request details
                </p>
                <h2 className="mt-1 text-2xl font-bold text-zinc-900">
                  What needs updating?
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
                  Keep it rough. Exact details can be shared later once the job is agreed.
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
                <p className="text-sm font-bold text-zinc-900">
                  What needs care?
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  Keep this accurate so gardeners know whether they’re a good fit.
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
                <label className={labelClass}>Price offered (£) optional</label>
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
              </div>

              <button className="wmp-button wmp-button-primary w-full">
                Save changes
              </button>

              {msg && (
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-zinc-600">
                  {msg}
                </div>
              )}
            </section>

            <aside className="wmp-panel space-y-4 rounded-lg lg:sticky lg:top-6">
              <div>
                <p className="wmp-eyebrow">
                  Editing tips
                </p>
                <h2 className="mt-1 text-xl font-bold text-zinc-900">
                  Make the request easy to understand.
                </h2>
              </div>

              <div className="space-y-3 text-sm leading-6 text-zinc-600">
                <p>
                  <span className="font-medium text-zinc-900">Update dates:</span>{" "}
                  make sure the visit window is still correct.
                </p>

                <p>
                  <span className="font-medium text-zinc-900">Add detail:</span>{" "}
                  include watering routines, harvest notes, and greenhouse instructions.
                </p>

                <p>
                  <span className="font-medium text-zinc-900">Keep it public-safe:</span>{" "}
                  use a rough postcode or area, not your full address.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-bold text-emerald-950">
                  Status
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-900/80">
                  This request is open, so it can still be edited.
                </p>
              </div>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
