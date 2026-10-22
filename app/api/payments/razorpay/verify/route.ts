import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { toOrderJSON, type TrackingEvent } from "@/app/api/orders/route";

// POST verify a Razorpay Checkout success callback and mark the order Paid.
// Hit by the customer's browser right after Checkout.js's handler fires —
// the webhook route is the authoritative backstop if this call never happens.
export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing Razorpay verification fields" },
        { status: 400 }
      );
    }

    if (
      !verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        process.env.RAZORPAY_KEY_SECRET!
      )
    ) {
      return NextResponse.json(
        { success: false, error: "Signature verification failed" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found for this payment" },
        { status: 404 }
      );
    }

    if (order.paymentStatus === "Paid") {
      return NextResponse.json({ success: true, order: toOrderJSON(order) });
    }

    const timeline = (order.trackingTimeline as unknown as TrackingEvent[]) || [];
    const now = new Date().toISOString();
    if (timeline[1]) {
      timeline[1].completed = true;
      timeline[1].timestamp = timeline[1].timestamp || now;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: "Paid",
        status: order.status === "Pending" ? "Order Confirmed" : order.status,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        trackingTimeline: timeline as unknown as Prisma.InputJsonValue,
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, order: toOrderJSON(updated) });
  } catch (error: any) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
