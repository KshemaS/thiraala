import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getAdminSession, requireAdmin } from "@/lib/auth/guard";
import { getCustomerId } from "@/lib/auth/customerSession";
import { clientAddress, lockedMinutes, recordFailure, recordSuccess } from "@/lib/auth/loginThrottle";
import { customerOwnsOrder, phoneMatchesOrder, publicTrackingView } from "@/lib/orderAccess";
import { OutOfStockError, releaseOrderStock, reserveOrderStock } from "@/lib/stock";
import { toOrderJSON, type OrderStatus, type TrackingEvent } from "../route";

async function findOrderByHumanId(id: string) {
  return prisma.order.findFirst({
    where: { humanId: { equals: id.trim(), mode: "insensitive" } },
    include: { items: true },
  });
}

// GET single order by id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Admin: the full order.
    if (await getAdminSession()) {
      const order = await findOrderByHumanId(id);
      if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      return NextResponse.json({ success: true, order: toOrderJSON(order, { admin: true }) });
    }

    // Signed-in customer: their own order in full.
    const customerId = await getCustomerId();
    const order = await findOrderByHumanId(id);
    if (order && customerId && (await customerOwnsOrder(customerId, order))) {
      return NextResponse.json({ success: true, order: toOrderJSON(order) });
    }

    // Anyone else: order number + the phone number used for it.
    const phone = new URL(request.url).searchParams.get("phone") || "";
    if (!phone.trim()) {
      // Same answer whether or not the order exists, so numbers can't be probed.
      return NextResponse.json(
        { success: false, needsPhone: true, error: "Enter the phone number you used for this order." },
        { status: 401 }
      );
    }

    const address = clientAddress(request);
    const orderKey = id.trim().toUpperCase();
    const locked = await lockedMinutes("track", orderKey, address);
    if (locked > 0) {
      return NextResponse.json(
        { success: false, error: `Too many attempts. Please try again in ${locked} minute${locked === 1 ? "" : "s"}.` },
        { status: 429, headers: { "Retry-After": String(locked * 60) } }
      );
    }
    if (!order || !phoneMatchesOrder(phone, order)) {
      await recordFailure("track", orderKey, address);
      return NextResponse.json(
        { success: false, error: "We couldn't find an order with that order ID and phone number." },
        { status: 404 }
      );
    }
    await recordSuccess("track", orderKey, address);
    return NextResponse.json({ success: true, order: publicTrackingView(order) });
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH update order status, courier info, tracking events, or notes
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json();
    const order = await findOrderByHumanId(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const {
      status,
      trackingNumber,
      courierName,
      paymentStatus,
      notes,
      timelineUpdate,
      resolveAttention,
    } = body;

    let timeline = (order.trackingTimeline as unknown as TrackingEvent[]) || [];
    let newPaymentStatus = order.paymentStatus;
    let newTrackingNumber = order.trackingNumber;
    let newCourierName = order.courierName;
    let newNotes = order.notes;
    let newStatus = order.status;

    if (trackingNumber !== undefined) newTrackingNumber = trackingNumber;
    if (courierName !== undefined) newCourierName = courierName;
    if (paymentStatus !== undefined) newPaymentStatus = paymentStatus;
    if (notes !== undefined) newNotes = notes;

    if (status !== undefined) {
      newStatus = status as OrderStatus;

      const STANDARD_STEPS = [
        {
          title: "Order Placed",
          description: "Order placed successfully via Online Payment.",
        },
        {
          title: "Order Confirmed",
          description: "Artisanal handloom drape inspected and confirmed by Thiraala boutique.",
        },
        {
          title: "Dispatched",
          description: "Consignment packed and dispatched from Thiraala fulfillment center.",
        },
        {
          title: "In Transit",
          description: "Package is on its way and in transit to your shipping address.",
        },
        {
          title: "Delivered",
          description: "Order completed and delivered to customer. Enjoy your drape!",
        },
      ];

      if (!Array.isArray(timeline) || timeline.length < 5) {
        timeline = STANDARD_STEPS.map((step, idx) => {
          const existing = timeline?.[idx];
          return {
            title: step.title,
            description: existing?.description || step.description,
            timestamp: existing?.timestamp || (idx === 0 ? order.createdAt.toISOString() : ""),
            completed: existing ? existing.completed : idx === 0,
          };
        });
      } else {
        STANDARD_STEPS.forEach((step, idx) => {
          if (timeline[idx]) {
            timeline[idx].title = step.title;
          }
        });
      }

      let completeUpToIndex = 0;
      if (newStatus === "Order Confirmed" || newStatus === "Confirmed") {
        completeUpToIndex = 1;
      } else if (newStatus === "Dispatched" || newStatus === "Shipped") {
        completeUpToIndex = 2;
      } else if (newStatus === "In Transit") {
        completeUpToIndex = 3;
      } else if (newStatus === "Delivered") {
        completeUpToIndex = 4;
        newPaymentStatus = "Paid";
      }

      if (newStatus !== "Cancelled") {
        timeline = timeline.filter((t) => t.title !== "Order Cancelled");

        timeline.forEach((t, idx) => {
          if (idx <= completeUpToIndex) {
            t.completed = true;
            if (!t.timestamp) {
              t.timestamp = now;
            }
          } else {
            t.completed = false;
            t.timestamp = "";
          }
        });

        if (completeUpToIndex >= 2 && (courierName || trackingNumber)) {
          timeline[2].description = `Dispatched via ${courierName || newCourierName || "Courier"}${
            trackingNumber || newTrackingNumber ? ` (Tracking ID: ${trackingNumber || newTrackingNumber})` : ""
          }.`;
        }
      } else {
        const hasCancelStep = timeline.some((t) => t.title === "Order Cancelled");
        if (!hasCancelStep) {
          timeline.push({
            title: "Order Cancelled",
            description: notes || "The order was cancelled by administrator.",
            timestamp: now,
            completed: true,
          });
        }
      }
    }

    if (timelineUpdate && Array.isArray(timelineUpdate)) {
      timeline = timelineUpdate;
    }

    // Shipping rules: only paid orders go out, and the customer's tracking
    // page needs the courier + tracking number from the moment it's sent.
    const SHIPPED = ["Dispatched", "Shipped", "In Transit"];
    if (status !== undefined && SHIPPED.includes(newStatus) && !SHIPPED.includes(order.status)) {
      if (newPaymentStatus !== "Paid") {
        return NextResponse.json(
          { success: false, code: "NOT_PAID", error: `Order ${order.humanId} hasn't been paid, so it can't be marked as ${newStatus}.` },
          { status: 400 }
        );
      }
      if (!String(newTrackingNumber || "").trim() || !String(newCourierName || "").trim()) {
        return NextResponse.json(
          { success: false, code: "NEEDS_TRACKING", error: `Add the courier and tracking number to mark order ${order.humanId} as ${newStatus}.` },
          { status: 400 }
        );
      }
    }

    // Stock follows the order's status. Orders placed before stock tracking
    // existed (stockReservedAt never set) never took stock, so leave them be.
    const tracksStock = order.stockReservedAt !== null;
    const cancelling = newStatus === "Cancelled" && order.status !== "Cancelled";
    const reviving =
      tracksStock &&
      !order.stockReserved &&
      newStatus !== "Cancelled" &&
      newStatus !== order.status &&
      (order.status === "Cancelled" || order.status === "Pending");

    let updated;
    try {
      updated = await prisma.$transaction(async (tx) => {
        if (cancelling) await releaseOrderStock(tx, order);
        if (reviving) await reserveOrderStock(tx, order);
        return tx.order.update({
          where: { id: order.id },
          data: {
            status: newStatus,
            trackingNumber: newTrackingNumber,
            courierName: newCourierName,
            paymentStatus: newPaymentStatus,
            notes: newNotes,
            // Admin marked the flagged issue (refund/restock) as handled.
            ...(resolveAttention === true ? { attentionReason: null } : {}),
            trackingTimeline: timeline as unknown as Prisma.InputJsonValue,
          },
          include: { items: true },
        });
      });
    } catch (err) {
      if (err instanceof OutOfStockError) {
        return NextResponse.json(
          { success: false, error: `Can't change this order to "${newStatus}": ${err.message.replace(/ Please.*$/, "")}` },
          { status: 409 }
        );
      }
      throw err;
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: toOrderJSON(updated, { admin: true }),
    });
  } catch (error: any) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const order = await findOrderByHumanId(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Deleting an order that never shipped puts its stock back.
    const shipped = ["Dispatched", "Shipped", "In Transit", "Delivered"].includes(order.status);
    await prisma.$transaction(async (tx) => {
      if (!shipped) await releaseOrderStock(tx, order);
      await tx.order.delete({ where: { id: order.id } });
    });

    return NextResponse.json({
      success: true,
      message: `Order ${id} deleted successfully`,
    });
  } catch (error: any) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
