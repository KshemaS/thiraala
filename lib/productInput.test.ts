import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/productImages", () => ({ imageInputError: () => null, incomingImage: (v: unknown) => v }));

import { parseProductFields, productSlug } from "./productInput";

const parse = (body: Record<string, unknown>, requireCore = false) => parseProductFields(body, { requireCore });

describe("parseProductFields", () => {
  it("requires name, SKU and a price above zero for a new product", () => {
    expect(parse({}, true)).toEqual({ error: "Product name is required." });
    expect(parse({ name: "Kasavu" }, true)).toEqual({ error: "SKU is required." });
    expect(parse({ name: "Kasavu", sku: "S-1" }, true)).toMatchObject({ error: expect.stringContaining("Price") });
    expect(parse({ name: "Kasavu", sku: "S-1", priceValue: 0 }, true)).toMatchObject({ error: expect.any(String) });
    expect(parse({ name: "Kasavu", sku: "S-1", priceValue: -5 }, true)).toMatchObject({ error: expect.any(String) });
  });

  it("formats the display price from the number", () => {
    const r = parse({ name: "Kasavu", sku: "S-1", priceValue: 12500 }, true);
    expect(r).toMatchObject({ fields: { priceValue: 12500, price: "₹12,500" } });
  });

  it("rejects bad SKUs, non-numeric prices and an MRP below the price", () => {
    expect(parse({ sku: "has space" })).toMatchObject({ error: expect.stringContaining("SKU") });
    expect(parse({ priceValue: "abc" })).toMatchObject({ error: expect.any(String) });
    expect(parse({ priceValue: 1000, mrp: 900 })).toMatchObject({ error: expect.stringContaining("MRP") });
  });

  it("only changes the fields that were sent", () => {
    const r = parse({ stock: 4 });
    expect(r).toEqual({ fields: expect.objectContaining({ stock: 4 }) });
    if ("fields" in r) {
      expect(r.fields.name).toBeUndefined();
      expect(r.fields.priceValue).toBeUndefined();
    }
  });

  it("refuses negative stock and an unknown status", () => {
    expect(parse({ stock: -1 })).toMatchObject({ error: expect.any(String) });
    expect(parse({ status: "deleted" })).toMatchObject({ error: expect.stringContaining("Status") });
  });
});

describe("productSlug", () => {
  it("falls back to the SKU when the name has no English letters", () => {
    expect(productSlug("തെച്ചി", "SAR-COT-054")).toBe("sar-cot-054");
    expect(productSlug("Kasavu Saree", "X")).toBe("kasavu-saree");
  });
});
