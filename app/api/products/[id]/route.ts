import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guard";
import { ProductItem } from "../route";

const dataFilePath = path.join(process.cwd(), "data", "products.json");

function getProducts(): ProductItem[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error reading products.json:", error);
  }
  return [];
}

function saveProducts(products: ProductItem[]): boolean {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing products.json:", error);
    return false;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const dbProduct = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { sku: id }, { slug: id }],
      },
    });
    if (dbProduct) {
      return NextResponse.json({
        id: dbProduct.id,
        sku: dbProduct.sku,
        name: dbProduct.name,
        subtitle: (dbProduct as any).subtitle || undefined,
        slug: dbProduct.slug,
        price: dbProduct.price,
        priceValue: dbProduct.priceValue,
        mrp: (dbProduct as any).mrp || undefined,
        rating: (dbProduct as any).rating || 4.8,
        ratingCount: (dbProduct as any).ratingCount || 85,
        selectedColor: (dbProduct as any).selectedColor || undefined,
        category: dbProduct.categoryName,
        categoryId: dbProduct.categoryId || undefined,
        collection: dbProduct.collectionName || undefined,
        collections: dbProduct.collectionName ? [dbProduct.collectionName] : [],
        foldedImg: dbProduct.foldedImg || "/images/folded-gopuram.jpeg",
        wornImg: dbProduct.wornImg || "/images/gopura.jpeg",
        altFolded: dbProduct.altFolded || dbProduct.name,
        altWorn: dbProduct.altWorn || dbProduct.name,
        fabric: dbProduct.fabric || "",
        sareeFabric: (dbProduct as any).sareeFabric || undefined,
        color: dbProduct.color || "",
        pattern: dbProduct.pattern || "",
        border: (dbProduct as any).border || undefined,
        blouse: (dbProduct as any).blouse || undefined,
        occasion: (dbProduct as any).occasion || undefined,
        sareeLength: (dbProduct as any).sareeLength || "5.5 metres",
        blouseLength: (dbProduct as any).blouseLength || "0.8 metres",
        careInstructions: (dbProduct as any).careInstructions || undefined,
        highlights: (dbProduct as any).highlights ? (typeof (dbProduct as any).highlights === "string" ? (dbProduct as any).highlights.split("\n").filter(Boolean) : (dbProduct as any).highlights) : undefined,
        stock: dbProduct.stock,
        description: dbProduct.description || "",
        status: (dbProduct.status as "active" | "inactive") || "active",
        featured: dbProduct.featured,
        isNewArrival: dbProduct.isNewArrival,
      });
    }
  } catch (err) {
    // Database offline - fallback to JSON
  }

  const products = getProducts();
  const product = products.find((p) => String(p.id) === String(id));

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(product);
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

    // Try updating in Prisma PostgreSQL
    try {
      await prisma.product.updateMany({
        where: {
          OR: [{ id }, { sku: id }],
        },
        data: {
          name: body.name !== undefined ? body.name : undefined,
          subtitle: body.subtitle !== undefined ? body.subtitle : undefined,
          slug: body.slug !== undefined ? body.slug : undefined,
          price: body.price !== undefined ? body.price : undefined,
          priceValue: body.priceValue !== undefined ? Number(body.priceValue) : undefined,
          mrp: body.mrp !== undefined ? (body.mrp === "" ? null : Number(body.mrp)) : undefined,
          rating: body.rating !== undefined ? Number(body.rating) : undefined,
          ratingCount: body.ratingCount !== undefined ? Number(body.ratingCount) : undefined,
          selectedColor: body.selectedColor !== undefined ? body.selectedColor : undefined,
          categoryName: body.category !== undefined ? body.category : undefined,
          collectionName: body.collection !== undefined ? body.collection : undefined,
          stock: body.stock !== undefined ? Number(body.stock) : undefined,
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
          highlights: body.highlights !== undefined ? (Array.isArray(body.highlights) ? body.highlights.join("\n") : body.highlights) : undefined,
          description: body.description !== undefined ? body.description : undefined,
          foldedImg: body.foldedImg !== undefined ? body.foldedImg : undefined,
          wornImg: body.wornImg !== undefined ? body.wornImg : undefined,
          status: body.status !== undefined ? body.status : undefined,
          featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
          isNewArrival: body.isNewArrival !== undefined ? Boolean(body.isNewArrival) : undefined,
        } as any,
      });
    } catch (dbErr) {
      // Database offline - fallback file sync proceeds
    }

    const products = getProducts();
    const index = products.findIndex((p) => String(p.id) === String(id));

    if (index === -1) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const current = products[index];
    const updatedProduct: ProductItem = {
      ...current,
      ...body,
      id: current.id, // Preserve ID
      priceValue: body.priceValue !== undefined ? Number(body.priceValue) : current.priceValue,
      mrp: body.mrp !== undefined && body.mrp !== "" ? Number(body.mrp) : current.mrp,
      rating: body.rating !== undefined ? Number(body.rating) : current.rating,
      ratingCount: body.ratingCount !== undefined ? Number(body.ratingCount) : current.ratingCount,
      stock: body.stock !== undefined ? Number(body.stock) : current.stock,
      isNewArrival: body.isNewArrival !== undefined ? Boolean(body.isNewArrival) : current.isNewArrival,
      collection: body.collection !== undefined ? body.collection : current.collection,
      collections: body.collections !== undefined ? body.collections : current.collections,
    };

    products[index] = updatedProduct;
    saveProducts(products);

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update product" },
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

    // Try deleting from Prisma PostgreSQL
    try {
      await prisma.product.deleteMany({
        where: {
          OR: [{ id }, { sku: id }],
        },
      });
    } catch (dbErr) {
      // Database offline - fallback file sync proceeds
    }

    const products = getProducts();
    const filtered = products.filter((p) => String(p.id) !== String(id));

    if (filtered.length === products.length) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    saveProducts(filtered);
    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
