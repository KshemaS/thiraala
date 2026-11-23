import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";
import { OutOfStockError, reserveOrderStock } from "@/lib/stock";
import { getCustomerId } from "@/lib/auth/customerSession";
import { customerOwnsOrder } from "@/lib/orderAccess";

const NOT_FOUND = "Order not found.";

/**
 * POST { orderId } — start (or resume) payment for a Pending order.
 * Orders can only be placed signed in, so the caller must be the signed-in
 * customer the order belongs to. Order numbers are sequential, so the number
 * alone must not be enough to touch someone's order.
 *
 * One Razorpay order is created per app order and reused on every retry.
 * Creating a new one each time overwrote razorpayOrderId, so a payment made
 * against the earlier Razorpay order couldn't be matched by verify or the
 * webhook, and was silently lost.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";

    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId is required" }, { status: 400 });
    }

    const customerId = await getCustomerId();
    if (!customerId) {
      return NextResponse.json(
        { success: false, code: "SIGN_IN_REQUIRED", error: "Please sign in to pay for your order." },
        { status: 401 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { humanId: { equals: orderId, mode: "insensitive" } },
      include: { items: true },
    });
    // Someone else's order looks the same as a missing one.
    if (!order || !(await customerOwnsOrder(customerId, order))) {
      return NextResponse.json({ success: false, error: NOT_FOUND }, { status: 404 });
    }

    if (order.paymentStatus === "Paid") {
      return NextResponse.json({ success: false, error: "Order is already paid" }, { status: 400 });
    }

    if (order.status === "Cancelled") {
      return NextResponse.json(
        { success: false, error: "This order was cancelled. Please place a new order." },
        { status: 409 }
      );
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
    const amountInPaise = Math.round(order.total * 100);

    // Reuse the Razorpay order from an earlier attempt (Razorpay allows
    // several payment attempts on one order).
    let razorpayOrderId: string | null = null;
    if (order.razorpayOrderId) {
      const existing = await instance.orders.fetch(order.razorpayOrderId);
      if (existing.status === "paid") {
        // Money was taken; verify/webhook will mark the order Paid. Don't let them pay twice.
        return NextResponse.json(
          { success: false, error: "We've already received your payment and are confirming it. Please check your order in a minute." },
          { status: 409 }
        );
      }
      if (Number(existing.amount) === amountInPaise) razorpayOrderId = existing.id;
    }

    // Retrying payment after the stock hold expired (or after a failed
    // payment released it): take the stock again before letting them pay,
    // and restart the hold so it isn't released mid-payment.
    try {
      if (order.stockReserved) {
        await prisma.order.update({ where: { id: order.id }, data: { stockReservedAt: new Date() } });
      } else {
        await prisma.$transaction((tx) => reserveOrderStock(tx, order));
      }
    } catch (err) {
      if (err instanceof OutOfStockError) {
        return NextResponse.json({ success: false, error: err.message, code: "OUT_OF_STOCK" }, { status: 409 });
      }
      throw err;
    }

    if (!razorpayOrderId) {
      const razorpayOrder = await instance.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: order.humanId,
      });
      razorpayOrderId = razorpayOrder.id;
      await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId } });
    }

    return NextResponse.json({
      success: true,
      razorpayOrderId,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
