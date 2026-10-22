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

test.describe("POST /api/orders", () => {
  test("creates an order that starts Pending/Pending, never auto-Paid", async ({ request }) => {
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
    const response = await request.post("/api/orders", {
      data: { customerName: "No Items Customer" },
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test("created order can be fetched back by its human id", async ({ request }) => {
    const createResponse = await request.post("/api/orders", { data: sampleOrderPayload() });
    const { order } = await createResponse.json();

    const getResponse = await request.get(`/api/orders/${order.id}`);
    expect(getResponse.ok()).toBeTruthy();

    const body = await getResponse.json();
    expect(body.order.id).toBe(order.id);
    expect(body.order.customerName).toBe("API Test Customer");
  });
});

test.describe("PATCH /api/orders/[id] admin guard", () => {
  test("rejects an unauthenticated status update with 401", async ({ request }) => {
    const createResponse = await request.post("/api/orders", { data: sampleOrderPayload() });
    const { order } = await createResponse.json();

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

  test("404s for an order id that doesn't exist", async ({ request }) => {
    const response = await request.post("/api/payments/razorpay/order", {
      data: { orderId: "THR-999999" },
    });
    expect(response.status()).toBe(404);
  });

  test("creates a Razorpay order for a real Pending order (requires valid RAZORPAY_KEY_ID/SECRET)", async ({
    request,
  }) => {
    const createResponse = await request.post("/api/orders", { data: sampleOrderPayload() });
    const { order } = await createResponse.json();

    const response = await request.post("/api/payments/razorpay/order", {
      data: { orderId: order.id },
    });
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.razorpayOrderId).toMatch(/^order_/);
    expect(body.amount).toBe(1999 * 100);
  });
});

test.describe("POST /api/payments/razorpay/verify", () => {
  test("rejects a bad signature instead of marking the order Paid", async ({ request }) => {
    const createResponse = await request.post("/api/orders", { data: sampleOrderPayload() });
    const { order } = await createResponse.json();

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
