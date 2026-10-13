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

    // Update field values if provided
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (courierName !== undefined) order.courierName = courierName;
    if (paymentStatus !== undefined) order.paymentStatus = paymentStatus;
    if (notes !== undefined) order.notes = notes;

    // Update status and synchronize timeline if provided
    if (status !== undefined) {
      order.status = status as OrderStatus;

      // Ensure 5 standard tracking steps exist
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

      // Normalize timeline if needed
      if (!Array.isArray(order.trackingTimeline) || order.trackingTimeline.length < 5) {
        order.trackingTimeline = STANDARD_STEPS.map((step, idx) => {
          const existing = order.trackingTimeline?.[idx];
          return {
            title: step.title,
            description: existing?.description || step.description,
            timestamp: existing?.timestamp || (idx === 0 ? order.createdAt || now : ""),
            completed: existing ? existing.completed : idx === 0,
          };
        });
      } else {
        // Ensure standard titles
        STANDARD_STEPS.forEach((step, idx) => {
          if (order.trackingTimeline[idx]) {
            order.trackingTimeline[idx].title = step.title;
          }
        });
      }

      // Determine completion level based on status
      let completeUpToIndex = 0; // 0: Placed
      if (status === "Order Confirmed" || status === "Confirmed") {
        completeUpToIndex = 1;
      } else if (status === "Dispatched" || status === "Shipped") {
        completeUpToIndex = 2;
      } else if (status === "In Transit") {
        completeUpToIndex = 3;
      } else if (status === "Delivered") {
        completeUpToIndex = 4;
        order.paymentStatus = "Paid";
      }

      if (status !== "Cancelled") {
        // Remove any prior cancellation step if transitioning back to active
        order.trackingTimeline = order.trackingTimeline.filter(
          (t) => t.title !== "Order Cancelled"
        );

        order.trackingTimeline.forEach((t, idx) => {
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

        // Add custom courier details to Dispatched step
        if (completeUpToIndex >= 2 && (courierName || trackingNumber)) {
          order.trackingTimeline[2].description = `Dispatched via ${courierName || order.courierName || "Courier"}${
            trackingNumber || order.trackingNumber ? ` (Tracking ID: ${trackingNumber || order.trackingNumber})` : ""
          }.`;
        }
      } else {
        // Order Cancelled
        const hasCancelStep = order.trackingTimeline.some((t) => t.title === "Order Cancelled");
        if (!hasCancelStep) {
          order.trackingTimeline.push({
            title: "Order Cancelled",
            description: notes || "The order was cancelled by administrator.",
            timestamp: now,
            completed: true,
          });
        }
      }
    }

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
