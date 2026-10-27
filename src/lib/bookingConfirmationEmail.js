import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { formatMoney } from "@/lib/marketConfig";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "Not specified";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

async function send(resend, payload, idempotencyKey) {
  const { error } = await resend.emails.send(payload, { idempotencyKey });
  if (error) throw new Error(error.message || "Booking confirmation email failed");
}

export async function sendBookingConfirmationEmails(bookingId) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Server is missing RESEND_API_KEY");

  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Server is missing Supabase admin environment variables");

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      "id, request_id, owner_id, gardener_id, amount, platform_fee, currency, terms_version, cancellation_policy_version"
    )
    .eq("id", bookingId)
    .single();

  if (bookingError) throw new Error(bookingError.message);

  const [requestResult, ownerResult, gardenerResult] = await Promise.all([
    supabase
      .from("care_requests")
      .select("title, start_date, end_date")
      .eq("id", booking.request_id)
      .single(),
    supabase.auth.admin.getUserById(booking.owner_id),
    supabase.auth.admin.getUserById(booking.gardener_id),
  ]);

  if (requestResult.error) throw new Error(requestResult.error.message);

  const ownerEmail = ownerResult.data?.user?.email;
  const gardenerEmail = gardenerResult.data?.user?.email;
  if (!ownerEmail || !gardenerEmail) {
    throw new Error("Booking participants are missing confirmation email addresses");
  }

  const request = requestResult.data;
  const total = formatMoney(booking.amount, booking.currency);
  const platformFee = formatMoney(booking.platform_fee, booking.currency);
  const gardenerBeforeStripe = formatMoney(
    Number(booking.amount) - Number(booking.platform_fee),
    booking.currency
  );
  const dateRange = `${formatDate(request.start_date)} to ${formatDate(request.end_date)}`;
  const termsVersion = booking.terms_version || "current";
  const policyVersion = booking.cancellation_policy_version || "current";
  const domain = process.env.RESEND_EMAIL_DOMAIN || "watchmyplot.com";
  const from = `Watch My Plot bookings <bookings@${domain}>`;
  const termsUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.watchmyplot.com"}/terms`;
  const common = [
    "Watch My Plot is operated by Free Life Ventures Ltd (company number 17547215).",
    `Booking: ${request.title}`,
    `Dates: ${dateRange}`,
    `Terms version: ${termsVersion}`,
    `Cancellation policy: ${policyVersion}`,
  ];

  const ownerText = [
    "Your Watch My Plot booking is confirmed.",
    "",
    ...common,
    `Total paid: ${total}`,
    "",
    "Cancellation summary:",
    "- If you or the gardener cancels before any work starts, you receive a full refund, including Watch My Plot's fee.",
    "- If work begins during the 14-day statutory cancellation period at your express request, you may have to pay proportionately for work already supplied. The statutory cancellation right may end once the service is fully performed.",
    "- Quality, crop-loss, damage and partly completed-work concerns are reviewed on their evidence and applicable legal rights; compensation is not guaranteed by Watch My Plot.",
    "- Watch My Plot does not provide an insurance policy or booking guarantee.",
    "",
    `To cancel or report a problem, email support@watchmyplot.com. Terms: ${termsUrl}`,
  ].join("\n");

  const gardenerText = [
    "A Watch My Plot booking has been paid and confirmed.",
    "",
    ...common,
    `Owner paid: ${total}`,
    `Watch My Plot fee: ${platformFee} (15%)`,
    `Your amount before Stripe charges: ${gardenerBeforeStripe}`,
    "",
    "If you cancel before work starts or do not attend, the owner receives a full refund, including Watch My Plot returning its fee. Contact support@watchmyplot.com immediately if you cannot attend. Stripe charges are separate and are charged to your connected Stripe account.",
    "Watch My Plot does not provide insurance or a booking guarantee.",
    "",
    `Terms: ${termsUrl}`,
  ].join("\n");

  const htmlFromText = (text) => `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#18181b;max-width:680px">
      ${text
        .split("\n")
        .map((line) => (line ? `<p style="margin:8px 0">${escapeHtml(line)}</p>` : "<br>"))
        .join("")}
    </div>`;

  const resend = new Resend(apiKey);
  await Promise.all([
    send(
      resend,
      {
        from,
        to: [ownerEmail],
        subject: `Booking confirmed: ${request.title}`,
        text: ownerText,
        html: htmlFromText(ownerText),
      },
      `booking-confirmation-owner-${booking.id}-${termsVersion}`
    ),
    send(
      resend,
      {
        from,
        to: [gardenerEmail],
        subject: `Garden job confirmed: ${request.title}`,
        text: gardenerText,
        html: htmlFromText(gardenerText),
      },
      `booking-confirmation-gardener-${booking.id}-${termsVersion}`
    ),
  ]);
}
