/**
 * Sends email through Resend (https://resend.com) using its HTTP API, so no
 * extra package is needed. Set in the environment:
 *   RESEND_API_KEY     — the API key from resend.com
 *   EMAIL_FROM         — e.g. "Thiraala <orders@thiraala.com>" (the domain
 *                        must be verified in Resend)
 *   SHOP_ALERT_EMAIL   — where new-order alerts go (the shop owner); optional
 *   SITE_URL           — optional, defaults to https://www.thiraala.com
 *
 * Without RESEND_API_KEY / EMAIL_FROM nothing is sent and sendEmail returns
 * false, so the shop keeps working before email is set up. Email failures
 * never break the request that triggered them.
 */

export const SITE_URL = (process.env.SITE_URL || "https://www.thiraala.com").replace(/\/+$/, "");

export function emailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

export async function sendEmail(msg: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  if (!emailConfigured()) {
    console.warn(`Email not sent (RESEND_API_KEY / EMAIL_FROM not set): "${msg.subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`Email "${msg.subject}" failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Email "${msg.subject}" failed:`, err);
    return false;
  }
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Simple branded wrapper; `body` is already-escaped HTML. */
export function emailLayout(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f5f0;font-family:Arial,Helvetica,sans-serif;color:#1E3A2C">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e8e2d6">
<tr><td style="padding:24px 28px;border-bottom:1px solid #eee7da;font-size:20px;font-weight:bold;letter-spacing:1px">THIRAALA</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px">${escapeHtml(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #eee7da;font-size:12px;color:#6b7b71">Thiraala · <a href="${SITE_URL}" style="color:#6b7b71">${SITE_URL.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

export const emailButton = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="background:#1E3A2C;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">${escapeHtml(label)}</a></p>`;
