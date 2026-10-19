import crypto from "crypto";

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Verifies a Razorpay Checkout success callback (razorpay_order_id + razorpay_payment_id
// signed with the account's Key Secret). See /api/payments/razorpay/verify.
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
  keySecret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return timingSafeEqualStrings(expected, signature);
}

// Verifies a Razorpay webhook request (raw body signed with the webhook's own secret,
// distinct from the Key Secret). See /api/payments/razorpay/webhook.
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return timingSafeEqualStrings(expected, signature);
}
