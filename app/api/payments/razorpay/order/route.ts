import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";

// POST create a Razorpay order for an already-created, Pending app order.
// Hit by the customer's browser during checkout — no admin auth required.
export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: { humanId: { equals: String(orderId).trim(), mode: "insensitive" } },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentStatus === "Paid") {
      return NextResponse.json(
        { success: false, error: "Order is already paid" },
        { status: 400 }
      );
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const amountInPaise = Math.round(order.total * 100);

    const razorpayOrder = await instance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.humanId,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    return NextResponse.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
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
