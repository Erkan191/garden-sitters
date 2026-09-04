"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function buildSkillTags(profile) {
  if (!profile) return [];

  const tags = [];

  if (profile.skill_watering) tags.push("Watering");
  if (profile.skill_harvesting) tags.push("Harvesting");
  if (profile.skill_greenhouse) tags.push("Greenhouse");
  if (profile.skill_veg_beds) tags.push("Veg beds");
  if (profile.skill_pots) tags.push("Pots / containers");
  if (profile.skill_seedlings) tags.push("Seedlings / young plants");

  return tags;
}

function SkillCheckbox({ checked, onChange, label, helper }) {
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

function MyProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");

  const [stripeAccountId, setStripeAccountId] = useState("");
  const [stripeOnboardingComplete, setStripeOnboardingComplete] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeMsg, setStripeMsg] = useState("");

  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [skillWatering, setSkillWatering] = useState(false);
  const [skillHarvesting, setSkillHarvesting] = useState(false);
  const [skillGreenhouse, setSkillGreenhouse] = useState(false);
  const [skillVegBeds, setSkillVegBeds] = useState(false);
  const [skillPots, setSkillPots] = useState(false);
  const [skillSeedlings, setSkillSeedlings] = useState(false);

  useEffect(() => {
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
      setEmail(user.email || "");

      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          location,
          bio,
          avatar_url,
          skill_watering,
          skill_harvesting,
          skill_greenhouse,
          skill_veg_beds,
          skill_pots,
          skill_seedlings,
          stripe_account_id,
          stripe_onboarding_complete
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (profileErr) {
        setMsg(profileErr.message);
        setLoading(false);
        return;
      }

      setFullName(profile?.full_name || "");
      setLocation(profile?.location || "");
      setBio(profile?.bio || "");
      setAvatarUrl(profile?.avatar_url || "");

      setSkillWatering(Boolean(profile?.skill_watering));
      setSkillHarvesting(Boolean(profile?.skill_harvesting));
      setSkillGreenhouse(Boolean(profile?.skill_greenhouse));
      setSkillVegBeds(Boolean(profile?.skill_veg_beds));
      setSkillPots(Boolean(profile?.skill_pots));
      setSkillSeedlings(Boolean(profile?.skill_seedlings));

      setStripeAccountId(profile?.stripe_account_id || "");
      setStripeOnboardingComplete(Boolean(profile?.stripe_onboarding_complete));
      setStripeMsg("");

      setLoading(false);
    }

    load();
  }, [router]);

  useEffect(() => {
    const stripeState = searchParams.get("stripe");

    if (stripeState === "return" || stripeState === "refresh") {
      refreshStripeStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function getAccessToken() {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session?.access_token) {
      throw new Error("You are not logged in.");
    }

    return data.session.access_token;
  }

  async function refreshStripeStatus() {
    setStripeLoading(true);
    setStripeMsg("Checking Stripe status...");

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/stripe/connect/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not check Stripe status");
      }

      setStripeAccountId(data.stripe_account_id || "");
      setStripeOnboardingComplete(Boolean(data.onboardingComplete));

      if (data.onboardingComplete) {
        setStripeMsg("");
      } else {
        const currentlyDue = data.requirements?.currently_due || [];
        const pendingVerification = data.requirements?.pending_verification || [];
        const disabledReason = data.requirements?.disabled_reason;

        const parts = ["Stripe account found, but onboarding is not complete yet."];

        if (currentlyDue.length > 0) {
          parts.push(`Still required: ${currentlyDue.join(", ")}`);
        }

        if (pendingVerification.length > 0) {
          parts.push(`Pending verification: ${pendingVerification.join(", ")}`);
        }

        if (disabledReason) {
          parts.push(`Reason: ${disabledReason}`);
        }

        setStripeMsg(parts.join(" "));
      }
    } catch (err) {
      setStripeMsg(err.message || "Could not check Stripe status");
    } finally {
      setStripeLoading(false);
    }
  }

  async function startStripeOnboarding() {
    setStripeLoading(true);
    setStripeMsg("Opening Stripe onboarding...");

    try {
      const token = await getAccessToken();

      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not start Stripe onboarding");
      }

      if (!data.url) {
        throw new Error("Stripe onboarding link was not returned");
      }

      window.location.href = data.url;
    } catch (err) {
      setStripeMsg(err.message || "Could not start Stripe onboarding");
      setStripeLoading(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();

    if (!userId) {
      setMsg("You are not logged in.");
      return;
    }

    setSaving(true);
    setMsg("Saving profile...");

    const payload = {
      id: userId,
      full_name: fullName.trim() === "" ? null : fullName.trim(),
      location: location.trim() === "" ? null : location.trim(),
      bio: bio.trim() === "" ? null : bio.trim(),
      avatar_url: avatarUrl.trim() === "" ? null : avatarUrl.trim(),
      skill_watering: skillWatering,
      skill_harvesting: skillHarvesting,
      skill_greenhouse: skillGreenhouse,
      skill_veg_beds: skillVegBeds,
      skill_pots: skillPots,
      skill_seedlings: skillSeedlings,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      setMsg(error.message);
      setSaving(false);
      return;
    }

    setMsg("Profile saved ✅");
    setSaving(false);
  }

  const previewTags = useMemo(() => {
    return buildSkillTags({
      skill_watering: skillWatering,
      skill_harvesting: skillHarvesting,
      skill_greenhouse: skillGreenhouse,
      skill_veg_beds: skillVegBeds,
      skill_pots: skillPots,
      skill_seedlings: skillSeedlings,
    });
  }, [
    skillWatering,
    skillHarvesting,
    skillGreenhouse,
    skillVegBeds,
    skillPots,
    skillSeedlings,
  ]);

  const displayName = fullName.trim() || "Your name";
  const displayLocation = location.trim() || "Your area";
  const displayBio =
    bio.trim() ||
    "Tell owners and gardeners a bit about your growing experience, what you’re comfortable helping with, and why people can trust you.";

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
                Your profile
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Build trust before people book you.
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                Your public profile is what owners and gardeners see before deciding
                whether to work with you. Add a clear bio, location, skills, and payout
                setup if you want to receive payments.
              </p>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-[#f4f8ef] p-4 shadow-sm">
              <p className="text-sm font-bold text-zinc-900">
                Signed in as
              </p>
              <p className="mt-1 break-all text-sm leading-6 text-zinc-600">
                {email || "Unknown email"}
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="wmp-card rounded-lg text-sm text-zinc-600">
            Loading profile...
          </div>
        ) : (
          <form
            onSubmit={saveProfile}
            className="grid gap-6 lg:grid-cols-[1fr_0.42fr] lg:items-start"
          >
            <section className="wmp-panel space-y-6 rounded-lg">
              <div>
                <p className="wmp-eyebrow">
                  Profile details
                </p>
                <h2 className="mt-1 text-2xl font-bold text-zinc-900">
                  Tell people who you are
                </h2>
              </div>

              {msg && (
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm text-zinc-600">
                  {msg}
                </div>
              )}

              <div>
                <label className={labelClass}>Name</label>
                <input
                  className={inputClass}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className={labelClass}>Location</label>
                <input
                  className={inputClass}
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Town or area"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  Keep it broad, like Enfield, Palmers Green, or North London.
                </p>
              </div>

              <div>
                <label className={labelClass}>Profile photo URL</label>
                <input
                  className={inputClass}
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
                <p className="mt-1 text-xs text-zinc-500">
                  For now this uses an image URL. Proper uploads can come later.
                </p>
              </div>

              <div>
                <label className={labelClass}>Bio</label>
                <textarea
                  className={`${inputClass} min-h-36 resize-y leading-6`}
                  rows={6}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people a bit about yourself and your gardening experience."
                />
              </div>

              <div className="rounded-lg border border-stone-200 bg-white p-4">
                <p className="text-sm font-bold text-zinc-900">
                  Gardening skills
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-600">
                  These help owners understand whether you’re a good fit for specific
                  care requests.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <SkillCheckbox
                    checked={skillWatering}
                    onChange={(e) => setSkillWatering(e.target.checked)}
                    label="Watering"
                    helper="Beds, pots, greenhouses, and general plant care."
                  />

                  <SkillCheckbox
                    checked={skillHarvesting}
                    onChange={(e) => setSkillHarvesting(e.target.checked)}
                    label="Harvesting"
                    helper="Picking crops at the right time so plants keep producing."
                  />

                  <SkillCheckbox
                    checked={skillGreenhouse}
                    onChange={(e) => setSkillGreenhouse(e.target.checked)}
                    label="Greenhouse"
                    helper="Vents, watering routines, tomatoes, cucumbers, seedlings."
                  />

                  <SkillCheckbox
                    checked={skillVegBeds}
                    onChange={(e) => setSkillVegBeds(e.target.checked)}
                    label="Veg beds"
                    helper="Raised beds, allotment-style plots, and productive beds."
                  />

                  <SkillCheckbox
                    checked={skillPots}
                    onChange={(e) => setSkillPots(e.target.checked)}
                    label="Pots / containers"
                    helper="Containers that dry out quickly in warmer weather."
                  />

                  <SkillCheckbox
                    checked={skillSeedlings}
                    onChange={(e) => setSkillSeedlings(e.target.checked)}
                    label="Seedlings / young plants"
                    helper="Small plants that need careful checking."
                  />
                </div>

                {previewTags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {previewTags.map((tag) => (
                      <span
                        key={tag}
                  className="wmp-chip"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="wmp-button wmp-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save profile"}
              </button>
            </section>

            <aside className="space-y-4 lg:sticky lg:top-6">
              <section className="wmp-panel rounded-lg">
                <p className="wmp-eyebrow">
                  Public preview
                </p>

                <div className="mt-4 flex items-start gap-4">
                  {avatarUrl.trim() !== "" ? (
                    <img
                      src={avatarUrl}
                      alt="Profile preview"
                      className="h-20 w-20 rounded-full border border-stone-200 bg-stone-100 object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 text-2xl font-semibold text-emerald-900">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-zinc-900">
                      {displayName}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      {displayLocation}
                    </p>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-wrap rounded-lg border border-stone-200 bg-stone-50/70 p-4 text-sm leading-6 text-zinc-700">
                  {displayBio}
                </p>

                {previewTags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {previewTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-stone-200 bg-white px-2 py-1 text-xs text-zinc-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">
                    Select skills to show them here.
                  </p>
                )}
              </section>

              <section className="wmp-panel rounded-lg">
                <p className="wmp-eyebrow">
                  Stripe payouts
                </p>

                <h2 className="mt-1 text-xl font-bold text-zinc-900">
                  Get paid for completed jobs
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {stripeOnboardingComplete
                    ? "Payouts are connected. You can receive payments when bookings are completed."
                    : stripeAccountId
                      ? "Your Stripe account exists, but onboarding is not complete yet."
                      : "Connect Stripe if you want to receive payouts as a gardener."}
                </p>

                {stripeOnboardingComplete && (
                  <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm font-bold text-emerald-900">
                    Payouts connected ✅
                  </div>
                )}

                {stripeAccountId && (
                  <p className="mt-3 break-all text-xs text-zinc-500">
                    Stripe account: {stripeAccountId}
                  </p>
                )}

                {stripeMsg && (
                  <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-3 text-sm leading-6 text-zinc-600">
                    {stripeMsg}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2">
                  {!stripeOnboardingComplete && (
                    <button
                      type="button"
                      onClick={startStripeOnboarding}
                      disabled={stripeLoading}
                      className="wmp-button wmp-button-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {stripeLoading
                        ? "Please wait..."
                        : stripeAccountId
                          ? "Continue Stripe setup"
                          : "Connect Stripe for payouts"}
                    </button>
                  )}

                  {stripeAccountId && (
                    <button
                      type="button"
                      onClick={refreshStripeStatus}
                      disabled={stripeLoading}
                      className="wmp-button wmp-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Refresh Stripe status
                    </button>
                  )}
                </div>
              </section>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}

export default function MyProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="wmp-page">
          <div className="wmp-shell wmp-card rounded-lg text-sm text-zinc-600">
            Loading profile...
          </div>
        </main>
      }
    >
      <MyProfilePageContent />
    </Suspense>
  );
}
