import prisma from "@/lib/prisma";

/**
 * Limits password guessing on the admin and customer sign-in forms.
 *
 * Failures are counted in the database (so limits survive restarts and work
 * across several server instances) under two keys:
 *   - account + network address: 5 failures in 15 min → locked 15 min
 *   - network address alone:     20 failures in 15 min → locked 15 min
 *   - account alone (any address): 30 failures in 15 min → locked 15 min
 * The first two lock only the guessing address, so the real owner can still
 * sign in from elsewhere; the third is a backstop for when the address can't
 * be trusted, slowing guessing to at most 30 tries per 15 minutes. A
 * successful sign-in clears the account + address counter.
 */

/** "track" = public order lookups (order number + phone). */
export type ThrottleScope = "admin" | "customer" | "track";

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const PER_ACCOUNT_LIMIT = 5;
const PER_ADDRESS_LIMIT = 20;

/**
 * The caller's network address. Prefers headers the host sets and visitors
 * can't forge (Vercel's x-vercel-forwarded-for / x-real-ip), then the last
 * X-Forwarded-For hop (added by the nearest proxy). Without a proxy in front
 * (e.g. Docker on port 3000) the header can be faked, which is why there is
 * also a per-account cap that doesn't depend on the address.
 */
export function clientAddress(request: Request): string {
  const h = request.headers;
  const trusted = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim();
  if (trusted) return trusted;
  const hops = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  return hops.at(-1) || "unknown";
}

const PER_ACCOUNT_TOTAL_LIMIT = 30;

function keysFor(scope: ThrottleScope, account: string, address: string) {
  const acct = account.trim().toLowerCase();
  return {
    account: `${scope}:acct:${acct}|ip:${address}`,
    address: `${scope}:ip:${address}`,
    accountTotal: `${scope}:acct:${acct}`,
  };
}

/** Minutes left on a lock covering this attempt, or 0 if it may proceed. */
export async function lockedMinutes(scope: ThrottleScope, account: string, address: string): Promise<number> {
  const { account: k1, address: k2, accountTotal: k3 } = keysFor(scope, account, address);
  const rows = await prisma.loginThrottle.findMany({ where: { key: { in: [k1, k2, k3] } } });
  const now = Date.now();
  const until = Math.max(0, ...rows.map((r) => (r.lockedUntil ? r.lockedUntil.getTime() : 0)));
  return until > now ? Math.ceil((until - now) / 60000) : 0;
}

async function bump(key: string, limit: number) {
  const now = new Date();
  const row = await prisma.loginThrottle.findUnique({ where: { key } });
  const windowExpired = !row || now.getTime() - row.windowStart.getTime() > WINDOW_MS;
  const failures = windowExpired ? 1 : row.failures + 1;
  const lockedUntil = failures >= limit ? new Date(now.getTime() + LOCK_MS) : windowExpired ? null : row?.lockedUntil ?? null;
  await prisma.loginThrottle.upsert({
    where: { key },
    create: { key, failures, windowStart: now, lockedUntil },
    update: { failures, lockedUntil, ...(windowExpired ? { windowStart: now } : {}) },
  });
}

export async function recordFailure(scope: ThrottleScope, account: string, address: string) {
  const { account: k1, address: k2, accountTotal: k3 } = keysFor(scope, account, address);
  await bump(k1, PER_ACCOUNT_LIMIT);
  await bump(k2, PER_ADDRESS_LIMIT);
  await bump(k3, PER_ACCOUNT_TOTAL_LIMIT);
}

export async function recordSuccess(scope: ThrottleScope, account: string, address: string) {
  const { account: k1 } = keysFor(scope, account, address);
  await prisma.loginThrottle.deleteMany({ where: { key: k1 } });
}

export function tooManyAttemptsMessage(minutes: number) {
  return `Too many failed sign-in attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}
