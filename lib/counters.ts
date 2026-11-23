import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Order numbers (THR-1087, THR-1088, …) from a database counter that is
 * incremented atomically, so two orders placed at the same moment can never
 * get the same number. The first time it's used it starts after the highest
 * existing THR- number.
 *
 * The number is taken inside the transaction that saves the order, so an
 * order that fails (e.g. out of stock) rolls the counter back too and leaves
 * no gap in the numbering.
 */

const ORDER_COUNTER = "order";
const FIRST_ORDER_NUMBER = 1087;

async function highestExistingOrderNumber(): Promise<number> {
  const orders = await prisma.order.findMany({ select: { humanId: true } });
  let max = FIRST_ORDER_NUMBER - 1;
  for (const o of orders) {
    const m = /^THR-(\d+)$/i.exec(o.humanId);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

/**
 * Creates the counter (at the highest existing number) if it doesn't exist
 * yet. Call before the order transaction: a failed insert inside a Postgres
 * transaction would abort it.
 */
export async function ensureOrderCounter(): Promise<void> {
  if (await prisma.counter.findUnique({ where: { name: ORDER_COUNTER } })) return;
  try {
    await prisma.counter.create({ data: { name: ORDER_COUNTER, value: await highestExistingOrderNumber() } });
  } catch (err: any) {
    if (err?.code !== "P2002") throw err; // another request created it first
  }
}

/** The next order number, taken inside the order's own transaction. */
export async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const row = await tx.counter.update({
    where: { name: ORDER_COUNTER },
    data: { value: { increment: 1 } },
  });
  return `THR-${row.value}`;
}
