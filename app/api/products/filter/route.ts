import { NextResponse } from "next/server";
import { queryShopProducts, UnifiedProduct as FilteredProduct } from "@/lib/products";

export type { FilteredProduct };

const num = (v: string | null) => {
  if (v === null || v.trim() === "") return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};

/**
 * GET — the shop's product listing. Filtering, sorting and paging happen in
 * the database (lib/products.ts queryShopProducts), so only the products on
 * the requested page are loaded.
 *
 * Query: category, fabric (comma-separated), color, occasion, collection,
 * minPrice, maxPrice, inStock, search|q, sort|sortBy, page, limit ("all" or
 * a number; default all), facets=0 to skip the filter options.
 */
export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;
    const limitParam = sp.get("limit");
    const limit = limitParam && limitParam !== "all" ? parseInt(limitParam, 10) : undefined;

    const result = await queryShopProducts(
      {
        category: sp.get("category")?.trim(),
        fabric: sp.get("fabric")?.trim(),
        color: sp.get("color")?.trim(),
        occasion: sp.get("occasion")?.trim(),
        collection: sp.get("collection")?.trim(),
        minPrice: num(sp.get("minPrice")),
        maxPrice: num(sp.get("maxPrice")),
        inStock: sp.get("inStock") === "true" || sp.get("inStock") === "1",
        search: (sp.get("search") || sp.get("q") || "").trim(),
        sort: sp.get("sort") || sp.get("sortBy") || "default",
        page: parseInt(sp.get("page") || "1", 10) || 1,
        limit: limit && limit > 0 ? Math.min(limit, 100) : undefined,
      },
      { facets: sp.get("facets") !== "0" }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Products filter API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process products filter request.", products: [] },
      { status: 500 }
    );
  }
}
