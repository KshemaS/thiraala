import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";

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
}

const dataFilePath = path.join(process.cwd(), "data", "products.json");

function getProductsFromFile(): ProductItem[] {
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

function saveProductsToFile(products: ProductItem[]): boolean {
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

export async function GET() {
  try {
    const dbProducts = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (dbProducts && dbProducts.length > 0) {
      const formatted: ProductItem[] = dbProducts.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        subtitle: (p as any).subtitle || undefined,
        slug: p.slug,
        price: p.price,
        priceValue: p.priceValue,
        mrp: (p as any).mrp || undefined,
        rating: (p as any).rating || 4.8,
        ratingCount: (p as any).ratingCount || 85,
        selectedColor: (p as any).selectedColor || undefined,
        category: p.categoryName,
        categoryId: p.categoryId || undefined,
        collection: p.collectionName || undefined,
        collections: p.collectionName ? [p.collectionName] : [],
        collectionId: p.collectionId || undefined,
        foldedImg: p.foldedImg || "/images/folded-gopuram.jpeg",
        wornImg: p.wornImg || "/images/gopura.jpeg",
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
      }));
      return NextResponse.json(formatted);
    }
  } catch (err) {
    // Database offline - fallback to JSON file
  }

  const products = getProductsFromFile();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.sku) {
      return NextResponse.json(
        { success: false, error: "Product name and SKU are required." },
        { status: 400 }
      );
    }

    const newId = body.id || `prod_${Date.now()}`;
    const slug = body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const newProduct: ProductItem = {
      ...body,
      id: newId,
      slug,
      status: body.status || "active",
      stock: Number(body.stock) >= 0 ? Number(body.stock) : 0,
      priceValue: Number(body.priceValue) || (body.price ? Number(String(body.price).replace(/[^0-9]/g, "")) : 0),
    };

    // Try saving to Prisma
    try {
      await prisma.product.upsert({
        where: { sku: newProduct.sku },
        update: {
          name: newProduct.name,
          slug: newProduct.slug,
          price: newProduct.price,
          priceValue: newProduct.priceValue,
          categoryName: newProduct.category || "General",
          categoryId: newProduct.categoryId || null,
          collectionName: newProduct.collection || null,
          collectionId: newProduct.collectionId || null,
          stock: newProduct.stock,
          fabric: newProduct.fabric || null,
          color: newProduct.color || null,
          pattern: newProduct.pattern || null,
          description: newProduct.description || null,
          foldedImg: newProduct.foldedImg || null,
          wornImg: newProduct.wornImg || null,
          altFolded: newProduct.altFolded || null,
          altWorn: newProduct.altWorn || null,
          status: newProduct.status || "active",
          featured: Boolean(newProduct.featured),
          isNewArrival: Boolean(newProduct.isNewArrival),
        },
        create: {
          id: typeof newProduct.id === "string" ? newProduct.id : undefined,
          sku: newProduct.sku,
          name: newProduct.name,
          slug: newProduct.slug || slug,
          price: newProduct.price || "₹0",
          priceValue: Number(newProduct.priceValue) || 0,
          categoryName: newProduct.category || "General",
          categoryId: newProduct.categoryId || null,
          collectionName: newProduct.collection || null,
          collectionId: newProduct.collectionId || null,
          stock: Number(newProduct.stock) >= 0 ? Number(newProduct.stock) : 0,
          fabric: newProduct.fabric || null,
          color: newProduct.color || null,
          pattern: newProduct.pattern || null,
          description: newProduct.description || null,
          foldedImg: newProduct.foldedImg || null,
          wornImg: newProduct.wornImg || null,
          altFolded: newProduct.altFolded || null,
          altWorn: newProduct.altWorn || null,
          status: newProduct.status || "active",
          featured: Boolean(newProduct.featured),
          isNewArrival: Boolean(newProduct.isNewArrival),
        },
      });
    } catch (dbErr) {
      console.warn("Could not write product to DB, falling back to JSON only:", dbErr);
    }

    // Always update JSON fallback
    const products = getProductsFromFile();
    const existingIndex = products.findIndex((p) => p.sku === newProduct.sku || String(p.id) === String(newProduct.id));
    if (existingIndex >= 0) {
      products[existingIndex] = newProduct;
    } else {
      products.push(newProduct);
    }
    saveProductsToFile(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
