import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { sareesData, SareeProduct } from "@/data/products";

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
  status?: string;
  featured?: boolean;
  isNewArrival?: boolean;
}

const dataFilePath = path.join(process.cwd(), "data", "products.json");

function resolveImgPath(img: any, fallback: string): string {
  if (!img) return fallback;
  if (typeof img === "string") return img;
  if (img.src && typeof img.src === "string") return img.src;
  return fallback;
}

export async function getAllUnifiedProducts(): Promise<UnifiedProduct[]> {
  // 1. Try Prisma DB
  try {
    if ((prisma as any)?.product) {
      const dbProducts = await (prisma as any).product.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
      });

      if (dbProducts && dbProducts.length > 0) {
        return dbProducts.map((p: any) => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          subtitle: p.subtitle || undefined,
          slug: p.slug,
          price: p.price,
          priceValue: p.priceValue || parseInt(String(p.price).replace(/[^\d]/g, ""), 10) || 0,
          mrp: p.mrp || undefined,
          discountPercent: p.mrp && p.priceValue ? Math.round(((p.mrp - p.priceValue) / p.mrp) * 100) : undefined,
          rating: p.rating || 4.8,
          ratingCount: p.ratingCount || 85,
          selectedColor: p.selectedColor || undefined,
          category: p.categoryName || "Handloom Saree",
          collection: p.collectionName || undefined,
          foldedImg: resolveImgPath(p.foldedImg, "/images/folded-gopuram.jpeg"),
          wornImg: resolveImgPath(p.wornImg, "/images/gopura.jpeg"),
          img: resolveImgPath(p.wornImg || p.foldedImg, "/images/gopura.jpeg"),
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
          stock: p.stock ?? 10,
          description: p.description || "",
          status: p.status || "active",
          featured: Boolean(p.featured),
          isNewArrival: Boolean(p.isNewArrival),
        }));
      }
    }
  } catch {
    // Database offline - proceed to file/catalog
  }

  // 2. Load from data/products.json (dashboard created products)
  const productsMap = new Map<string, UnifiedProduct>();

  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.status === "inactive") continue;
          productsMap.set(String(item.id), {
            id: item.id,
            sku: item.sku || `THR-${item.id}`,
            name: item.name,
            subtitle: item.subtitle,
            slug: item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            price: item.price || `₹${item.priceValue || 0}`,
            priceValue: item.priceValue || parseInt(String(item.price).replace(/[^\d]/g, ""), 10) || 0,
            mrp: item.mrp,
            discountPercent: item.mrp && item.priceValue ? Math.round(((item.mrp - item.priceValue) / item.mrp) * 100) : undefined,
            rating: item.rating !== undefined ? item.rating : 4.8,
            ratingCount: item.ratingCount !== undefined ? item.ratingCount : 85,
            selectedColor: item.selectedColor,
            category: item.category || "Cotton Saree",
            collection: item.collection,
            foldedImg: resolveImgPath(item.foldedImg, "/images/folded-gopuram.jpeg"),
            wornImg: resolveImgPath(item.wornImg, "/images/gopura.jpeg"),
            img: resolveImgPath(item.wornImg || item.foldedImg, "/images/gopura.jpeg"),
            altFolded: item.altFolded || item.name,
            altWorn: item.altWorn || item.name,
            fabric: item.fabric || "Cotton",
            sareeFabric: item.sareeFabric,
            color: item.color || "",
            pattern: item.pattern,
            border: item.border,
            blouse: item.blouse,
            occasion: item.occasion,
            sareeLength: item.sareeLength || "5.5 metres",
            blouseLength: item.blouseLength || "0.8 metres",
            careInstructions: item.careInstructions,
            highlights: item.highlights,
            stock: item.stock ?? 10,
            description: item.description || "",
            status: item.status || "active",
            featured: item.featured,
            isNewArrival: Boolean(item.isNewArrival),
          });
        }
      }
    }
  } catch (err) {
    console.error("Error reading products.json:", err);
  }

  // 3. Merge base catalogue from data/products.ts
  for (const item of sareesData) {
    if (!productsMap.has(String(item.id))) {
      productsMap.set(String(item.id), {
        id: item.id,
        sku: item.sku,
        name: item.name,
        subtitle: item.subtitle,
        slug: item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        price: item.price,
        priceValue: item.priceValue || parseInt(String(item.price).replace(/[^\d]/g, ""), 10) || 0,
        mrp: item.mrp,
        discountPercent: item.mrp && item.priceValue ? Math.round(((item.mrp - item.priceValue) / item.mrp) * 100) : undefined,
        rating: item.rating || 4.8,
        ratingCount: item.ratingCount || 85,
        selectedColor: item.selectedColor,
        category: item.category,
        collection: item.collection,
        foldedImg: resolveImgPath(item.foldedImg, "/images/folded-gopuram.jpeg"),
        wornImg: resolveImgPath(item.wornImg, "/images/gopura.jpeg"),
        img: resolveImgPath(item.wornImg || item.foldedImg, "/images/gopura.jpeg"),
        altFolded: item.altFolded || item.name,
        altWorn: item.altWorn || item.name,
        fabric: item.fabric || "Cotton",
        sareeFabric: item.sareeFabric,
        color: item.color || "",
        pattern: item.pattern,
        border: item.border,
        blouse: item.blouse,
        occasion: item.occasion,
        sareeLength: item.sareeLength || "5.5 metres",
        blouseLength: item.blouseLength || "0.8 metres",
        careInstructions: item.careInstructions,
        highlights: item.highlights,
        stock: item.stock ?? 10,
        description: item.description || "",
        status: item.status || "active",
        featured: item.featured,
        isNewArrival: item.isNewArrival,
      });
    }
  }

  return Array.from(productsMap.values());
}

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
