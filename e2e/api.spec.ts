import { test, expect } from "@playwright/test";

const SAMPLE_ITEM = {
  id: "test-item-1",
  productId: "test-product-1",
  name: "Test Saree",
  price: "₹1999",
  priceValue: 1999,
  quantity: 1,
};

function sampleOrderPayload() {
  return {
    customerName: "API Test Customer",
    phone: "9999999999",
    email: "api-test@thiraala.com",
    address: "Flat 1, Test Apartments, Kochi, Ernakulam, Kerala - 682001",
    houseOrFlat: "Flat 1, Test Apartments",
    pincode: "682001",
    city: "Kochi",
    district: "Ernakulam",
    state: "Kerala",
    total: 1999,
    subtotal: 1999,
    items: [SAMPLE_ITEM],
  };
}

type Api = import("@playwright/test").APIRequestContext;

/**
 * Orders can only be placed signed in: creates a fresh customer account on
 * this request context, whose cookies keep it signed in for the test.
 */
async function signIn(request: Api) {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const response = await request.post("/api/auth/signup", {
    data: { firstName: "API", lastName: "Tester", email: `api-test-${unique}@thiraala.com`, password: "test-password-123" },
  });
  expect(response.ok()).toBeTruthy();
}

async function createOrder(request: Api) {
  await signIn(request);
  const response = await request.post("/api/orders", { data: sampleOrderPayload() });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).order;
}

test.describe("POST /api/orders", () => {
  test("refuses to create an order without signing in", async ({ request }) => {
    const response = await request.post("/api/orders", { data: sampleOrderPayload() });
    expect(response.status()).toBe(401);
  });

  test("creates an order that starts Pending/Pending, never auto-Paid", async ({ request }) => {
    await signIn(request);
    const response = await request.post("/api/orders", { data: sampleOrderPayload() });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.order.id).toMatch(/^THR-\d+$/);
    // Regression guard for the bug this migration fixed: orders must never be
    // created as "Paid" before a real Razorpay payment has been verified.
    expect(body.order.paymentStatus).toBe("Pending");
    expect(body.order.status).toBe("Pending");
    expect(body.order.items).toHaveLength(1);
    expect(body.order.items[0].name).toBe(SAMPLE_ITEM.name);
  });

  test("rejects a request missing required fields", async ({ request }) => {
    await signIn(request);
    const response = await request.post("/api/orders", {
      data: { customerName: "No Items Customer" },
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test("rejects a nonsense phone number", async ({ request }) => {
    await signIn(request);
    const response = await request.post("/api/orders", { data: { ...sampleOrderPayload(), phone: "abc" } });
    expect(response.status()).toBe(400);
  });

  test("created order can be fetched back by its owner", async ({ request }) => {
    const order = await createOrder(request);

    const getResponse = await request.get(`/api/orders/${order.id}`);
    expect(getResponse.ok()).toBeTruthy();

    const body = await getResponse.json();
    expect(body.order.id).toBe(order.id);
    expect(body.order.customerName).toBe("API Test Customer");
  });
});

test.describe("PATCH /api/orders/[id] admin guard", () => {
  test("rejects a non-admin status update with 401", async ({ request }) => {
    const order = await createOrder(request);

    const patchResponse = await request.patch(`/api/orders/${order.id}`, {
      data: { status: "Dispatched" },
    });
    expect(patchResponse.status()).toBe(401);
  });
});

test.describe("POST /api/payments/razorpay/order", () => {
  test("rejects a missing orderId", async ({ request }) => {
    const response = await request.post("/api/payments/razorpay/order", { data: {} });
    expect(response.status()).toBe(400);
  });

  test("needs sign-in", async ({ request }) => {
    const response = await request.post("/api/payments/razorpay/order", { data: { orderId: "THR-999999" } });
    expect(response.status()).toBe(401);
  });

  test("404s for an order id that doesn't exist", async ({ request }) => {
    await signIn(request);
    const response = await request.post("/api/payments/razorpay/order", { data: { orderId: "THR-999999" } });
    expect(response.status()).toBe(404);
  });

  test("another customer can't start payment on someone else's order", async ({ request, playwright, baseURL }) => {
    const order = await createOrder(request);

    const stranger = await playwright.request.newContext({ baseURL });
    await signIn(stranger);
    const response = await stranger.post("/api/payments/razorpay/order", { data: { orderId: order.id } });
    expect(response.status()).toBe(404);
    await stranger.dispose();
  });

  test("creates a Razorpay order for a real Pending order (requires valid RAZORPAY_KEY_ID/SECRET)", async ({
    request,
  }) => {
    const order = await createOrder(request);

    const response = await request.post("/api/payments/razorpay/order", { data: { orderId: order.id } });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.razorpayOrderId).toMatch(/^order_/);
    expect(body.amount).toBe(1999 * 100);

    // A retry reuses the same Razorpay order, so a payment against it can't be lost.
    const retry = await request.post("/api/payments/razorpay/order", { data: { orderId: order.id } });
    expect((await retry.json()).razorpayOrderId).toBe(body.razorpayOrderId);
  });
});

test.describe("POST /api/payments/razorpay/verify", () => {
  test("rejects a bad signature instead of marking the order Paid", async ({ request }) => {
    const order = await createOrder(request);

    const razorpayOrderResponse = await request.post("/api/payments/razorpay/order", {
      data: { orderId: order.id },
    });
    const { razorpayOrderId } = await razorpayOrderResponse.json();

    const verifyResponse = await request.post("/api/payments/razorpay/verify", {
      data: {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: "pay_fake_not_real",
        razorpay_signature: "0000000000000000000000000000000000000000000000000000000000000000",
      },
    });
    expect(verifyResponse.status()).toBe(400);

    const getResponse = await request.get(`/api/orders/${order.id}`);
    const { order: fetchedOrder } = await getResponse.json();
    expect(fetchedOrder.paymentStatus).toBe("Pending");
  });
});

test.describe("POST /api/payments/razorpay/webhook", () => {
  test("rejects a request with no/invalid signature header", async ({ request }) => {
    const response = await request.post("/api/payments/razorpay/webhook", {
      data: { event: "payment.captured", payload: {} },
      headers: { "x-razorpay-signature": "not-a-real-signature" },
    });
    expect(response.status()).toBe(400);
  });
});
