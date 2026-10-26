export function normalisePublicArea(country, value) {
  const area = String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (!area) return null;

  if (String(country || "").toUpperCase() !== "GB") return area;

  const upperArea = area.toUpperCase();
  const fullPostcode = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/;

  if (!fullPostcode.test(upperArea)) return upperArea;
  return upperArea.replace(/\s*\d[A-Z]{2}$/, "");
}
