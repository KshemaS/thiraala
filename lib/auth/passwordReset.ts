import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Password-reset links without a database table. The token holds the user id
 * and an expiry, signed with AUTH_SECRET together with the account's current
 * password hash. Once the password is changed the hash changes, so the link
 * stops working: each link can be used only once, and an older link dies as
 * soon as any newer one is used.
 */

export const RESET_TTL_MINUTES = 60;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  return s;
}

// "reset:" keeps these signatures distinct from session signatures.
const sign = (payload: string, passwordHash: string | null) =>
  createHmac("sha256", secret()).update(`reset:${payload}:${passwordHash ?? ""}`).digest("base64url");

export function createResetToken(userId: string, passwordHash: string | null): string {
  const exp = Math.floor(Date.now() / 1000) + RESET_TTL_MINUTES * 60;
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp })).toString("base64url");
  return `${payload}.${sign(payload, passwordHash)}`;
}

/** The user id the token was issued for, if it is well formed and unexpired (signature checked separately). */
export function readResetToken(token: unknown): string | null {
  if (typeof token !== "string" || token.length > 1000) return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.sub !== "string" || !data.sub) return null;
    if (typeof data.exp !== "number" || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return data.sub;
  } catch {
    return null;
  }
}

/** True if the token was signed for this account's current password hash. */
export function resetSignatureValid(token: string, passwordHash: string | null): boolean {
  const [payload, signature] = token.split(".");
  const expected = Buffer.from(sign(payload, passwordHash));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
