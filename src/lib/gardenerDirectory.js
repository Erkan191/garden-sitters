export function isGardenerCapable(profile) {
  return profile?.role === "gardener" || profile?.role === "both";
}

export function missingDirectoryDetails(profile) {
  const missing = [];
  if (!(profile?.full_name?.trim() || profile?.display_name?.trim())) missing.push("name");
  if (!(profile?.location?.trim() || profile?.postcode?.trim())) missing.push("area");
  if (!profile?.bio?.trim()) missing.push("bio");
  return missing;
}

export function isDirectoryEligible(profile) {
  return isGardenerCapable(profile) && missingDirectoryDetails(profile).length === 0;
}
