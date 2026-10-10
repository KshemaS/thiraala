import { NextResponse } from "next/server";
import { getOrdersFromFile, saveOrdersToFile, Order, OrderStatus } from "../route";

// GET single order by id
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orders = getOrdersFromFile();
    const order = orders.find(
      (o) => o.id.toLowerCase() === id.trim().toLowerCase()
    );

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order });
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
  try {
    const { id } = await params;
    const body = await request.json();
    const orders = getOrdersFromFile();
    const orderIndex = orders.findIndex(
      (o) => o.id.toLowerCase() === id.trim().toLowerCase()
    );

    if (orderIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    const order = orders[orderIndex];
    const now = new Date().toISOString();

    const {
      status,
      trackingNumber,
      courierName,
      paymentStatus,
      notes,
      timelineUpdate,
    } = body;

    // Update fields if provided
    if (status !== undefined) {
      order.status = status as OrderStatus;

      // Update timeline automatically based on status progression
      if (Array.isArray(order.trackingTimeline)) {
        if (status === "Confirmed") {
          if (order.trackingTimeline[1]) {
            order.trackingTimeline[1].completed = true;
            if (!order.trackingTimeline[1].timestamp) order.trackingTimeline[1].timestamp = now;
          }
        } else if (status === "Shipped") {
          if (order.trackingTimeline[1]) {
            order.trackingTimeline[1].completed = true;
            if (!order.trackingTimeline[1].timestamp) order.trackingTimeline[1].timestamp = now;
          }
          if (order.trackingTimeline[2]) {
            order.trackingTimeline[2].completed = true;
            if (!order.trackingTimeline[2].timestamp) order.trackingTimeline[2].timestamp = now;
            if (courierName || trackingNumber) {
              order.trackingTimeline[2].description = `Dispatched via ${courierName || "Courier"}${
                trackingNumber ? ` (Tracking: ${trackingNumber})` : ""
              }.`;
            }
          }
        } else if (status === "Delivered") {
          order.trackingTimeline.forEach((t) => {
            t.completed = true;
            if (!t.timestamp) t.timestamp = now;
          });
          order.paymentStatus = "Paid";
        } else if (status === "Cancelled") {
          order.trackingTimeline.push({
            title: "Order Cancelled",
            description: "The order has been cancelled.",
            timestamp: now,
            completed: true,
          });
        }
      }
    }

    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (courierName !== undefined) order.courierName = courierName;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    if (notes !== undefined) order.notes = notes;

    if (timelineUpdate && Array.isArray(timelineUpdate)) {
      order.trackingTimeline = timelineUpdate;
    }

    order.updatedAt = now;
    orders[orderIndex] = order;

    const saved = saveOrdersToFile(orders);
    if (!saved) {
      return NextResponse.json(
        { success: false, error: "Failed to persist order updates" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order,
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
  try {
    const { id } = await params;
    const orders = getOrdersFromFile();
    const filtered = orders.filter(
      (o) => o.id.toLowerCase() !== id.trim().toLowerCase()
    );

    if (filtered.length === orders.length) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    saveOrdersToFile(filtered);
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
