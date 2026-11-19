import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { imageUrl, incomingImage } from "@/lib/productImages";
import {
  formatVariant,
  parseVariants,
  syncVariants,
  variantSkuConflict,
  variantsInclude,
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

/** Trimmed string, or null when blank/missing. */
function text(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function optionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function optionalInt(value: unknown): number | null {
  const n = optionalNumber(value);
  return n === null ? null : Math.round(n);
}

export async function GET() {
  try {
    const dbProducts = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: variantsInclude,
    });

    const formatted: ProductItem[] = dbProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        subtitle: (p as any).subtitle || undefined,
        slug: p.slug,
        price: p.price,
        priceValue: p.priceValue,
        mrp: (p as any).mrp || undefined,
        rating: (p as any).rating ?? undefined,
        ratingCount: (p as any).ratingCount ?? undefined,
        selectedColor: (p as any).selectedColor || undefined,
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
        sareeFabric: (p as any).sareeFabric || undefined,
        color: p.color || "",
        pattern: p.pattern || "",
        border: (p as any).border || undefined,
        blouse: (p as any).blouse || undefined,
        occasion: (p as any).occasion || undefined,
        sareeLength: (p as any).sareeLength || "5.5 metres",
        blouseLength: (p as any).blouseLength || "0.8 metres",
        careInstructions: (p as any).careInstructions || undefined,
        highlights: (p as any).highlights
          ? typeof (p as any).highlights === "string"
            ? (p as any).highlights.split("\n").filter(Boolean)
            : (p as any).highlights
          : undefined,
        stock: p.stock,
        description: p.description || "",
        status: (p.status as "active" | "inactive") || "active",
        featured: p.featured,
        isNewArrival: p.isNewArrival,
        variants: p.variants.map(formatVariant),
      }));
    return NextResponse.json(formatted);
  } catch (err) {
    console.error("Failed to load products:", err);
    return NextResponse.json(
      { success: false, error: "Unable to load products." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.name || !body.sku) {
      return NextResponse.json(
        { success: false, error: "Product name and SKU are required." },
        { status: 400 }
      );
    }

    const parsed = parseVariants(body.variants);
    if ("error" in parsed) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const variants = parsed.variants;

    const newId = body.id || `prod_${Date.now()}`;
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newProduct: ProductItem = {
      ...body,
      id: newId,
      slug,
      status: body.status || "active",
      // With variants, product stock is the total of the variants' stock.
      stock: variants.length
        ? variants.reduce((sum, v) => sum + v.stock, 0)
        : Number(body.stock) >= 0
          ? Number(body.stock)
          : 0,
      priceValue: Number(body.priceValue) || (body.price ? Number(String(body.price).replace(/[^0-9]/g, "")) : 0),
      variants,
    };

    // Refuse to reuse a SKU or URL slug instead of overwriting that product.
    const clash = await prisma.product.findFirst({
      where: { OR: [{ sku: newProduct.sku }, { slug }] },
      select: { sku: true, slug: true, name: true },
    });
    if (clash) {
      const field = clash.sku === newProduct.sku ? `SKU "${newProduct.sku}"` : `URL slug "${slug}"`;
      return NextResponse.json(
        { success: false, error: `${field} is already used by "${clash.name}". Please choose another.` },
        { status: 409 }
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        const saved = await tx.product.create({
          data: {
            id: typeof newProduct.id === "string" ? newProduct.id : undefined,
            sku: newProduct.sku,
            name: newProduct.name,
            subtitle: text(body.subtitle),
            slug,
            price: newProduct.price || "₹0",
            priceValue: Number(newProduct.priceValue) || 0,
            mrp: optionalInt(body.mrp),
            rating: optionalNumber(body.rating),
            ratingCount: optionalInt(body.ratingCount),
            selectedColor: text(body.selectedColor),
            categoryName: newProduct.category || "General",
            categoryId: newProduct.categoryId || null,
            collectionName: newProduct.collection || null,
            collectionId: newProduct.collectionId || null,
            stock: newProduct.stock ?? 0,
            fabric: text(body.fabric),
            sareeFabric: text(body.sareeFabric),
            color: text(body.color),
            pattern: text(body.pattern),
            border: text(body.border),
            blouse: text(body.blouse),
            occasion: text(body.occasion),
            sareeLength: text(body.sareeLength) ?? undefined,
            blouseLength: text(body.blouseLength) ?? undefined,
            careInstructions: text(body.careInstructions),
            highlights: Array.isArray(body.highlights)
              ? body.highlights.map(String).map((h: string) => h.trim()).filter(Boolean).join("\n") || null
              : text(body.highlights),
            description: text(body.description),
            // A served URL only refers to another row's photo; never store it.
            foldedImg: incomingImage(body.foldedImg) ?? null,
            wornImg: incomingImage(body.wornImg) ?? null,
            altFolded: text(body.altFolded),
            altWorn: text(body.altWorn),
            status: newProduct.status || "active",
            featured: Boolean(body.featured),
            isNewArrival: Boolean(body.isNewArrival),
          },
        });
        await syncVariants(tx, saved.id, variants);
      });
    } catch (dbErr) {
      console.error("Could not save product:", dbErr);
      return NextResponse.json(
        { success: false, error: variantSkuConflict(dbErr) || "Could not save the product. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
