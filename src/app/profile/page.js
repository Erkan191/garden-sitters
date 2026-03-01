"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [role, setRole] = useState("owner");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [postcode, setPostcode] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [pricePerVisit, setPricePerVisit] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return router.push("/login");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && profile) {
        setRole(profile.role ?? "owner");
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
        setPostcode(profile.postcode ?? "");
        setExperienceLevel(profile.experience_level ?? "");
        setPricePerVisit(
          profile.price_per_visit_gbp != null ? String(profile.price_per_visit_gbp) : ""
        );
        setSkillsText((profile.skills ?? []).join(", "));
      }

      setLoading(false);
    }

    load();
  }, [router]);

  async function saveProfile(e) {
    e.preventDefault();
    setMsg("Saving...");

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return router.push("/login");

    const skillsArray = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      id: user.id,
      role,
      display_name: displayName,
      bio,
      postcode,
      skills: skillsArray,
      experience_level: experienceLevel,
      price_per_visit_gbp: pricePerVisit === "" ? null : Number(pricePerVisit),
    };

    const { error } = await supabase.from("profiles").upsert(payload, {
      onConflict: "id",
    });

    if (error) return setMsg(error.message);

    setMsg("Saved ✅");
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border p-6">
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="mt-1 text-sm opacity-80">
          This is what other gardeners/owners will see.
        </p>

        <form onSubmit={saveProfile} className="mt-6 space-y-4">
          <div>
            <label className="text-sm">Role</label>
            <select
              className="mt-1 w-full rounded-xl border p-2"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="owner">I need help (Owner)</option>
              <option value="gardener">I can help (Gardener)</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <label className="text-sm">Display name</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Erkan"
            />
          </div>

          <div>
            <label className="text-sm">Bio</label>
            <textarea
              className="mt-1 w-full rounded-xl border p-2"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g. Veg grower, no-dig, greenhouse experience..."
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm">Postcode (rough area)</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              placeholder="e.g. N13"
            />
          </div>

          <div>
            <label className="text-sm">Skills (comma-separated)</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="tomatoes, seedlings, greenhouse, houseplants"
            />
          </div>

          <div>
            <label className="text-sm">Experience level</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              placeholder="Beginner / Intermediate / Advanced"
            />
          </div>

          <div>
            <label className="text-sm">Price per visit (£) (optional)</label>
            <input
              className="mt-1 w-full rounded-xl border p-2"
              value={pricePerVisit}
              onChange={(e) => setPricePerVisit(e.target.value)}
              placeholder="e.g. 15"
              inputMode="decimal"
            />
          </div>

          <button className="w-full rounded-xl bg-black text-white p-2">
            Save profile
          </button>

          {msg && <p className="text-sm opacity-80">{msg}</p>}
        </form>
      </div>
    </main>
  );
}
