export const STRIPE_CHARGE_MODEL_DIRECT = "direct";
export const STRIPE_CHARGE_MODEL_LEGACY = "separate_charges_transfers";

export function isDirectChargeConfiguration(account) {
  return Boolean(
    account?.controller?.fees?.payer === "account" &&
      account?.controller?.losses?.payments === "stripe" &&
      account?.controller?.requirement_collection === "stripe" &&
      account?.controller?.stripe_dashboard?.type === "full"
  );
}

export function isDirectChargeAccount(account) {
  return Boolean(
    account?.charges_enabled &&
      account?.payouts_enabled &&
      isDirectChargeConfiguration(account)
  );
}

export function getAccountRequirements(account) {
  return {
    currently_due: account?.requirements?.currently_due || [],
    pending_verification: account?.requirements?.pending_verification || [],
    disabled_reason: account?.requirements?.disabled_reason || null,
  };
}
