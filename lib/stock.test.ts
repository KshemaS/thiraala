import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ default: {} }));

import type { Prisma } from "@prisma/client";
import { OutOfStockError, releaseStock, reserveStock, type StockLine } from "./stock";

type Row = { stock: number };
type UpdateArgs = { where: { id: string; stock?: { gte: number } }; data: { stock: { decrement?: number; increment?: number } } };

/** In-memory stand-in for the two tables stock.ts touches. */
function fakeTx(products: Record<string, number>, variants: Record<string, Row & { productId: string }> = {}) {
  const updateMany = (rows: Record<string, Row>) => async ({ where, data }: UpdateArgs) => {
    const row = rows[where.id];
    if (!row || (where.stock && row.stock < where.stock.gte)) return { count: 0 };
    row.stock += (data.stock.increment ?? 0) - (data.stock.decrement ?? 0);
    return { count: 1 };
  };
  const productRows: Record<string, Row> = Object.fromEntries(Object.entries(products).map(([id, stock]) => [id, { stock }]));
  const tx = {
    product: {
      updateMany: updateMany(productRows),
      findUnique: async ({ where }: { where: { id: string } }) => productRows[where.id] ?? null,
    },
    productVariant: {
      updateMany: updateMany(variants),
      findUnique: async ({ where }: { where: { id: string } }) => variants[where.id] ?? null,
    },
  };
  return { tx: tx as unknown as Prisma.TransactionClient, productRows, variants };
}

const line = (over: Partial<StockLine>): StockLine => ({ productId: "p1", variantId: null, quantity: 1, name: "Kasavu", ...over });

describe("reserveStock", () => {
  it("takes stock for each line", async () => {
    const { tx, productRows } = fakeTx({ p1: 3, p2: 1 });
    await reserveStock(tx, [line({ quantity: 2 }), line({ productId: "p2" })]);
    expect(productRows.p1.stock).toBe(1);
    expect(productRows.p2.stock).toBe(0);
  });

  it("adds up repeated lines before checking", async () => {
    const { tx } = fakeTx({ p1: 3 });
    await expect(reserveStock(tx, [line({ quantity: 2 }), line({ quantity: 2 })])).rejects.toThrow("Only 3");
  });

  it("refuses when sold out, saying so", async () => {
    const { tx, productRows } = fakeTx({ p1: 0 });
    await expect(reserveStock(tx, [line({})])).rejects.toBeInstanceOf(OutOfStockError);
    await expect(reserveStock(tx, [line({})])).rejects.toThrow("just sold out");
    expect(productRows.p1.stock).toBe(0);
  });

  it("takes a colour's stock and keeps the product total in step", async () => {
    const { tx, productRows, variants } = fakeTx({ p1: 5 }, { v1: { productId: "p1", stock: 2 } });
    await reserveStock(tx, [line({ variantId: "v1", quantity: 2, selectedColor: "Red" })]);
    expect(variants.v1.stock).toBe(0);
    expect(productRows.p1.stock).toBe(3);
    await expect(reserveStock(tx, [line({ variantId: "v1", selectedColor: "Red" })])).rejects.toThrow("Kasavu (Red)");
  });
});

describe("releaseStock", () => {
  it("puts stock back for products and colours", async () => {
    const { tx, productRows, variants } = fakeTx({ p1: 0 }, { v1: { productId: "p1", stock: 0 } });
    await releaseStock(tx, [line({ variantId: "v1", quantity: 2 })]);
    expect(variants.v1.stock).toBe(2);
    expect(productRows.p1.stock).toBe(2);
  });
});
