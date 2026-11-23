import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { readState, STATE_FILE, TEST_EMAIL_DOMAIN, TEST_EMAIL_PREFIXES, TEST_SKU_PREFIX } from "./testData";

/**
 * Removes everything the e2e run created: test customer accounts, their
 * orders and wishlist items, and the test product. Puts the order counter
 * back when no real order was placed during the run.
 */
export async function cleanUp() {
  const state = fs.existsSync(STATE_FILE) ? readState() : null;
  const prisma = new PrismaClient();
  try {
    const since = state ? new Date(state.startedAt) : undefined;

    const users = await prisma.user.findMany({
      where: {
        ...(since ? { createdAt: { gte: since } } : {}),
        email: { endsWith: TEST_EMAIL_DOMAIN },
        OR: TEST_EMAIL_PREFIXES.map((p) => ({ email: { startsWith: p } })),
      },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    const orders = await prisma.order.deleteMany({ where: { userId: { in: userIds } } }); // items cascade
    await prisma.wishlistItem.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });

    const products = await prisma.product.findMany({ where: { sku: { startsWith: TEST_SKU_PREFIX } }, select: { id: true } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: products.map((p) => p.id) } } });
    await prisma.product.deleteMany({ where: { id: { in: products.map((p) => p.id) } } });

    // Give back the order numbers the test orders used, unless a real order
    // was placed meanwhile (then its number must stay unique; leave the gap).
    let counterNote = "unchanged";
    if (state && state.orderCounter !== null && orders.count > 0) {
      const realOrdersDuringRun = await prisma.order.count({ where: { createdAt: { gte: new Date(state.startedAt) } } });
      if (realOrdersDuringRun === 0) {
        await prisma.counter.update({ where: { name: "order" }, data: { value: state.orderCounter } });
        counterNote = `reset to ${state.orderCounter}`;
      } else {
        counterNote = `left as is (${realOrdersDuringRun} real order(s) placed during the run)`;
      }
    }

    console.log(
      `[e2e cleanup] removed ${userIds.length} test account(s), ${orders.count} order(s), ` +
        `${products.length} test product(s); order counter ${counterNote}.`
    );
  } finally {
    await prisma.$disconnect();
  }
  if (fs.existsSync(STATE_FILE)) fs.rmSync(STATE_FILE);
}

export default async function globalTeardown() {
  await cleanUp();
}
