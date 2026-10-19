import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/thiraala/i);
});

test("products page lists at least one product", async ({ page }) => {
  await page.goto("/products");
  // Each product links to /products/[id]; at least one should render.
  const productLinks = page.locator('a[href^="/products/"]');
  await expect(productLinks.first()).toBeVisible({ timeout: 15_000 });
});

test("cart page renders empty-cart state when nothing added", async ({ page }) => {
  await page.goto("/cart");
  await expect(page.getByText(/shopping bag is empty/i)).toBeVisible();
});
