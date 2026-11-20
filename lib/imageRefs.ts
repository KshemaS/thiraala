import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

/**
 * Uploaded photos live in the database as base64 text (up to ~1 MB each), but
 * pages only need to know *whether* a photo exists to link to it via
 * /api/images/… (see lib/productImages.ts). Loading the full text for every
 * product made the product page pull ~3 MB from the database per query.
 *
 * So queries `omit` the photo columns and use these helpers instead: each
 * photo comes back as "data:" (an uploaded photo; imageUrl() turns it into a
 * link) or its static path, never the photo itself.
 */

export interface ImageRefs {
  foldedImg: string | null;
  wornImg: string | null;
}

/** Omit for prisma queries: leave the heavy photo columns out. */
export const OMIT_PHOTOS = { foldedImg: true, wornImg: true } as const;

async function refs(table: "products" | "product_variants", ids: string[]): Promise<Map<string, ImageRefs>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.$queryRaw<{ id: string; foldedImg: string | null; wornImg: string | null }[]>`
    SELECT id,
      CASE WHEN "foldedImg" LIKE 'data:%' THEN 'data:' ELSE "foldedImg" END AS "foldedImg",
      CASE WHEN "wornImg" LIKE 'data:%' THEN 'data:' ELSE "wornImg" END AS "wornImg"
    FROM ${Prisma.raw(`"${table}"`)}
    WHERE id IN (${Prisma.join(ids)})`;
  return new Map(rows.map((r) => [r.id, { foldedImg: r.foldedImg, wornImg: r.wornImg }]));
}

export const productImageRefs = (ids: string[]) => refs("products", ids);
export const variantImageRefs = (ids: string[]) => refs("product_variants", ids);

/**
 * Adds photo refs to products loaded with OMIT_PHOTOS (and their variants, if
 * loaded the same way), so they can go through the usual formatters.
 */
type VariantOf<P> = P extends { variants?: (infer V)[] } ? V : never;
export type WithImageRefs<P> = Omit<P, "variants"> & ImageRefs & { variants: (VariantOf<P> & ImageRefs)[] };

export async function attachImageRefs<P extends { id: string; variants?: { id: string }[] }>(
  products: P[]
): Promise<WithImageRefs<P>[]> {
  const variantIds = products.flatMap((p) => (p.variants ?? []).map((v) => v.id));
  const [pRefs, vRefs] = await Promise.all([productImageRefs(products.map((p) => p.id)), variantImageRefs(variantIds)]);
  const none: ImageRefs = { foldedImg: null, wornImg: null };
  return products.map(
    (p) =>
      ({
        ...p,
        ...(pRefs.get(p.id) ?? none),
        variants: (p.variants ?? []).map((v) => ({ ...v, ...(vRefs.get(v.id) ?? none) })),
      }) as unknown as WithImageRefs<P>
  );
}
