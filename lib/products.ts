import { cache } from "react";
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

function resolveImgPath(img: any, fallback: string): string {
  if (!img) return fallback;
  if (typeof img === "string") return img;
  if (img.src && typeof img.src === "string") return img.src;
  return fallback;
}

/**
 * Active products for the shop, from the database (the only source).
 * Photos are never loaded here, only whether each exists (lib/imageRefs.ts),
 * and the result is shared within one page render (React cache), so a
 * product page's title, details and related products cost one query.
 */
export const getAllUnifiedProducts = cache(async (): Promise<UnifiedProduct[]> => {
  const dbProducts = await attachImageRefs(
    await prisma.product.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      omit: OMIT_PHOTOS,
      include: variantsIncludeSlim,
    })
  );

  return dbProducts.map((p: any) => {
    // Serve uploaded (base64) photos by URL instead of inlining them.
    const folded = imageUrl("product", p.id, "folded", p.foldedImg, p.updatedAt);
    const worn = imageUrl("product", p.id, "worn", p.wornImg, p.updatedAt);
    const photos = ownPhotos(resolveImgPath(folded, ""), resolveImgPath(worn, ""));
    const variants = p.variants || [];
    const stock = p.stock ?? 10;
    const soldOut = variants.length > 0 ? variants.every((v: any) => (v.stock ?? 0) <= 0) : stock <= 0;
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
  });
});

export async function getProductById(id: string | number): Promise<UnifiedProduct | null> {
  const all = await getAllUnifiedProducts();
  const searchId = String(id).toLowerCase().trim();
  const found = all.find(
    (p) =>
      String(p.id).toLowerCase() === searchId ||
      (p.sku && p.sku.toLowerCase() === searchId) ||
      (p.slug && p.slug.toLowerCase() === searchId)
  );
  return found || null;
}
