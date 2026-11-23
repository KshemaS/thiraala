import type { Prisma, PrismaClient, ProductVariant } from "@prisma/client";
import { imageInputError, imageUrl, isServedImageUrl } from "@/lib/productImages";
import { MAX_PRICE } from "@/lib/productInput";

/** A colour variant as sent to / received from the client. */
export interface ProductVariantItem {
  id?: string;
  name: string;
  sku: string;
  colorHex?: string;
  /** null/undefined = use the parent product's price */
  priceValue?: number | null;
  mrp?: number | null;
  stock: number;
  foldedImg?: string;
  wornImg?: string;
  sortOrder?: number;
}

export function formatVariant(v: ProductVariant): ProductVariantItem {
  return {
    id: v.id,
    name: v.name,
    sku: v.sku,
    colorHex: v.colorHex || undefined,
    priceValue: v.priceValue,
    mrp: v.mrp,
    stock: v.stock,
    foldedImg: imageUrl("variant", v.id, "folded", v.foldedImg, v.updatedAt),
    wornImg: imageUrl("variant", v.id, "worn", v.wornImg, v.updatedAt),
    sortOrder: v.sortOrder,
  };
}

export const variantsInclude = {
  variants: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

/** Same, without the heavy photo columns (pair with attachImageRefs). */
export const variantsIncludeSlim = {
  variants: { orderBy: { sortOrder: "asc" }, omit: { foldedImg: true, wornImg: true } },
} satisfies Prisma.ProductInclude;

function toOptionalInt(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Validates raw variant input from a request body.
 * Returns the cleaned list, or an error message.
 */
export function parseVariants(raw: unknown): { variants: ProductVariantItem[] } | { error: string } {
  if (raw === undefined || raw === null) return { variants: [] };
  if (!Array.isArray(raw)) return { error: "Variants must be a list." };

  const variants: ProductVariantItem[] = [];
  const seenSkus = new Set<string>();
  const seenNames = new Set<string>();

  for (const [i, v] of raw.entries()) {
    const name = typeof v?.name === "string" ? v.name.trim() : "";
    const sku = typeof v?.sku === "string" ? v.sku.trim() : "";
    if (!name) return { error: `Variant ${i + 1} needs a colour name.` };
    if (!sku) return { error: `Variant "${name}" needs a SKU.` };
    if (seenSkus.has(sku.toLowerCase())) return { error: `Variant SKU "${sku}" is used more than once.` };
    if (seenNames.has(name.toLowerCase())) return { error: `Colour "${name}" is listed more than once.` };
    seenSkus.add(sku.toLowerCase());
    seenNames.add(name.toLowerCase());
    if (name.length > 100 || sku.length > 64) return { error: `Variant "${name.slice(0, 40)}": name or SKU is too long.` };

    // Blank price/MRP = use the product's. Anything entered must be sensible.
    const bad = (label: string, value: unknown, min: number, max: number) => {
      if (value === undefined || value === null || value === "") return null;
      const n = Number(value);
      return Number.isInteger(n) && n >= min && n <= max ? null : `Colour "${name}": ${label} must be a whole number from ${min} to ${max.toLocaleString("en-IN")}.`;
    };
    const numberError =
      bad("price", v.priceValue, 1, MAX_PRICE) || bad("MRP", v.mrp, 1, MAX_PRICE) || bad("stock", v.stock, 0, 100_000);
    if (numberError) return { error: numberError };
    const vPrice = toOptionalInt(v.priceValue);
    const vMrp = toOptionalInt(v.mrp);
    if (vPrice && vMrp && vMrp < vPrice) return { error: `Colour "${name}": MRP can't be lower than its price.` };
    for (const [key, label] of [["foldedImg", "folded photo"], ["wornImg", "worn photo"]] as const) {
      const err = imageInputError(v[key]);
      if (err) return { error: `Colour "${name}" ${label}: ${err}` };
    }

    variants.push({
      id: typeof v.id === "string" && v.id ? v.id : undefined,
      name,
      sku,
      colorHex: typeof v.colorHex === "string" && v.colorHex ? v.colorHex : undefined,
      priceValue: vPrice,
      mrp: vMrp,
      stock: toOptionalInt(v.stock) ?? 0,
      foldedImg: typeof v.foldedImg === "string" && v.foldedImg ? v.foldedImg : undefined,
      wornImg: typeof v.wornImg === "string" && v.wornImg ? v.wornImg : undefined,
      sortOrder: i,
    });
  }
  return { variants };
}

/**
 * Replaces a product's variants with the given list: updates the ones that
 * still exist (matched by id), creates new ones and deletes the rest.
 */
export async function syncVariants(
  db: PrismaClient | Prisma.TransactionClient,
  productId: string,
  variants: ProductVariantItem[]
) {
  const existing = await db.productVariant.findMany({
    where: { productId },
    select: { id: true },
  });
  const existingIds = new Set(existing.map((v) => v.id));
  const keepIds = new Set(variants.map((v) => v.id).filter((id): id is string => !!id && existingIds.has(id)));

  // Delete removed variants first so their SKUs can be reused.
  await db.productVariant.deleteMany({
    where: { productId, id: { notIn: Array.from(keepIds) } },
  });

  for (const v of variants) {
    const data = {
      name: v.name,
      sku: v.sku,
      colorHex: v.colorHex ?? null,
      priceValue: v.priceValue ?? null,
      mrp: v.mrp ?? null,
      stock: v.stock,
      sortOrder: v.sortOrder ?? 0,
    };
    // A served image URL coming back from the form means "photo unchanged".
    const photo = (value: string | undefined) => (isServedImageUrl(value) ? undefined : (value ?? null));
    const foldedImg = photo(v.foldedImg);
    const wornImg = photo(v.wornImg);

    if (v.id && keepIds.has(v.id)) {
      await db.productVariant.update({
        where: { id: v.id },
        data: {
          ...data,
          ...(foldedImg !== undefined && { foldedImg }),
          ...(wornImg !== undefined && { wornImg }),
        },
      });
    } else {
      await db.productVariant.create({
        data: { ...data, productId, foldedImg: foldedImg ?? null, wornImg: wornImg ?? null },
      });
    }
  }
}

/** Prisma unique-constraint error on a variant SKU → friendly message. */
export function variantSkuConflict(err: unknown): string | null {
  const e = err as { code?: string; meta?: { modelName?: string; target?: unknown } };
  if (e?.code === "P2002" && (e.meta?.modelName === "ProductVariant" || String(e.meta?.target).includes("sku"))) {
    return "A variant SKU is already used by another product. Each variant needs a unique SKU.";
  }
  return null;
}
