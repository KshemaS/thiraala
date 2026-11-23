import type { Order, OrderItem } from "@prisma/client";

/**
 * Who may see an order. Order numbers are sequential (THR-1098, THR-1099…),
 * so knowing one must never be enough to read a customer's details:
 *  - the admin sees everything;
 *  - a signed-in customer sees their own orders in full;
 *  - anyone else needs the order number AND the phone number used for it,
 *    and then gets a tracking view without the full address, email or phone.
 */

/** Last 10 digits, so "+91 98765 43210" and "9876543210" match. */
export const normalizePhone = (phone: string | null | undefined) => (phone || "").replace(/\D/g, "").slice(-10);

/**
 * Only orders placed while signed in to this account. Email and phone aren't
 * verified at signup, so matching on them would let anyone register with a
 * guest buyer's details and read that buyer's full order and address.
 */
export async function customerOwnsOrder(customerId: string, order: Pick<Order, "userId">) {
  return !!order.userId && order.userId === customerId;
}

export function phoneMatchesOrder(phone: string, order: Pick<Order, "phone">) {
  const given = normalizePhone(phone);
  return given.length === 10 && given === normalizePhone(order.phone);
}

const mask = (phone: string) => {
  const d = normalizePhone(phone);
  return d ? `••••••${d.slice(-4)}` : "";
};

/**
 * Tracking view for someone who proved the phone number: status, items,
 * totals and shipping progress, with the address reduced to town/state and
 * the phone masked. No email.
 */
export function publicTrackingView(order: Order & { items: OrderItem[] }) {
  const area = [order.city, order.district, order.state].filter(Boolean).join(", ");
  return {
    id: order.humanId,
    customerName: order.customerName,
    phone: mask(order.phone),
    address: [area, order.pincode].filter(Boolean).join(" - "),
    total: order.total,
    subtotal: order.subtotal ?? order.total,
    deliveryFee: order.deliveryFee,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    trackingNumber: order.trackingNumber || "",
    courierName: order.courierName || "",
    trackingTimeline: order.trackingTimeline,
    items: order.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      priceValue: i.priceValue,
      quantity: i.quantity,
      foldedImg: i.foldedImg || undefined,
      wornImg: i.wornImg || undefined,
      selectedColor: i.selectedColor || undefined,
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
