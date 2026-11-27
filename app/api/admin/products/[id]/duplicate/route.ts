import { refreshesShop } from "@/lib/revalidateShop";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";

/** First free value of `base`, `base-2`, `base-3`… according to `taken`. */
async function freeValue(base: string, taken: (v: string) => Promise<boolean>) {
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (!(await taken(candidate))) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/**
 * POST — copies a product (details, photos, colours) as a new hidden draft
 * with stock 0, so it can be edited before it appears in the shop.
 */
async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const source = await prisma.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: "asc" } } } });
    if (!source) return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });

    const sku = await freeValue(`${source.sku}-COPY`, async (v) => !!(await prisma.product.findUnique({ where: { sku: v } })));
    const slug = await freeValue(`${source.slug}-copy`, async (v) => !!(await prisma.product.findUnique({ where: { slug: v } })));

    const variantSkus: string[] = [];
    for (const v of source.variants) {
      variantSkus.push(
        await freeValue(`${v.sku}-COPY`, async (s) => variantSkus.includes(s) || !!(await prisma.productVariant.findUnique({ where: { sku: s } })))
      );
    }

    // Everything except identity, timestamps and relations.
    const { id: _id, sku: _sku, slug: _slug, createdAt: _c, updatedAt: _u, variants, ...fields } = source;
    const copy = await prisma.product.create({
      data: {
        ...fields,
        name: `${source.name} (copy)`,
        sku,
        slug,
        status: "inactive",
        stock: 0,
        featured: false,
        isNewArrival: false,
        rating: null,
        ratingCount: null,
        variants: {
          create: variants.map((v, i) => ({
            name: v.name,
            sku: variantSkus[i],
            colorHex: v.colorHex,
            priceValue: v.priceValue,
            mrp: v.mrp,
            stock: 0,
            foldedImg: v.foldedImg,
            wornImg: v.wornImg,
            sortOrder: v.sortOrder,
          })),
        },
      },
    });
    return NextResponse.json({ success: true, id: copy.id, sku: copy.sku, name: copy.name }, { status: 201 });
  } catch (err) {
    console.error("Duplicate product failed:", err);
    return NextResponse.json({ success: false, error: "Unable to duplicate the product." }, { status: 500 });
  }
}

export const POST = refreshesShop(handlePOST);
