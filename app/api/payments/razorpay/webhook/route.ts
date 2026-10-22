import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { verifyWebhookSignature } from "@/lib/razorpay";
import type { TrackingEvent } from "@/app/api/orders/route";

// POST — Razorpay server-to-server webhook. Authoritative source of truth
// for payment capture/failure: catches payments that succeeded even if the
// customer's browser never reached /api/payments/razorpay/verify.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (
    !signature ||
    !verifyWebhookSignature(rawBody, signature, process.env.RAZORPAY_WEBHOOK_SECRET!)
  ) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const paymentEntity = event.payload?.payment?.entity;
    const razorpayOrderId: string | undefined = paymentEntity?.order_id;
    const razorpayPaymentId: string | undefined = paymentEntity?.id;

    if (!razorpayOrderId || (eventType !== "payment.captured" && eventType !== "payment.failed")) {
      // Nothing to do for events we don't handle — acknowledge so Razorpay stops retrying.
      return NextResponse.json({ success: true });
    }

    const order = await prisma.order.findUnique({
      where: { razorpayOrderId },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ success: true });
    }

    if (eventType === "payment.captured") {
      if (order.paymentStatus === "Paid") {
        return NextResponse.json({ success: true });
      }

      const timeline = (order.trackingTimeline as unknown as TrackingEvent[]) || [];
      const now = new Date().toISOString();
      if (timeline[1]) {
        timeline[1].completed = true;
        timeline[1].timestamp = timeline[1].timestamp || now;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "Paid",
          status: order.status === "Pending" ? "Order Confirmed" : order.status,
          razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
          trackingTimeline: timeline as unknown as Prisma.InputJsonValue,
        },
      });
    } else if (eventType === "payment.failed") {
      if (order.paymentStatus === "Pending") {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "Failed" },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing Razorpay webhook:", error);
    // Still 200 once the signature is valid — avoid endless Razorpay retries
    // for a processing bug; the payment can be reconciled manually.
    return NextResponse.json({ success: true });
  }
}
