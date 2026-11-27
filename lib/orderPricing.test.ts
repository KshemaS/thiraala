import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ product: { findMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ default: db }));
vi.mock("@/lib/imageRefs", () => ({ OMIT_PHOTOS: {}, attachImageRefs: async <T,>(rows: T) => rows }));
vi.mock("@/lib/delivery", async (importActual) => ({
  ...(await importActual<typeof import("./delivery")>()),
  quoteDelivery: vi.fn(async (_pin: string, sarees: number) => ({ fee: 100 + 50 * (sarees - 1) })),
}));

import { priceOrder } from "./orderPricing";

const updatedAt = new Date("2026-11-01T00:00:00Z");
const product = (over: Record<string, unknown> = {}) => ({
  id: "p1",
  sku: "SAR-1",
  name: "Kasavu",
  status: "active",
  priceValue: 1200,
  categoryName: "Kerala Saree",
  color: "Cream",
  selectedColor: null,
  foldedImg: "/images/a.jpg",
  wornImg: null,
  updatedAt,
  variants: [],
  ...over,
});

describe("priceOrder", () => {
  beforeEach(() => db.product.findMany.mockReset());

  it("rejects a bad pincode, an empty bag and bad quantities before touching the database", async () => {
    expect(await priceOrder([{ id: "p1", quantity: 1 }], "12345")).toMatchObject({ ok: false, status: 400 });
    expect(await priceOrder([], "682001")).toMatchObject({ ok: false, status: 400 });
    expect(await priceOrder([{ id: "p1", quantity: 0 }], "682001")).toMatchObject({ ok: false, status: 400 });
    expect(await priceOrder([{ id: "p1", quantity: 11 }], "682001")).toMatchObject({ ok: false, status: 400 });
    expect(await priceOrder([{ id: "p1", quantity: 1.5 }], "682001")).toMatchObject({ ok: false, status: 400 });
    expect(db.product.findMany).not.toHaveBeenCalled();
  });

  it("prices from the database, ignoring any price the browser sends", async () => {
    db.product.findMany.mockResolvedValue([product()]);
    const r = await priceOrder([{ id: "p1", quantity: 2, price: "₹1", priceValue: 1 }], "682001");
    expect(r).toMatchObject({ ok: true, subtotal: 2400, deliveryFee: 150, discount: 0, total: 2550 });
    if (r.ok) expect(r.lines[0]).toMatchObject({ productId: "p1", priceValue: 1200, quantity: 2, price: "₹1,200" });
  });

  it("uses the colour's own price and photo", async () => {
    db.product.findMany.mockResolvedValue([
      product({ variants: [{ id: "v1", sku: "SAR-1-RED", name: "Red", priceValue: 1500, foldedImg: "/images/red.jpg", wornImg: null, updatedAt }] }),
    ]);
    const r = await priceOrder([{ productId: "p1", variantId: "v1", quantity: 1 }], "682001");
    expect(r).toMatchObject({ ok: true, subtotal: 1500 });
    if (r.ok) expect(r.lines[0]).toMatchObject({ sku: "SAR-1-RED", selectedColor: "Red", foldedImg: "/images/red.jpg" });
  });

  it("refuses hidden or missing products", async () => {
    db.product.findMany.mockResolvedValue([product({ status: "inactive" })]);
    expect(await priceOrder([{ id: "p1", quantity: 1 }], "682001")).toMatchObject({ ok: false, status: 409 });
    db.product.findMany.mockResolvedValue([]);
    expect(await priceOrder([{ id: "p1", quantity: 1 }], "682001")).toMatchObject({ ok: false, status: 409 });
  });

  it("needs a colour for a product that has colours, and a colour that still exists", async () => {
    db.product.findMany.mockResolvedValue([
      product({ variants: [{ id: "v1", sku: "S", name: "Red", priceValue: null, foldedImg: null, wornImg: null, updatedAt }] }),
    ]);
    expect(await priceOrder([{ id: "p1", quantity: 1 }], "682001")).toMatchObject({ ok: false, status: 409 });
    expect(await priceOrder([{ id: "p1", variantId: "gone", quantity: 1 }], "682001")).toMatchObject({ ok: false, status: 409 });
  });

  it("refuses a product without a usable price", async () => {
    db.product.findMany.mockResolvedValue([product({ priceValue: 0 })]);
    expect(await priceOrder([{ id: "p1", quantity: 1 }], "682001")).toMatchObject({ ok: false, status: 409 });
  });
});
