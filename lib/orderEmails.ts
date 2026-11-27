import { after } from "next/server";
import type { Order, OrderItem } from "@prisma/client";
import prisma from "@/lib/prisma";
import { emailButton, emailLayout, escapeHtml, sendEmail, SITE_URL } from "@/lib/email";

/**
 * Order emails: confirmation to the customer and an alert to the shop when an
 * order is paid; updates to the customer when it is dispatched or delivered.
 * They're sent after the response (next/server `after`), so a slow or failing
 * email never delays or breaks the order itself.
 */

type OrderWithItems = Order & { items: OrderItem[] };
export type OrderEmailKind = "paid" | "dispatched" | "delivered";

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

async function customerEmail(order: Order): Promise<string | null> {
  if (order.email) return order.email;
  if (!order.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { email: true } });
  return user?.email ?? null;
}

function itemsTable(order: OrderWithItems): { html: string; text: string } {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${escapeHtml(i.name)}${i.selectedColor ? ` <span style="color:#6b7b71">(${escapeHtml(i.selectedColor)})</span>` : ""} × ${i.quantity}</td><td align="right" style="padding:6px 0">${rupees(i.priceValue * i.quantity)}</td></tr>`
    )
    .join("");
  const subtotal = order.subtotal ?? order.total - order.deliveryFee;
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #eee7da;border-bottom:1px solid #eee7da;margin:16px 0">
${rows}
<tr><td style="padding:6px 0;color:#6b7b71">Subtotal</td><td align="right" style="padding:6px 0;color:#6b7b71">${rupees(subtotal)}</td></tr>
<tr><td style="padding:6px 0;color:#6b7b71">Delivery</td><td align="right" style="padding:6px 0;color:#6b7b71">${order.deliveryFee ? rupees(order.deliveryFee) : "Free"}</td></tr>
<tr><td style="padding:8px 0;font-weight:bold">Total paid</td><td align="right" style="padding:8px 0;font-weight:bold">${rupees(order.total)}</td></tr>
</table>`;
  const text =
    order.items.map((i) => `- ${i.name}${i.selectedColor ? ` (${i.selectedColor})` : ""} x ${i.quantity}: ${rupees(i.priceValue * i.quantity)}`).join("\n") +
    `\nDelivery: ${order.deliveryFee ? rupees(order.deliveryFee) : "Free"}\nTotal paid: ${rupees(order.total)}`;
  return { html, text };
}

const trackLink = (order: Order) => `${SITE_URL}/track-order?id=${encodeURIComponent(order.humanId)}`;

async function send(kind: OrderEmailKind, orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  const to = await customerEmail(order);
  const firstName = escapeHtml(order.customerName.split(" ")[0] || order.customerName);
  const items = itemsTable(order);
  const track = trackLink(order);

  if (kind === "paid") {
    if (to) {
      await sendEmail({
        to,
        subject: `Order ${order.humanId} confirmed`,
        text: `Hi ${order.customerName},\n\nThank you for your order! We've received your payment for order ${order.humanId}.\n\n${items.text}\n\nWe'll email you again when it's dispatched. Track your order: ${track}`,
        html: emailLayout(
          `Thank you! Order ${order.humanId} is confirmed`,
          `<p>Hi ${firstName},</p><p>We've received your payment and are getting your saree ready. We'll email you again when it's dispatched.</p>${items.html}<p style="font-size:14px"><strong>Delivering to:</strong><br>${escapeHtml(order.address)}${order.pincode ? ` - ${escapeHtml(order.pincode)}` : ""}</p>${emailButton(track, "Track your order")}`
        ),
      });
    }
    const shop = process.env.SHOP_ALERT_EMAIL;
    if (shop) {
      const flag = order.attentionReason ? `\n\nNEEDS ATTENTION: ${order.attentionReason}` : "";
      await sendEmail({
        to: shop,
        subject: `New order ${order.humanId} · ${rupees(order.total)}${order.attentionReason ? " · needs attention" : ""}`,
        text: `New paid order ${order.humanId} from ${order.customerName} (${order.phone}).\n\n${items.text}${flag}\n\nOpen the dashboard: ${SITE_URL}/dashboard/orders`,
        html: emailLayout(
          `New order ${order.humanId}`,
          `${order.attentionReason ? `<p style="padding:10px 12px;background:#fff4e5;border-radius:8px;color:#8a4b00"><strong>Needs attention:</strong> ${escapeHtml(order.attentionReason)}</p>` : ""}<p><strong>${escapeHtml(order.customerName)}</strong> · ${escapeHtml(order.phone)}<br>${escapeHtml(order.address)}${order.pincode ? ` - ${escapeHtml(order.pincode)}` : ""}</p>${items.html}${emailButton(`${SITE_URL}/dashboard/orders`, "Open orders")}`
        ),
      });
    }
    return;
  }

  if (!to) return;
  if (kind === "dispatched") {
    const courier = [order.courierName, order.trackingNumber].filter(Boolean).join(" · tracking number ");
    await sendEmail({
      to,
      subject: `Order ${order.humanId} has been dispatched`,
      text: `Hi ${order.customerName},\n\nGood news: your order ${order.humanId} is on its way.${courier ? `\nCourier: ${courier}` : ""}\n\nTrack your order: ${track}`,
      html: emailLayout(
        `Your order is on its way`,
        `<p>Hi ${firstName},</p><p>Good news: order <strong>${escapeHtml(order.humanId)}</strong> has been dispatched.</p>${courier ? `<p><strong>Courier:</strong> ${escapeHtml(courier)}</p>` : ""}${items.html}${emailButton(track, "Track your order")}`
      ),
    });
  } else {
    await sendEmail({
      to,
      subject: `Order ${order.humanId} has been delivered`,
      text: `Hi ${order.customerName},\n\nYour order ${order.humanId} has been delivered. We hope you love your saree!\n\nIf anything is wrong, please contact us with your parcel opening video: ${SITE_URL}/contact`,
      html: emailLayout(
        `Your order has been delivered`,
        `<p>Hi ${firstName},</p><p>Order <strong>${escapeHtml(order.humanId)}</strong> has been delivered. We hope you love your saree!</p><p style="font-size:14px">If anything arrived damaged, please <a href="${SITE_URL}/contact" style="color:#1E3A2C">contact us</a> with your parcel opening video.</p>`
      ),
    });
  }
}

/** Queue an order email to go out after the current response is sent. */
export function queueOrderEmail(kind: OrderEmailKind, orderId: string) {
  after(async () => {
    try {
      await send(kind, orderId);
    } catch (err) {
      console.error(`Order email (${kind}) for ${orderId} failed:`, err);
    }
  });
}
