import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { verifyPaymentSignature, verifyWebhookSignature } from "./razorpay";

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

describe("verifyPaymentSignature", () => {
  const keySecret = "test_key_secret";
  const orderId = "order_abc123";
  const paymentId = "pay_xyz789";

  it("accepts a correctly signed payment callback", () => {
    const signature = sign(`${orderId}|${paymentId}`, keySecret);
    expect(verifyPaymentSignature(orderId, paymentId, signature, keySecret)).toBe(true);
  });

  it("rejects a signature produced with the wrong secret", () => {
    const signature = sign(`${orderId}|${paymentId}`, "wrong_secret");
    expect(verifyPaymentSignature(orderId, paymentId, signature, keySecret)).toBe(false);
  });

  it("rejects a tampered order id", () => {
    const signature = sign(`${orderId}|${paymentId}`, keySecret);
    expect(verifyPaymentSignature("order_tampered", paymentId, signature, keySecret)).toBe(
      false
    );
  });

  it("rejects a tampered payment id", () => {
    const signature = sign(`${orderId}|${paymentId}`, keySecret);
    expect(verifyPaymentSignature(orderId, "pay_tampered", signature, keySecret)).toBe(false);
  });

  it("rejects a garbage/empty signature without throwing", () => {
    expect(verifyPaymentSignature(orderId, paymentId, "", keySecret)).toBe(false);
    expect(verifyPaymentSignature(orderId, paymentId, "not-hex-at-all", keySecret)).toBe(false);
  });

  it("rejects a signature of a different length than expected (no throw)", () => {
    const shortSignature = "abcd";
    expect(verifyPaymentSignature(orderId, paymentId, shortSignature, keySecret)).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const webhookSecret = "test_webhook_secret";
  const rawBody = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_1", order_id: "order_1" } } },
  });

  it("accepts a correctly signed webhook body", () => {
    const signature = sign(rawBody, webhookSecret);
    expect(verifyWebhookSignature(rawBody, signature, webhookSecret)).toBe(true);
  });

  it("rejects a webhook body that was modified after signing", () => {
    const signature = sign(rawBody, webhookSecret);
    const tamperedBody = rawBody.replace("payment.captured", "payment.failed");
    expect(verifyWebhookSignature(tamperedBody, signature, webhookSecret)).toBe(false);
  });

  it("rejects a signature produced with the wrong webhook secret", () => {
    const signature = sign(rawBody, "a_different_secret");
    expect(verifyWebhookSignature(rawBody, signature, webhookSecret)).toBe(false);
  });
});
