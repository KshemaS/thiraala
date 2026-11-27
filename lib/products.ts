import { cache } from "react";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { formatVariant, variantsIncludeSlim, type ProductVariantItem } from "@/lib/productVariants";
import { imageUrl } from "@/lib/productImages";
import { attachImageRefs, OMIT_PHOTOS } from "@/lib/imageRefs";
import { ownPhotos } from "@/lib/placeholder";

export interface UnifiedProduct {
  id: number | string;
  sku: string;
  name: string;
  subtitle?: string;
  slug?: string;
  price: string;
  priceValue: number;
  mrp?: number;
  discountPercent?: number;
  rating?: number;
  ratingCount?: number;
  selectedColor?: string;
  category: string;
  collection?: string;
  foldedImg: string;
  wornImg: string;
  img?: string;
  altFolded?: string;
  altWorn?: string;
  fabric: string;
  sareeFabric?: string;
  color?: string;
  pattern?: string;
  border?: string;
  blouse?: string;
  occasion?: string;
  sareeLength?: string;
  blouseLength?: string;
  careInstructions?: string;
  highlights?: string[] | string;
  description?: string;
  stock?: number;
  /** True when nothing can be bought: no stock, or every colour sold out. */
  soldOut?: boolean;
  status?: string;
  featured?: boolean;
  isNewArrival?: boolean;
  /** Colour variants (DB products only). */
  variants?: ProductVariantItem[];
}

/** A photo as a URL: plain strings as they are, imported images by their `src`. */
export function resolveImgPath(img: unknown, fallback: string): string {
  if (!img) return fallback;
  if (typeof img === "string") return img;
  if (typeof img === "object" && "src" in img && typeof img.src === "string") return img.src;
  return fallback;
}

const PRODUCT_QUERY = { omit: OMIT_PHOTOS, include: variantsIncludeSlim } as const;

async function loadRows(args: Omit<Prisma.ProductFindManyArgs, "omit" | "include" | "select">) {
  return attachImageRefs(await prisma.product.findMany({ ...args, ...PRODUCT_QUERY }));
}
type ProductRow = Awaited<ReturnType<typeof loadRows>>[number];

/** A database product as the shop shows it (photos as links, never the photo itself). */
function toUnified(p: ProductRow): UnifiedProduct {

    // Serve uploaded (base64) photos by URL instead of inlining them.
    const folded = imageUrl("product", p.id, "folded", p.foldedImg, p.updatedAt);
    const worn = imageUrl("product", p.id, "worn", p.wornImg, p.updatedAt);
    const photos = ownPhotos(resolveImgPath(folded, ""), resolveImgPath(worn, ""));
    const variants = p.variants || [];
    const stock = p.stock ?? 10;
    const soldOut = variants.length > 0 ? variants.every((v) => (v.stock ?? 0) <= 0) : stock <= 0;
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      subtitle: p.subtitle || undefined,
      slug: p.slug,
      price: p.price,
      priceValue: p.priceValue || parseInt(String(p.price).replace(/[^\d]/g, ""), 10) || 0,
      mrp: p.mrp || undefined,
      discountPercent: p.mrp && p.priceValue ? Math.round(((p.mrp - p.priceValue) / p.mrp) * 100) : undefined,
      rating: p.rating ?? undefined,
      ratingCount: p.ratingCount ?? undefined,
      selectedColor: p.selectedColor || undefined,
      category: p.categoryName || "Handloom Saree",
      collection: p.collectionName || undefined,
      ...photos,
      img: photos.wornImg,
      altFolded: p.altFolded || p.name,
      altWorn: p.altWorn || p.name,
      fabric: p.fabric || "Cotton",
      sareeFabric: p.sareeFabric || undefined,
      color: p.color || "",
      pattern: p.pattern || "",
      border: p.border || undefined,
      blouse: p.blouse || undefined,
      occasion: p.occasion || undefined,
      sareeLength: p.sareeLength || "5.5 metres",
      blouseLength: p.blouseLength || "0.8 metres",
      careInstructions: p.careInstructions || undefined,
      highlights: p.highlights
        ? typeof p.highlights === "string"
          ? p.highlights.split("\n").filter(Boolean)
          : p.highlights
        : undefined,
      stock,
      soldOut,
      description: p.description || "",
      status: p.status || "active",
      featured: Boolean(p.featured),
      isNewArrival: Boolean(p.isNewArrival),
      variants: variants.map(formatVariant),
    };
}

/**
 * Active products for the shop, from the database (the only source).
 * Photos are never loaded here, only whether each exists (lib/imageRefs.ts),
 * and the result is shared within one page render (React cache).
 * Used for the sitemap; the shop's listings use queryShopProducts().
 */
export const getAllUnifiedProducts = cache(async (): Promise<UnifiedProduct[]> => {
  const rows = await loadRows({ where: { status: "active" }, orderBy: { createdAt: "desc" } });
  return rows.map(toUnified);
});

/** One active product by id, SKU or URL slug (any capitals), or null. Shared within one page render. */
export const getProductById = cache(async (id: string | number): Promise<UnifiedProduct | null> => {
  const key = String(id).trim();
  if (!key) return null;
  const [row] = await loadRows({
    where: {
      status: "active",
      OR: [{ id: key }, { sku: { equals: key, mode: "insensitive" } }, { slug: { equals: key, mode: "insensitive" } }],
    },
    take: 1,
  });
  return row ? toUnified(row) : null;
});

/** Up to `limit` other active products, same category first. */
export async function getRelatedProducts(product: { id: string | number; category: string }, limit = 3): Promise<UnifiedProduct[]> {
  const id = String(product.id);
  const same = await loadRows({
    where: { status: "active", id: { not: id }, categoryName: { equals: product.category, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const more =
    same.length < limit
      ? await loadRows({
          where: { status: "active", id: { notIn: [id, ...same.map((p) => p.id)] } },
          orderBy: { createdAt: "desc" },
          take: limit - same.length,
        })
      : [];
  return [...same, ...more].map(toUnified);
}

export interface ShopQuery {
  category?: string;
  fabric?: string;
  color?: string;
  occasion?: string;
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  /** Products per page; leave out for all matches. */
  limit?: number;
}

const list = (v?: string) => (v && v !== "All" ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);
const ci = (v: string) => ({ equals: v, mode: "insensitive" as const });
const has = (v: string) => ({ contains: v, mode: "insensitive" as const });

/** The shop's filters as a database query. */
function shopWhere(q: ShopQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ status: "active" }];
  const cats = list(q.category);
  if (cats.length) and.push({ OR: cats.map((c) => ({ categoryName: ci(c) })) });
  const fabrics = list(q.fabric);
  if (fabrics.length) and.push({ OR: fabrics.flatMap((f) => [{ fabric: ci(f) }, { sareeFabric: ci(f) }]) });
  if (q.color && q.color !== "All") and.push({ OR: [{ color: has(q.color) }, { selectedColor: has(q.color) }] });
  if (q.occasion && q.occasion !== "All") and.push({ occasion: has(q.occasion) });
  if (q.collection && q.collection !== "All") and.push({ collectionName: has(q.collection) });
  if (q.minPrice !== undefined) and.push({ priceValue: { gte: q.minPrice } });
  if (q.maxPrice !== undefined) and.push({ priceValue: { lte: q.maxPrice } });
  if (q.inStock) and.push({ stock: { gt: 0 } });
  // Every word must appear somewhere in the product.
  for (const token of (q.search || "").toLowerCase().split(/\s+/).filter(Boolean)) {
    and.push({
      OR: [
        { name: has(token) },
        { sku: has(token) },
        { categoryName: has(token) },
        { fabric: has(token) },
        { sareeFabric: has(token) },
        { color: has(token) },
        { description: has(token) },
      ],
    });
  }
  return { AND: and };
}

function shopOrder(sort: string): Prisma.ProductOrderByWithRelationInput[] {
  const newest = { createdAt: "desc" as const };
  switch (sort) {
    case "price_asc":
    case "price-low-to-high":
      return [{ priceValue: "asc" }, newest];
    case "price_desc":
    case "price-high-to-low":
      return [{ priceValue: "desc" }, newest];
    case "rating":
    case "rating_desc":
      return [{ rating: { sort: "desc", nulls: "last" } }, newest];
    case "newest":
    case "date":
      return [{ isNewArrival: "desc" }, newest];
    case "featured":
      return [{ featured: "desc" }, newest];
    default:
      return [newest];
  }
}

/**
 * Ids of the matching products in name order. Sorted here rather than in the
 * database, which would put every capitalised name before lowercase ones.
 */
async function nameSortedIds(where: Prisma.ProductWhereInput, desc: boolean): Promise<string[]> {
  const rows = await prisma.product.findMany({ where, select: { id: true, name: true }, orderBy: { createdAt: "desc" } });
  rows.sort((a, b) => (desc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
  return rows.map((r) => r.id);
}

/** Ids of the matching products, best sellers first (sarees sold in paid, non-cancelled orders). */
async function bestsellingIds(where: Prisma.ProductWhereInput): Promise<string[]> {
  const [ids, sold] = await Promise.all([
    prisma.product.findMany({ where, select: { id: true }, orderBy: { createdAt: "desc" } }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, order: { paymentStatus: "Paid", status: { not: "Cancelled" } } },
      _sum: { quantity: true },
    }),
  ]);
  const soldMap = new Map(sold.map((s) => [String(s.productId), s._sum.quantity ?? 0]));
  // Newest first, and sort() is stable, so ties stay newest first.
  return ids.map((r) => r.id).sort((a, b) => (soldMap.get(b) ?? 0) - (soldMap.get(a) ?? 0));
}

export interface ShopFacets {
  categories: { name: string; count: number }[];
  fabrics: { name: string; count: number }[];
  colors: { name: string; count: number }[];
  occasions: { name: string; count: number }[];
  priceRange: { min: number; max: number };
}

/** Filter options with counts over all active products (only the few columns needed, never photos). */
async function shopFacets(): Promise<{ total: number; facets: ShopFacets }> {
  const rows = await prisma.product.findMany({
    where: { status: "active" },
    select: { categoryName: true, fabric: true, color: true, occasion: true, priceValue: true },
    orderBy: { createdAt: "desc" },
  });
  const count = (values: (string | null | undefined)[]) => {
    const m = new Map<string, number>();
    for (const v of values) if (v) m.set(v, (m.get(v) || 0) + 1);
    return [...m.entries()].map(([name, n]) => ({ name, count: n })).sort((a, b) => b.count - a.count);
  };
  const prices = rows.map((r) => r.priceValue).filter((n) => n > 0);
  return {
    total: rows.length,
    facets: {
      categories: count(rows.map((r) => r.categoryName || "Handloom Saree")),
      fabrics: count(rows.map((r) => r.fabric || "Cotton")),
      colors: count(rows.map((r) => r.color)),
      occasions: count(rows.map((r) => r.occasion)),
      priceRange: { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 5000 },
    },
  };
}

/**
 * The shop's product listing, filtered, sorted and paged by the database, so
 * only the products on the page are loaded however big the catalogue grows.
 */
export async function queryShopProducts(q: ShopQuery, opts: { facets?: boolean } = {}) {
  const where = shopWhere(q);
  const page = Math.max(1, q.page || 1);
  const take = q.limit && q.limit > 0 ? q.limit : undefined;
  const skip = take ? (page - 1) * take : 0;
  const sort = (q.sort || "default").toLowerCase();

  let products: UnifiedProduct[];
  let filteredCount: number;
  const idOrder =
    sort === "bestselling" || sort === "best_sellers"
      ? () => bestsellingIds(where)
      : sort === "name" || sort === "name_asc" || sort === "name_desc"
        ? () => nameSortedIds(where, sort === "name_desc")
        : null;
  if (idOrder) {
    // Orders the database can't produce directly: work out the order from
    // ids (a tiny query), then load only this page's products.
    const ids = await idOrder();
    filteredCount = ids.length;
    const pageIds = take ? ids.slice(skip, skip + take) : ids;
    const rows = pageIds.length ? await loadRows({ where: { id: { in: pageIds } } }) : [];
    const byId = new Map(rows.map((r) => [r.id, r]));
    products = pageIds.map((id) => byId.get(id)).filter((r): r is ProductRow => !!r).map(toUnified);
  } else {
    const [rows, n] = await Promise.all([
      loadRows({ where, orderBy: shopOrder(sort), skip: take ? skip : undefined, take }),
      prisma.product.count({ where }),
    ]);
    products = rows.map(toUnified);
    filteredCount = n;
  }

  const meta = opts.facets ? await shopFacets() : null;
  return {
    products,
    filteredCount,
    page,
    limit: take ?? filteredCount,
    totalPages: take ? Math.max(1, Math.ceil(filteredCount / take)) : 1,
    ...meta,
  };
}
