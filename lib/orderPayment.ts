import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { OutOfStockError, releaseOrderStock, reserveOrderStock } from "@/lib/stock";
import { queueOrderEmail } from "@/lib/orderEmails";

interface TrackingEvent {
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

// Admin-only reasons stored in Order.attentionReason (never shown to customers).
export const STOCK_CONFLICT_NOTE =
  "Paid after the 30-minute stock hold expired, and an item has since sold out. Refund the customer or restock before confirming.";

export const CANCELLED_PAID_NOTE =
  "Payment received after this order was cancelled. Refund the customer, or restore the order.";

/**
 * Marks an order paid (from the client verify call or the Razorpay webhook,
 * whichever arrives first). If the order's stock hold had expired, stock is
 * taken again; if that's no longer possible the order stays Pending and is
 * flagged (attentionReason) so the admin can refund or restock.
 */
export async function markOrderPaid(
  orderId: string,
  payment: { razorpayPaymentId?: string | null; razorpaySignature?: string | null }
) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;
  if (order.paymentStatus === "Paid") return order;

  let stockOk = true;
  if (!order.stockReserved && order.status !== "Cancelled") {
    try {
      await prisma.$transaction((tx) => reserveOrderStock(tx, order));
    } catch (err) {
      if (!(err instanceof OutOfStockError)) throw err;
      stockOk = false;
    }
  }

  const timeline = (order.trackingTimeline as unknown as TrackingEvent[]) || [];
  if (stockOk && timeline[1]) {
    timeline[1].completed = true;
    timeline[1].timestamp = timeline[1].timestamp || new Date().toISOString();
  }

  const warning =
    order.status === "Cancelled" ? CANCELLED_PAID_NOTE : !stockOk ? STOCK_CONFLICT_NOTE : null;

  // Conditional on still being unpaid: the client verify call and the webhook
  // can arrive together, and only the one that flips the status sends emails.
  const flipped = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: { not: "Paid" } },
    data: {
      paymentStatus: "Paid",
      status: stockOk && order.status === "Pending" ? "Order Confirmed" : order.status,
      razorpayPaymentId: payment.razorpayPaymentId || order.razorpayPaymentId,
      ...(payment.razorpaySignature ? { razorpaySignature: payment.razorpaySignature } : {}),
      ...(warning ? { attentionReason: warning } : {}),
      trackingTimeline: timeline as unknown as Prisma.InputJsonValue,
    },
  });
  if (flipped.count === 1) queueOrderEmail("paid", order.id);
  return prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
}

/** A failed payment frees the order's stock straight away. */
export async function markOrderPaymentFailed(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.paymentStatus !== "Pending") return;
  await prisma.$transaction(async (tx) => {
    await releaseOrderStock(tx, order);
    await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "Failed" } });
  });
}
