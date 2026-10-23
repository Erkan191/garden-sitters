export const MARKETS = {
  GB: { country: "GB", currency: "GBP", flag: "🇬🇧", label: "UK", fullLabel: "United Kingdom", locale: "en-GB" },
  AU: { country: "AU", currency: "AUD", flag: "🇦🇺", label: "Australia", fullLabel: "Australia", locale: "en-AU" },
  NZ: { country: "NZ", currency: "NZD", flag: "🇳🇿", label: "New Zealand", fullLabel: "New Zealand", locale: "en-NZ" },
};

export const MARKET_LIST = Object.values(MARKETS);

export function normalizeCountry(value) {
  const country = String(value || "").toUpperCase();
  return MARKETS[country] ? country : "GB";
}

export function getMarket(country) {
  return MARKETS[normalizeCountry(country)];
}

export function formatMoney(value, currency = "GBP", options = {}) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const market = MARKET_LIST.find((item) => item.currency === currency) || MARKETS.GB;
  const formatter = new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
  const explicitSymbols = { AUD: "A$", NZD: "NZ$" };

  if (!explicitSymbols[market.currency]) return formatter.format(number);

  return formatter
    .formatToParts(number)
    .map((part) =>
      part.type === "currency" ? explicitSymbols[market.currency] : part.value
    )
    .join("");
}

export function minimumPriceLabel(currency) {
  return formatMoney(5, currency);
}
