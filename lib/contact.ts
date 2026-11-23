/**
 * Phone and email checks shared by the checkout page, the order API and
 * signup, so the browser and the server accept exactly the same values.
 */

/** A 10-digit Indian mobile (starts 6–9), with spaces, dashes, +91 or a leading 0 removed; else null. */
export function indianMobile(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const digits = raw.replace(/[\s\-().]/g, "").replace(/^(\+?91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(raw: unknown): boolean {
  return typeof raw === "string" && raw.trim().length <= 200 && EMAIL_RE.test(raw.trim());
}

export const PHONE_ERROR = "Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8 or 9).";
export const EMAIL_ERROR = "Please enter a valid email address, e.g. name@example.com.";
