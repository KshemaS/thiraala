import fs from "node:fs";
import path from "node:path";

/**
 * Shared between global-setup, the specs and global-teardown: the test
 * product created for this run and what to restore afterwards.
 */
export interface E2EState {
  startedAt: string;
  /** Order counter value before the run (null if the counter didn't exist). */
  orderCounter: number | null;
  product: { id: string; slug: string; name: string; priceValue: number };
}

export const STATE_FILE = path.join(__dirname, ".e2e-state.json");

/** SKU prefix of products the e2e run creates; teardown removes every one. */
export const TEST_SKU_PREFIX = "E2E-TEST-";

/** Emails of accounts the specs sign up (see signIn in api.spec / checkout.spec). */
export const TEST_EMAIL_PREFIXES = ["api-test-", "e2e-"];
export const TEST_EMAIL_DOMAIN = "@thiraala.com";

export function readState(): E2EState {
  return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
}
