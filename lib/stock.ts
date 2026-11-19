import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Stock is reserved when an order is placed (so two customers can't both buy
 * the last saree) and released when the order is cancelled, its payment fails,
 * it's deleted before shipping, or checkout is abandoned unpaid for
 * RESERVATION_MINUTES. Order.stockReserved records whether an order currently
 * holds stock, which makes every reserve/release safe to repeat.
 *
 * For a product with colours, both the colour's stock and the product's total
 * stock (the sum of its colours) move together.
 */

export const RESERVATION_MINUTES = 30;

type Tx = Prisma.TransactionClient;

export interface StockLine {
  productId: string | null;
  variantId: string | null;
  quantity: number;
  name: string;
  selectedColor?: string | null;
}

export class OutOfStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutOfStockError";
  }
}

/** Sums quantities per product/colour so a repeated line is checked once. */
function group(lines: StockLine[]) {
  const map = new Map<string, StockLine>();
  for (const l of lines) {
    if (!l.productId) continue;
    const key = `${l.productId}|${l.variantId ?? ""}`;
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, quantity: prev.quantity + l.quantity } : { ...l });
  }
  return [...map.values()];
}

/**
 * Takes stock for every line, or throws OutOfStockError and takes nothing
 * (call inside a transaction so a later failure rolls earlier lines back).
 * Each decrement only succeeds if enough stock is left at that moment.
 */
export async function reserveStock(tx: Tx, lines: StockLine[]) {
  for (const l of group(lines)) {
    const label = l.selectedColor && l.variantId ? `${l.name} (${l.selectedColor})` : l.name;

    if (l.variantId) {
      const took = await tx.productVariant.updateMany({
        where: { id: l.variantId, productId: l.productId!, stock: { gte: l.quantity } },
        data: { stock: { decrement: l.quantity } },
      });
      if (took.count === 0) throw new OutOfStockError(await soldOutMessage(tx, label, l));
      // Keep the product's total in step with its colours (never below 0).
      await tx.product.updateMany({
        where: { id: l.productId!, stock: { gte: l.quantity } },
        data: { stock: { decrement: l.quantity } },
      });
    } else {
      const took = await tx.product.updateMany({
        where: { id: l.productId!, stock: { gte: l.quantity } },
        data: { stock: { decrement: l.quantity } },
      });
      if (took.count === 0) throw new OutOfStockError(await soldOutMessage(tx, label, l));
    }
  }
}

async function soldOutMessage(tx: Tx, label: string, l: StockLine) {
  const row = l.variantId
    ? await tx.productVariant.findUnique({ where: { id: l.variantId }, select: { stock: true } })
    : await tx.product.findUnique({ where: { id: l.productId! }, select: { stock: true } });
  const left = Math.max(0, row?.stock ?? 0);
  return left === 0
    ? `Sorry, "${label}" just sold out. Please remove it from your bag.`
    : `Only ${left} of "${label}" left. Please reduce the quantity in your bag.`;
}

/** Puts stock back for every line. Rows deleted since are skipped. */
export async function releaseStock(tx: Tx, lines: StockLine[]) {
  for (const l of group(lines)) {
    if (l.variantId) {
      await tx.productVariant.updateMany({
        where: { id: l.variantId },
        data: { stock: { increment: l.quantity } },
      });
    }
    await tx.product.updateMany({
      where: { id: l.productId! },
      data: { stock: { increment: l.quantity } },
    });
  }
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>;

export const linesOf = (order: OrderWithItems): StockLine[] =>
  order.items.map((i) => ({
    productId: i.productId,
    variantId: i.variantId,
    quantity: i.quantity,
    name: i.name,
    selectedColor: i.selectedColor,
  }));

/**
 * Releases an order's stock if it still holds any. The stockReserved flag is
 * flipped first with a conditional update, so concurrent callers (webhook +
 * admin, say) can't both put the stock back.
 */
export async function releaseOrderStock(tx: Tx, order: OrderWithItems): Promise<boolean> {
  const claimed = await tx.order.updateMany({
    where: { id: order.id, stockReserved: true },
    data: { stockReserved: false },
  });
  if (claimed.count === 0) return false;
  await releaseStock(tx, linesOf(order));
  return true;
}

/**
 * Re-takes stock for an order that doesn't hold any (e.g. paid after its
 * reservation expired, or un-cancelled by the admin). Throws OutOfStockError
 * if there isn't enough.
 */
export async function reserveOrderStock(tx: Tx, order: OrderWithItems): Promise<boolean> {
  const claimed = await tx.order.updateMany({
    where: { id: order.id, stockReserved: false },
    data: { stockReserved: true, stockReservedAt: new Date() },
  });
  if (claimed.count === 0) return false;
  await reserveStock(tx, linesOf(order));
  return true;
}

/**
 * Releases stock held by online-payment orders that were never paid within
 * RESERVATION_MINUTES. Called before stock is checked, so abandoned
 * checkouts don't keep sarees out of stock.
 */
export async function releaseExpiredReservations() {
  const cutoff = new Date(Date.now() - RESERVATION_MINUTES * 60 * 1000);
  const expired = await prisma.order.findMany({
    where: {
      stockReserved: true,
      paymentStatus: { in: ["Pending", "Failed"] },
      stockReservedAt: { lt: cutoff },
    },
    include: { items: true },
    take: 100,
  });
  for (const order of expired) {
    await prisma.$transaction((tx) => releaseOrderStock(tx, order));
  }
  return expired.length;
}
