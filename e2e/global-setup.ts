import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { STATE_FILE, TEST_SKU_PREFIX, type E2EState } from "./testData";
import { cleanUp } from "./global-teardown";

/**
 * Creates an active, in-stock product the specs can order, so they don't
 * depend on what the shop happens to have in stock. The database is the one
 * in .env, so global-teardown deletes it again along with the test accounts
 * and orders.
 */
export default async function globalSetup() {
  // A previous run that crashed may have left its data behind.
  if (fs.existsSync(STATE_FILE)) await cleanUp();

  const prisma = new PrismaClient();
  try {
    // Taken first, so teardown's time window covers everything the run creates.
    const startedAt = new Date().toISOString();
    const counter = await prisma.counter.findUnique({ where: { name: "order" } });
    const stamp = Date.now();
    const product = await prisma.product.create({
      data: {
        sku: `${TEST_SKU_PREFIX}${stamp}`,
        slug: `e2e-test-${stamp}`,
        name: "E2E test saree (not for sale)",
        price: "₹1,999",
        priceValue: 1999,
        categoryName: "E2E Test",
        stock: 50,
        status: "active",
      },
    });
    const state: E2EState = {
      startedAt,
      orderCounter: counter?.value ?? null,
      product: { id: product.id, slug: product.slug, name: product.name, priceValue: product.priceValue },
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}
