import { test, expect } from "@playwright/test";

// Requires a real admin account to already exist (prisma/seed-admin.ts).
// Skips automatically if credentials aren't provided, rather than hardcoding
// a password into the repo.
const ADMIN_USERNAME = process.env.E2E_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

test.skip(
  !ADMIN_USERNAME || !ADMIN_PASSWORD,
  "Set E2E_ADMIN_USERNAME / E2E_ADMIN_PASSWORD to run admin E2E tests " +
    "(matches whatever you passed to prisma/seed-admin.ts)."
);

test("admin can log in and see the orders dashboard", async ({ page }) => {
  await page.goto("/login");

  await page.locator("#admin-username").fill(ADMIN_USERNAME!);
  await page.locator("#admin-password").fill(ADMIN_PASSWORD!);
  await page.locator("#admin-login-submit").click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });

  await page.goto("/dashboard/orders");
  // The orders list/table should render without an auth redirect.
  await expect(page).toHaveURL(/\/dashboard\/orders/);
});

test("unauthenticated visitor is redirected away from the dashboard", async ({ page }) => {
  await page.goto("/dashboard/orders");
  await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
});
