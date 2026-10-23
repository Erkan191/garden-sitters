"use client";

import { useSyncExternalStore } from "react";

import {
  MARKET_LIST,
  MARKETS,
  formatMoney,
  getMarket,
  minimumPriceLabel,
  normalizeCountry,
} from "@/lib/marketConfig";

export { MARKET_LIST, MARKETS, formatMoney, getMarket, minimumPriceLabel, normalizeCountry };

export const MARKET_STORAGE_KEY = "watch-my-plot-country";
export const MARKET_CHANGE_EVENT = "watch-my-plot-market-change";

export function getStoredCountry() {
  if (typeof window === "undefined") return "GB";
  return normalizeCountry(window.localStorage.getItem(MARKET_STORAGE_KEY));
}

export function setStoredCountry(country) {
  if (typeof window === "undefined") return;
  const normalized = normalizeCountry(country);
  window.localStorage.setItem(MARKET_STORAGE_KEY, normalized);
  window.dispatchEvent(
    new CustomEvent(MARKET_CHANGE_EVENT, { detail: { country: normalized } })
  );
}

function subscribeToMarket(callback) {
  window.addEventListener(MARKET_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(MARKET_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useSelectedCountry(initialCountry = "GB") {
  const country = useSyncExternalStore(
    subscribeToMarket,
    getStoredCountry,
    () => normalizeCountry(initialCountry)
  );

  return [country, setStoredCountry];
}

