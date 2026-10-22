import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
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
    const order = await findOrderByHumanId(id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order: toOrderJSON(order) });
  } catch (error: any) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
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
          description: `Order placed successfully via ${order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}.`,
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

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: newStatus,
        trackingNumber: newTrackingNumber,
        courierName: newCourierName,
        paymentStatus: newPaymentStatus,
        notes: newNotes,
        trackingTimeline: timeline,
      },
      include: { items: true },
    });

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: toOrderJSON(updated),
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

    await prisma.order.delete({ where: { id: order.id } });

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
