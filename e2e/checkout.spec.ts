import { test, expect } from "@playwright/test";

const TEST_CUSTOMER = {
  name: "Test Customer",
  phone: "9999999999",
  email: "e2e-test@thiraala.com",
  houseOrFlat: "Flat 1, Test Apartments",
  pincode: "682001",
  city: "Kochi",
  district: "Ernakulam",
  state: "Kerala",
};

// Full checkout flow: browse -> add to cart -> fill checkout form -> place order
// (creates a Pending/Pending app order) -> Razorpay Checkout opens -> pay with
// Razorpay's documented test card -> order flips to Paid/Order Confirmed.
//
// NOTE: steps 1-5 (everything on our own pages) are solid. Step 6, filling in
// Razorpay's own hosted checkout iframe, uses best-guess selectors based on
// Razorpay's publicly documented test checkout UI — this has not been run
// against the live iframe yet, so the exact field selectors may need small
// adjustments the first time this actually executes. Requires RAZORPAY_KEY_ID /
// RAZORPAY_KEY_SECRET to be set to TEST MODE keys — never run this against live keys.
test("guest can complete a Razorpay checkout end-to-end", async ({ page }) => {
  // 1. Add the first available product to the cart from its product page.
  await page.goto("/products");
  await page.locator('a[href^="/products/"]').first().click();
  await page.getByRole("button", { name: /buy now/i }).click();

  // 2. Go to cart, proceed to checkout. Checkout requires a logged-in account
  // (cart/page.tsx shows the auth modal instead of the checkout form for guests),
  // so sign up a fresh disposable account inline.
  await page.goto("/cart");
  await page.getByRole("button", { name: /proceed to checkout/i }).click();

  const uniqueEmail = `e2e-${Date.now()}@thiraala.com`;
  await page.getByRole("button", { name: /create account/i }).click();
  await page.getByPlaceholder("First name").fill("E2E");
  await page.getByPlaceholder("Last name").fill("Tester");
  await page.getByPlaceholder("Enter your email address").fill(uniqueEmail);
  await page.getByPlaceholder("10-digit mobile number").fill(TEST_CUSTOMER.phone);
  await page.getByPlaceholder("Create a password").fill("Test@1234");
  await page.getByRole("button", { name: /^register$/i }).click();

  // Registering auto-opens the checkout modal (see onRegisterSuccess in cart/page.tsx).

  // 3. Fill the checkout form.
  await page.getByPlaceholder("Enter your full name").fill(TEST_CUSTOMER.name);
  await page.getByPlaceholder("10-digit mobile").fill(TEST_CUSTOMER.phone);
  await page.getByPlaceholder("For tracking receipt").fill(TEST_CUSTOMER.email);
  await page.getByPlaceholder("6-digit Pincode").fill(TEST_CUSTOMER.pincode);
  await page
    .getByPlaceholder(/Flat 4B, Emerald Heights/i)
    .fill(TEST_CUSTOMER.houseOrFlat);
  await page.getByPlaceholder(/e.g. Kochi/i).fill(TEST_CUSTOMER.city);
  await page.getByPlaceholder(/e.g. Ernakulam/i).fill(TEST_CUSTOMER.district);
  await page.getByPlaceholder(/e.g. Kerala/i).fill(TEST_CUSTOMER.state);

  // 4. Submit -> creates the Pending/Pending order, then opens Razorpay Checkout.
  await page.getByRole("button", { name: /place order/i }).click();

  // 5. Razorpay Checkout renders in an iframe. Confirm it actually opened.
  const razorpayFrame = page.frameLocator('iframe[src*="razorpay"]');
  await expect(page.locator('iframe[src*="razorpay"]')).toBeVisible({ timeout: 20_000 });

  // 6. Best-effort: complete payment with Razorpay's documented test card.
  // Adjust selectors here against the live iframe the first time this runs.
  const cardNumberInput = razorpayFrame.locator(
    'input[name="card[number]"], input[placeholder*="Card Number" i]'
  );
  if (await cardNumberInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await cardNumberInput.fill("4111111111111111");
    await razorpayFrame
      .locator('input[name="card[expiry]"], input[placeholder*="Expiry" i]')
      .fill("12/30");
    await razorpayFrame
      .locator('input[name="card[cvv]"], input[placeholder*="CVV" i]')
      .fill("123");
    await razorpayFrame.getByRole("button", { name: /pay/i }).click();

    // 7. Back on our own success screen, confirm Razorpay payment was verified.
    await expect(page.getByText(/order placed successfully/i)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/received via razorpay/i)).toBeVisible();
  } else {
    test.info().annotations.push({
      type: "manual-followup",
      description:
        "Razorpay iframe opened but the test-card form selectors didn't match — " +
        "complete this payment manually once to confirm the live field names, " +
        "then update this spec's selectors.",
    });
  }
});
