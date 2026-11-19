import type { Prisma, PrismaClient, ProductVariant } from "@prisma/client";
import { imageUrl, isServedImageUrl } from "@/lib/productImages";

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

    variants.push({
      id: typeof v.id === "string" && v.id ? v.id : undefined,
      name,
      sku,
      colorHex: typeof v.colorHex === "string" && v.colorHex ? v.colorHex : undefined,
      priceValue: toOptionalInt(v.priceValue),
      mrp: toOptionalInt(v.mrp),
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
