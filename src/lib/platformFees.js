export const PLATFORM_FEE_PERCENT = 15;
export const PLATFORM_FEE_BASIS_POINTS = PLATFORM_FEE_PERCENT * 100;

export function calculatePlatformFeePence(amountPence) {
  return Math.round((amountPence * PLATFORM_FEE_BASIS_POINTS) / 10000);
}
