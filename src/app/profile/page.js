"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function MyProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState("");

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
          skill_seedlings
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

      setLoading(false);
    }

    load();
  }, [router]);

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

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <a href="/dashboard" className="underline">
          ← Back to dashboard
        </a>

        <div className="rounded-2xl border p-6">
          <h1 className="text-2xl font-semibold">Your profile</h1>

          {loading ? (
            <p className="mt-4">Loading...</p>
          ) : (
            <>
              {msg && <p className="mt-4">{msg}</p>}

              <p className="mt-4 text-sm opacity-70">
                Signed in as: {email || "Unknown email"}
              </p>

              <form onSubmit={saveProfile} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm">Name</label>
                  <input
                    className="mt-1 w-full rounded-xl border p-2"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="text-sm">Location</label>
                  <input
                    className="mt-1 w-full rounded-xl border p-2"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Town or area"
                  />
                </div>

                <div>
                  <label className="text-sm">Profile photo URL</label>
                  <input
                    className="mt-1 w-full rounded-xl border p-2"
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {avatarUrl.trim() !== "" && (
                  <div className="rounded-2xl border p-4">
                    <p className="mb-3 text-sm opacity-70">Preview</p>
                    <img
                      src={avatarUrl}
                      alt="Profile preview"
                      className="h-24 w-24 rounded-full border object-cover"
                    />
                  </div>
                )}

                <div className="rounded-2xl border p-4">
                  <p className="text-sm font-medium">Gardening skills</p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={skillWatering}
                        onChange={(e) => setSkillWatering(e.target.checked)}
                      />
                      Watering
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={skillHarvesting}
                        onChange={(e) => setSkillHarvesting(e.target.checked)}
                      />
                      Harvesting
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={skillGreenhouse}
                        onChange={(e) => setSkillGreenhouse(e.target.checked)}
                      />
                      Greenhouse
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={skillVegBeds}
                        onChange={(e) => setSkillVegBeds(e.target.checked)}
                      />
                      Veg beds
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={skillPots}
                        onChange={(e) => setSkillPots(e.target.checked)}
                      />
                      Pots / containers
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={skillSeedlings}
                        onChange={(e) => setSkillSeedlings(e.target.checked)}
                      />
                      Seedlings / young plants
                    </label>
                  </div>

                  {previewTags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {previewTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border px-2 py-1 text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm">Bio</label>
                  <textarea
                    className="mt-1 w-full rounded-xl border p-2"
                    rows={5}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people a bit about yourself and your gardening experience"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save profile"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}