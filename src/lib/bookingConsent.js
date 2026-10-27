export const BOOKING_TERMS_VERSION = "2026-10-27-v3";
export const CANCELLATION_POLICY_VERSION = "launch-full-refund-before-start-v1";

const CONSENT_MESSAGE = `Before payment:

• You pay the displayed booking total. Watch My Plot does not add an owner fee.
• If you or the gardener cancels before any work starts, you receive a full refund, including Watch My Plot's fee.
• Once work starts, refunds for unfinished or unsatisfactory work are reviewed under your legal rights and the published policy.
• Watch My Plot does not provide insurance or a booking guarantee.

By selecting OK, you accept the Terms and cancellation policy. If the service is due to start within 14 days, you expressly request it to begin during the cancellation period and understand that you may have to pay for work already supplied. Once the service is fully performed, the statutory cancellation right may end.`;

export function confirmBookingTerms() {
  return window.confirm(CONSENT_MESSAGE);
}

export function bookingConsentPayload() {
  return {
    termsAccepted: true,
    termsVersion: BOOKING_TERMS_VERSION,
    cancellationPolicyAccepted: true,
    cancellationPolicyVersion: CANCELLATION_POLICY_VERSION,
    earlyPerformanceRequested: true,
  };
}
