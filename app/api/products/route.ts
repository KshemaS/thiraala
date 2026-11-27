import { refreshesShop } from "@/lib/revalidateShop";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAdminSession, requireAdmin } from "@/lib/auth/guard";
import { imageUrl } from "@/lib/productImages";
import { parseProductFields, productSlug } from "@/lib/productInput";
import { resolveProductLinks } from "@/lib/productLinks";
import { attachImageRefs, OMIT_PHOTOS } from "@/lib/imageRefs";
import {
  formatVariant,
  parseVariants,
  syncVariants,
  variantSkuConflict,
  variantsIncludeSlim,
  type ProductVariantItem,
} from "@/lib/productVariants";

export interface ProductItem {
  id: number | string;
  sku: string;
  name: string;
  subtitle?: string;
  slug?: string;
  price: string;
  priceValue?: number;
  mrp?: number;
  discountPercent?: number;
  rating?: number;
  ratingCount?: number;
  selectedColor?: string;
  category: string;
  categoryId?: string;
  collection?: string;
  collections?: string[];
  collectionId?: string;
  foldedImg?: string;
  wornImg?: string;
  altFolded?: string;
  altWorn?: string;
  fabric?: string;
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
  status?: "active" | "inactive";
  featured?: boolean;
  isNewArrival?: boolean;
  variants?: ProductVariantItem[];
}

type ProductRow = Awaited<ReturnType<typeof attachImageRefs<Prisma.ProductGetPayload<{ omit: typeof OMIT_PHOTOS; include: typeof variantsIncludeSlim }>>>>[number];

function toProductItem(p: ProductRow): ProductItem {
  return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        subtitle: p.subtitle || undefined,
        slug: p.slug,
        price: p.price,
        priceValue: p.priceValue,
        mrp: p.mrp || undefined,
        rating: p.rating ?? undefined,
        ratingCount: p.ratingCount ?? undefined,
        selectedColor: p.selectedColor || undefined,
        category: p.categoryName,
        categoryId: p.categoryId || undefined,
        collection: p.collectionName || undefined,
        collections: p.collectionName ? [p.collectionName] : [],
        collectionId: p.collectionId || undefined,
        foldedImg: imageUrl("product", p.id, "folded", p.foldedImg, p.updatedAt),
        wornImg: imageUrl("product", p.id, "worn", p.wornImg, p.updatedAt),
        altFolded: p.altFolded || p.name,
        altWorn: p.altWorn || p.name,
        fabric: p.fabric || "",
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
        stock: p.stock,
        description: p.description || "",
        status: (p.status as "active" | "inactive") || "active",
        featured: p.featured,
        isNewArrival: p.isNewArrival,
        variants: p.variants.map(formatVariant),
  };
}

async function loadProducts(args: Omit<Prisma.ProductFindManyArgs, "omit" | "include" | "select">) {
  // Photos aren't loaded, only whether each exists (lib/imageRefs.ts).
  const rows = await attachImageRefs(await prisma.product.findMany({ ...args, omit: OMIT_PHOTOS, include: variantsIncludeSlim }));
  return rows.map(toProductItem);
}

/** Dashboard filters (search, category, stock) as a database query. */
function dashboardWhere(sp: URLSearchParams): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];
  const q = sp.get("q")?.trim();
  if (q) {
    const has = { contains: q, mode: "insensitive" as const };
    and.push({ OR: [{ name: has }, { sku: has }, { fabric: has }, { collectionName: has }] });
  }
  const category = sp.get("category");
  if (category && category !== "All") and.push({ categoryName: category });
  const stock = sp.get("stock");
  if (stock === "InStock") and.push({ stock: { gt: 0 } });
  else if (stock === "OutOfStock") and.push({ stock: { lte: 0 } });
  else if (stock === "NewArrivals") and.push({ isNewArrival: true });
  return { AND: and };
}

/**
 * GET — products. Shoppers get active products only; the admin also gets
 * hidden ones.
 *  - ?ids=a,b,c: just those products (the bag refreshing its prices/stock).
 *  - ?page=N&limit=M (admin): one page of the dashboard list, searched and
 *    filtered in the database (q, category, stock), plus counts.
 *  - otherwise: every product, as a plain list.
 */
export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    // Hidden (inactive) products and drafts are for the dashboard only.
    const isAdmin = !!(await getAdminSession());
    const visible: Prisma.ProductWhereInput = isAdmin ? {} : { status: "active" };

    const ids = sp.get("ids")?.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
    if (ids) {
      return NextResponse.json(await loadProducts({ where: { ...visible, id: { in: ids } } }));
    }

    const page = isAdmin ? parseInt(sp.get("page") || "", 10) : NaN;
    if (isAdmin && page > 0) {
      const limit = Math.min(200, Math.max(1, parseInt(sp.get("limit") || "50", 10) || 50));
      const where = dashboardWhere(sp);
      const [products, filteredCount, total, inStock, categories] = await Promise.all([
        loadProducts({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
        prisma.product.count({ where }),
        prisma.product.count(),
        prisma.product.count({ where: { stock: { gt: 0 } } }),
        prisma.product.groupBy({ by: ["categoryName"], orderBy: { categoryName: "asc" } }),
      ]);
      return NextResponse.json({
        success: true,
        products,
        filteredCount,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(filteredCount / limit)),
        metrics: { total, inStock, outOfStock: total - inStock, totalCategories: categories.length },
        categories: categories.map((c) => c.categoryName).filter(Boolean),
      });
    }

    return NextResponse.json(await loadProducts({ where: visible, orderBy: { createdAt: "desc" } }));
  } catch (err) {
    console.error("Failed to load products:", err);
    return NextResponse.json(
      { success: false, error: "Unable to load products." },
      { status: 500 }
    );
  }
}

async function handlePOST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    }

    const checked = parseProductFields(body, { requireCore: true });
    if ("error" in checked) {
      return NextResponse.json({ success: false, error: checked.error }, { status: 400 });
    }
    const f = checked.fields;

    const parsed = parseVariants(body.variants);
    if ("error" in parsed) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const variants = parsed.variants;

    const id = typeof body.id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(body.id) ? body.id : undefined;
    // Blank or non-English (e.g. Malayalam) slugs fall back to the name, then the SKU.
    const slug = f.slug ?? productSlug(f.name, f.sku);
    // With variants, product stock is the total of the variants' stock.
    const stock = variants.length ? variants.reduce((sum, v) => sum + v.stock, 0) : f.stock ?? 0;

    // Refuse to reuse a SKU or URL slug instead of overwriting that product.
    const clash = await prisma.product.findFirst({
      where: { OR: [{ sku: f.sku! }, { slug }] },
      select: { sku: true, slug: true, name: true },
    });
    if (clash) {
      const field = clash.sku === f.sku ? `SKU "${f.sku}"` : `URL slug "${slug}"`;
      return NextResponse.json(
        { success: false, error: `${field} is already used by "${clash.name}". Please choose another.` },
        { status: 409 }
      );
    }

    const links = await resolveProductLinks(prisma, {
      categoryName: f.categoryName || "General",
      collectionName: f.collectionName ?? null,
    });
    if (!links.ok) return NextResponse.json({ success: false, error: links.error }, { status: 400 });

    let saved;
    try {
      saved = await prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            id,
            sku: f.sku!,
            name: f.name!,
            slug,
            price: f.price!,
            priceValue: f.priceValue!,
            mrp: f.mrp ?? null,
            rating: f.rating ?? null,
            ratingCount: f.ratingCount ?? null,
            categoryName: links.categoryName!,
            categoryId: links.categoryId ?? null,
            collectionName: links.collectionName ?? null,
            collectionId: links.collectionId ?? null,
            stock,
            ...f.text,
            sareeLength: f.text.sareeLength ?? undefined,
            blouseLength: f.text.blouseLength ?? undefined,
            highlights: f.highlights ?? null,
            // A served URL only refers to another row's photo; never store it.
            foldedImg: f.foldedImg ?? null,
            wornImg: f.wornImg ?? null,
            status: f.status ?? "active",
            featured: f.featured ?? false,
            isNewArrival: f.isNewArrival ?? false,
          },
          select: { id: true, sku: true, slug: true, name: true },
        });
        await syncVariants(tx, created.id, variants);
        return created;
      });
    } catch (dbErr) {
      console.error("Could not save product:", dbErr);
      return NextResponse.json(
        { success: false, error: variantSkuConflict(dbErr) || "Could not save the product. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, product: { ...saved, priceValue: f.priceValue, price: f.price, stock } });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}

export const POST = refreshesShop(handlePOST);
