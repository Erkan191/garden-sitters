import { Resend } from "resend";

const DEFAULT_ALERT_EMAIL = "erkan.said22@gmail.com";
const DEFAULT_EMAIL_DOMAIN = "watchmyplot.com";
const MAX_SEND_ATTEMPTS = 3;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function configuredRecipients() {
  return (process.env.ADMIN_ALERT_EMAIL || DEFAULT_ALERT_EMAIL)
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
}

export async function sendAdminAlert({ subject, heading, fields, idempotencyKey }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Server is missing RESEND_API_KEY");
  }

  const domain = process.env.RESEND_EMAIL_DOMAIN || DEFAULT_EMAIL_DOMAIN;
  const from =
    process.env.ADMIN_ALERT_FROM || `Watch My Plot alerts <alerts@${domain}>`;
  const recipients = configuredRecipients();
  const rows = fields.filter((field) => field.value !== null && field.value !== undefined);
  const text = [
    heading,
    "",
    ...rows.map((field) => `${field.label}: ${field.value || "—"}`),
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#18181b">
      <h1 style="font-size:22px;margin:0 0 20px">${escapeHtml(heading)}</h1>
      <table style="border-collapse:collapse;width:100%;max-width:680px">
        ${rows
          .map(
            (field) => `
              <tr>
                <th style="padding:8px 12px;text-align:left;vertical-align:top;border-bottom:1px solid #e7e5e4;color:#3f6212;width:150px">${escapeHtml(field.label)}</th>
                <td style="padding:8px 12px;vertical-align:top;border-bottom:1px solid #e7e5e4">${escapeHtml(field.value || "—")}</td>
              </tr>`
          )
          .join("")}
      </table>
    </div>`;

  const resend = new Resend(apiKey);
  const payload = { from, to: recipients, subject, text, html };

  for (let attempt = 0; attempt < MAX_SEND_ATTEMPTS; attempt += 1) {
    const { data, error } = await resend.emails.send(payload, { idempotencyKey });
    if (!error) return data;

    const statusCode = Number(error.statusCode || error.status || 0);
    const retryable = statusCode === 429 || statusCode >= 500;
    if (!retryable || attempt === MAX_SEND_ATTEMPTS - 1) {
      throw new Error(error.message || "Resend could not send the alert");
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 500 * 2 ** attempt + Math.floor(Math.random() * 250))
    );
  }
}
