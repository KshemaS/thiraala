import { pbkdf2Sync, timingSafeEqual } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

/**
 * Customer passwords use the same scrypt hashing as the admin login
 * (lib/auth/password.ts). Accounts created before that stored a weak
 * "salt:hash" PBKDF2 (1,000 rounds) hash; those still verify, and the caller
 * should re-hash on a successful login (needsRehash) so they're upgraded.
 */

export const hashCustomerPassword = hashPassword;

function verifyLegacy(password: string, stored: string): boolean {
  const [salt, hashHex, ...rest] = stored.split(":");
  if (!salt || !hashHex || rest.length > 0) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== 64) return false;
  const actual = pbkdf2Sync(password, salt, 1000, 64, "sha512");
  return timingSafeEqual(actual, expected);
}

export async function verifyCustomerPassword(
  password: string,
  stored: string | null | undefined
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (!stored) return { ok: false, needsRehash: false };
  if (stored.startsWith("scrypt$")) return { ok: await verifyPassword(password, stored), needsRehash: false };
  const ok = verifyLegacy(password, stored);
  return { ok, needsRehash: ok };
}
