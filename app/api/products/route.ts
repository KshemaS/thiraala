import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession, requireAdmin } from "@/lib/auth/guard";
import { imageUrl } from "@/lib/productImages";
import { parseProductFields, productSlug } from "@/lib/productInput";
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

export async function GET() {
  try {
    // Hidden (inactive) products and drafts are for the dashboard only.
    const isAdmin = !!(await getAdminSession());
    // Photos aren't loaded, only whether each exists (lib/imageRefs.ts).
    const dbProducts = await attachImageRefs(
      await prisma.product.findMany({
        where: isAdmin ? undefined : { status: "active" },
        orderBy: { createdAt: "desc" },
        omit: OMIT_PHOTOS,
        include: variantsIncludeSlim,
      })
    );

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
            categoryName: f.categoryName || "General",
            categoryId: typeof body.categoryId === "string" && body.categoryId ? body.categoryId : null,
            collectionName: f.collectionName ?? null,
            collectionId: typeof body.collectionId === "string" && body.collectionId ? body.collectionId : null,
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
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}
