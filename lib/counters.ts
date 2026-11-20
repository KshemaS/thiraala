import prisma from "@/lib/prisma";

/**
 * Order numbers (THR-1087, THR-1088, …) from a database counter that is
 * incremented atomically, so two orders placed at the same moment can never
 * get the same number. The first time it's used it starts after the highest
 * existing THR- number.
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

export async function nextOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const row = await prisma.counter.update({
        where: { name: ORDER_COUNTER },
        data: { value: { increment: 1 } },
      });
      return `THR-${row.value}`;
    } catch (err: any) {
      if (err?.code !== "P2025") throw err; // P2025: counter not created yet
    }
    try {
      const start = (await highestExistingOrderNumber()) + 1;
      await prisma.counter.create({ data: { name: ORDER_COUNTER, value: start } });
      return `THR-${start}`;
    } catch (err: any) {
      if (err?.code !== "P2002") throw err; // another request created it first: retry the increment
    }
  }
  throw new Error("Could not allocate an order number.");
}
