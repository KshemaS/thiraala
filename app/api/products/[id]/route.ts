import { refreshesShop } from "@/lib/revalidateShop";
import { NextResponse } from "next/server";
import type { Prisma, Product, ProductVariant } from "@prisma/client";
import prisma from "@/lib/prisma";
import { resolveProductLinks } from "@/lib/productLinks";
import { getAdminSession, requireAdmin } from "@/lib/auth/guard";
import {
  formatVariant,
  parseVariants,
  syncVariants,
  variantSkuConflict,
  variantsIncludeSlim,
} from "@/lib/productVariants";
import { imageUrl } from "@/lib/productImages";
import { parseProductFields } from "@/lib/productInput";
import { attachImageRefs, OMIT_PHOTOS } from "@/lib/imageRefs";
import { ProductItem } from "../route";

function formatProduct(p: Product & { variants: ProductVariant[] }): ProductItem {
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
    highlights: p.highlights ? p.highlights.split("\n").filter(Boolean) : undefined,
    stock: p.stock,
    description: p.description || "",
    status: (p.status as "active" | "inactive") || "active",
    featured: p.featured,
    isNewArrival: p.isNewArrival,
    variants: p.variants.map(formatVariant),
  };
}

/** A product with its colours, photos as refs only (lib/imageRefs.ts). */
async function findProduct(id: string, alsoSlug = false) {
  const product = await prisma.product.findFirst({
    where: { OR: alsoSlug ? [{ id }, { sku: id }, { slug: id }] : [{ id }, { sku: id }] },
    omit: OMIT_PHOTOS,
    include: variantsIncludeSlim,
  });
  return product ? (await attachImageRefs([product]))[0] : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await findProduct(id, true);
    // Hidden products look the same as missing ones to everyone but the admin.
    if (!product || (product.status !== "active" && !(await getAdminSession()))) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(formatProduct(product));
  } catch (err) {
    console.error("Failed to load product:", err);
    return NextResponse.json({ error: "Unable to load product." }, { status: 500 });
  }
}

async function handlePUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    }

    const existing = await findProduct(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const checked = parseProductFields(body, {
      requireCore: false,
      current: { priceValue: existing.priceValue, mrp: existing.mrp, name: existing.name, sku: existing.sku },
    });
    if ("error" in checked) {
      return NextResponse.json({ success: false, error: checked.error }, { status: 400 });
    }
    const f = checked.fields;

    // Variants are only touched when the request includes them.
    let variants = null;
    if (body.variants !== undefined) {
      const parsed = parseVariants(body.variants);
      if ("error" in parsed) {
        return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
      }
      variants = parsed.variants;
    }

    // Another product already using the new SKU or slug: say so plainly.
    const changes = [
      f.sku && f.sku !== existing.sku ? { sku: f.sku } : null,
      f.slug && f.slug !== existing.slug ? { slug: f.slug } : null,
    ].filter((c): c is { sku: string } | { slug: string } => !!c);
    if (changes.length) {
      const clash = await prisma.product.findFirst({
        where: { id: { not: existing.id }, OR: changes },
        select: { sku: true, name: true },
      });
      if (clash) {
        const field = clash.sku === f.sku ? `SKU "${f.sku}"` : `URL slug "${f.slug}"`;
        return NextResponse.json(
          { success: false, error: `${field} is already used by "${clash.name}". Please choose another.` },
          { status: 409 }
        );
      }
    }

    const hasVariants = variants ? variants.length > 0 : existing.variants.length > 0;
    // With variants, product stock is always the total of the variants' stock.
    const stock = variants && variants.length
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : hasVariants
        ? undefined
        : f.stock;

    // Keep the category / collection links in step with their names.
    const links = await resolveProductLinks(prisma, { categoryName: f.categoryName, collectionName: f.collectionName });
    if (!links.ok) return NextResponse.json({ success: false, error: links.error }, { status: 400 });

    const data: Prisma.ProductUpdateInput = {
      name: f.name,
      sku: f.sku,
      slug: f.slug,
      price: f.price,
      priceValue: f.priceValue,
      mrp: f.mrp,
      rating: f.rating,
      ratingCount: f.ratingCount,
      categoryName: links.categoryName,
      category: links.categoryId === undefined ? undefined : { connect: { id: links.categoryId } },
      collectionName: links.collectionName,
      collection:
        links.collectionId === undefined
          ? undefined
          : links.collectionId === null
            ? { disconnect: true }
            : { connect: { id: links.collectionId } },
      stock,
      ...f.text,
      // These two have defaults and can't be emptied.
      sareeLength: f.text.sareeLength ?? undefined,
      blouseLength: f.text.blouseLength ?? undefined,
      highlights: f.highlights,
      // The form sends back the served URL when a photo wasn't changed.
      foldedImg: f.foldedImg,
      wornImg: f.wornImg,
      status: f.status,
      featured: f.featured,
      isNewArrival: f.isNewArrival,
    };

    const updated = await prisma.$transaction(async (tx) => {
      if (variants) await syncVariants(tx, existing.id, variants);
      return tx.product.update({
        where: { id: existing.id },
        data,
        omit: OMIT_PHOTOS,
        include: variantsIncludeSlim,
      });
    });

    const [withRefs] = await attachImageRefs([updated]);
    return NextResponse.json({ success: true, data: formatProduct(withRefs) });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: variantSkuConflict(error) || "Failed to update product" },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const product = await prisma.product.findFirst({ where: { OR: [{ id }, { sku: id }] }, select: { id: true, name: true } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Keep products that customers have ordered, so past orders still point
    // at them; hide them from the shop instead.
    const orderCount = await prisma.orderItem.count({ where: { productId: product.id } });
    if (orderCount > 0) {
      return NextResponse.json(
        {
          success: false,
          code: "HAS_ORDERS",
          orderCount,
          error: `"${product.name}" is in ${orderCount} order${orderCount === 1 ? "" : "s"}, so it can't be deleted. Hide it from the shop instead.`,
        },
        { status: 409 }
      );
    }

    // Variants are removed with the product (onDelete: Cascade).
    await prisma.product.delete({ where: { id: product.id } });
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

export const PUT = refreshesShop(handlePUT);

export const DELETE = refreshesShop(handleDELETE);
