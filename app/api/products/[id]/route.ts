import { NextResponse } from "next/server";
import type { Prisma, Product, ProductVariant } from "@prisma/client";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import {
  formatVariant,
  parseVariants,
  syncVariants,
  variantSkuConflict,
  variantsInclude,
} from "@/lib/productVariants";
import { imageUrl, incomingImage } from "@/lib/productImages";
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
    foldedImg: imageUrl("product", p.id, "folded", p.foldedImg, p.updatedAt) || "/images/folded-gopuram.jpeg",
    wornImg: imageUrl("product", p.id, "worn", p.wornImg, p.updatedAt) || "/images/gopura.jpeg",
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

function findProduct(id: string, alsoSlug = false) {
  return prisma.product.findFirst({
    where: { OR: alsoSlug ? [{ id }, { sku: id }, { slug: id }] : [{ id }, { sku: id }] },
    include: variantsInclude,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const product = await findProduct(id, true);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(formatProduct(product));
  } catch (err) {
    console.error("Failed to load product:", err);
    return NextResponse.json({ error: "Unable to load product." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await findProduct(id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Variants are only touched when the request includes them.
    let variants = null;
    if (body.variants !== undefined) {
      const parsed = parseVariants(body.variants);
      if ("error" in parsed) {
        return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
      }
      variants = parsed.variants;
    }

    const hasVariants = variants ? variants.length > 0 : existing.variants.length > 0;
    // With variants, product stock is always the total of the variants' stock.
    const stock = variants && variants.length
      ? variants.reduce((sum, v) => sum + v.stock, 0)
      : hasVariants
        ? undefined
        : body.stock !== undefined
          ? Math.max(0, Number(body.stock) || 0)
          : undefined;

    const data: Prisma.ProductUpdateInput = {
      name: body.name !== undefined ? body.name : undefined,
      subtitle: body.subtitle !== undefined ? body.subtitle : undefined,
      slug: body.slug !== undefined ? body.slug : undefined,
      price: body.price !== undefined ? body.price : undefined,
      priceValue: body.priceValue !== undefined ? Number(body.priceValue) : undefined,
      mrp: body.mrp !== undefined ? (body.mrp === "" || body.mrp === null ? null : Number(body.mrp)) : undefined,
      rating: body.rating !== undefined ? (body.rating === "" || body.rating === null ? null : Number(body.rating)) : undefined,
      ratingCount:
        body.ratingCount !== undefined
          ? body.ratingCount === "" || body.ratingCount === null
            ? null
            : Number(body.ratingCount)
          : undefined,
      selectedColor: body.selectedColor !== undefined ? body.selectedColor : undefined,
      categoryName: body.category !== undefined ? body.category : undefined,
      collectionName: body.collection !== undefined ? body.collection : undefined,
      stock,
      fabric: body.fabric !== undefined ? body.fabric : undefined,
      sareeFabric: body.sareeFabric !== undefined ? body.sareeFabric : undefined,
      color: body.color !== undefined ? body.color : undefined,
      pattern: body.pattern !== undefined ? body.pattern : undefined,
      border: body.border !== undefined ? body.border : undefined,
      blouse: body.blouse !== undefined ? body.blouse : undefined,
      occasion: body.occasion !== undefined ? body.occasion : undefined,
      sareeLength: body.sareeLength !== undefined ? body.sareeLength : undefined,
      blouseLength: body.blouseLength !== undefined ? body.blouseLength : undefined,
      careInstructions: body.careInstructions !== undefined ? body.careInstructions : undefined,
      highlights:
        body.highlights !== undefined
          ? Array.isArray(body.highlights)
            ? body.highlights.join("\n")
            : body.highlights
          : undefined,
      description: body.description !== undefined ? body.description : undefined,
      // The form sends back the served URL when a photo wasn't changed.
      foldedImg: incomingImage(body.foldedImg),
      wornImg: incomingImage(body.wornImg),
      status: body.status !== undefined ? body.status : undefined,
      featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
      isNewArrival: body.isNewArrival !== undefined ? Boolean(body.isNewArrival) : undefined,
    };

    const updated = await prisma.$transaction(async (tx) => {
      if (variants) await syncVariants(tx, existing.id, variants);
      return tx.product.update({
        where: { id: existing.id },
        data,
        include: variantsInclude,
      });
    });

    return NextResponse.json({ success: true, data: formatProduct(updated) });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: variantSkuConflict(error) || error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
