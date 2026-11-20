import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

/**
 * Signed session cookie for shop customers (the admin has its own, see
 * lib/auth/session.ts). The cookie holds the user id plus an expiry, signed
 * with AUTH_SECRET, and is httpOnly so page scripts can't read it. Changing
 * the user id invalidates the signature, so one customer can't pose as
 * another.
 *
 * Replaces the old plain `thiraala_user_id` cookie, which held just the id
 * and could be set to anyone's id.
 */

export const CUSTOMER_COOKIE = "thiraala_customer_session";
const LEGACY_COOKIE = "thiraala_user_id";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface CustomerToken {
  sub: string; // User.id
  typ: "customer";
  exp: number; // unix seconds
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  }
  return s;
}

// "customer:" keeps these signatures distinct from admin session signatures.
const sign = (payload: string) => createHmac("sha256", secret()).update(`customer:${payload}`).digest("base64url");

export function createCustomerToken(userId: string): string {
  const token: CustomerToken = { sub: userId, typ: "customer", exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const payload = Buffer.from(JSON.stringify(token)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** The user id in a valid, unexpired token, else null. */
export function verifyCustomerToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as CustomerToken;
    if (data.typ !== "customer" || typeof data.sub !== "string" || !data.sub) return null;
    if (typeof data.exp !== "number" || data.exp <= Math.floor(Date.now() / 1000)) return null;
    return data.sub;
  } catch {
    return null;
  }
}

/** The signed-in customer's user id for this request, or null. */
export async function getCustomerId(): Promise<string | null> {
  const store = await cookies();
  return verifyCustomerToken(store.get(CUSTOMER_COOKIE)?.value);
}

/** Signs the customer in on this response (and drops the old cookie). */
export function setCustomerSession(response: NextResponse, userId: string) {
  response.cookies.set(CUSTOMER_COOKIE, createCustomerToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  response.cookies.delete(LEGACY_COOKIE);
}

export function clearCustomerSession(response: NextResponse) {
  response.cookies.delete(CUSTOMER_COOKIE);
  response.cookies.delete(LEGACY_COOKIE);
}
