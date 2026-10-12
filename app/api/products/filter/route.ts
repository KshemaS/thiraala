import { NextResponse } from "next/server";
import { getAllUnifiedProducts, UnifiedProduct as FilteredProduct } from "@/lib/products";

export type { FilteredProduct };

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extraction of query filter parameters
    const categoryParam = searchParams.get("category")?.trim();
    const fabricParam = searchParams.get("fabric")?.trim();
    const colorParam = searchParams.get("color")?.trim();
    const occasionParam = searchParams.get("occasion")?.trim();
    const collectionParam = searchParams.get("collection")?.trim();
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const inStockParam = searchParams.get("inStock");
    const searchQuery = (searchParams.get("search") || searchParams.get("q") || "").trim().toLowerCase();
    const sortBy = (searchParams.get("sort") || searchParams.get("sortBy") || "default").toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limitParam = searchParams.get("limit");

    const allProducts = await getAllUnifiedProducts();

    // 1. Calculate dynamic facets from ALL available active products
    const categoryCountMap = new Map<string, number>();
    const fabricCountMap = new Map<string, number>();
    const colorCountMap = new Map<string, number>();
    const occasionCountMap = new Map<string, number>();
    let overallMinPrice = Infinity;
    let overallMaxPrice = -Infinity;

    for (const p of allProducts) {
      if (p.category) {
        categoryCountMap.set(p.category, (categoryCountMap.get(p.category) || 0) + 1);
      }
      if (p.fabric) {
        fabricCountMap.set(p.fabric, (fabricCountMap.get(p.fabric) || 0) + 1);
      }
      if (p.color) {
        colorCountMap.set(p.color, (colorCountMap.get(p.color) || 0) + 1);
      }
      if (p.occasion) {
        occasionCountMap.set(p.occasion, (occasionCountMap.get(p.occasion) || 0) + 1);
      }
      if (p.priceValue > 0) {
        if (p.priceValue < overallMinPrice) overallMinPrice = p.priceValue;
        if (p.priceValue > overallMaxPrice) overallMaxPrice = p.priceValue;
      }
    }

    if (overallMinPrice === Infinity) overallMinPrice = 0;
    if (overallMaxPrice === -Infinity) overallMaxPrice = 5000;

    // 2. Filter products based on active criteria
    let filtered = [...allProducts];

    // Category filter (supports comma-separated multi-select e.g. "Cotton Saree,Tissue Saree")
    if (categoryParam && categoryParam !== "All") {
      const allowedCategories = categoryParam
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean);
      if (allowedCategories.length > 0) {
        filtered = filtered.filter((p) =>
          allowedCategories.includes((p.category || "").toLowerCase())
        );
      }
    }

    // Fabric filter (supports comma-separated multi-select)
    if (fabricParam && fabricParam !== "All") {
      const allowedFabrics = fabricParam
        .split(",")
        .map((f) => f.trim().toLowerCase())
        .filter(Boolean);
      if (allowedFabrics.length > 0) {
        filtered = filtered.filter(
          (p) =>
            allowedFabrics.includes((p.fabric || "").toLowerCase()) ||
            allowedFabrics.includes((p.sareeFabric || "").toLowerCase())
        );
      }
    }

    // Color filter
    if (colorParam && colorParam !== "All") {
      const targetColor = colorParam.toLowerCase();
      filtered = filtered.filter((p) =>
        (p.color || "").toLowerCase().includes(targetColor) ||
        (p.selectedColor || "").toLowerCase().includes(targetColor)
      );
    }

    // Occasion filter
    if (occasionParam && occasionParam !== "All") {
      const targetOccasion = occasionParam.toLowerCase();
      filtered = filtered.filter((p) =>
        (p.occasion || "").toLowerCase().includes(targetOccasion)
      );
    }

    // Collection filter
    if (collectionParam && collectionParam !== "All") {
      const targetCollection = collectionParam.toLowerCase();
      filtered = filtered.filter((p) =>
        (p.collection || "").toLowerCase().includes(targetCollection)
      );
    }

    // Price range filters
    if (minPriceParam !== null && minPriceParam !== undefined && minPriceParam !== "") {
      const minVal = parseFloat(minPriceParam);
      if (!isNaN(minVal)) {
        filtered = filtered.filter((p) => p.priceValue >= minVal);
      }
    }

    if (maxPriceParam !== null && maxPriceParam !== undefined && maxPriceParam !== "") {
      const maxVal = parseFloat(maxPriceParam);
      if (!isNaN(maxVal)) {
        filtered = filtered.filter((p) => p.priceValue <= maxVal);
      }
    }

    // Stock availability filter
    if (inStockParam === "true" || inStockParam === "1") {
      filtered = filtered.filter((p) => (p.stock ?? 0) > 0);
    }

    // Keyword search filter
    if (searchQuery) {
      filtered = filtered.filter((p) => {
        const titleMatch = (p.name || "").toLowerCase().includes(searchQuery);
        const skuMatch = (p.sku || "").toLowerCase().includes(searchQuery);
        const categoryMatch = (p.category || "").toLowerCase().includes(searchQuery);
        const fabricMatch = (p.fabric || "").toLowerCase().includes(searchQuery);
        const colorMatch = (p.color || "").toLowerCase().includes(searchQuery);
        const descMatch = (p.description || "").toLowerCase().includes(searchQuery);
        return titleMatch || skuMatch || categoryMatch || fabricMatch || colorMatch || descMatch;
      });
    }

    // 3. Sorting
    switch (sortBy) {
      case "price_asc":
      case "price-low-to-high":
        filtered.sort((a, b) => a.priceValue - b.priceValue);
        break;
      case "price_desc":
      case "price-high-to-low":
        filtered.sort((a, b) => b.priceValue - a.priceValue);
        break;
      case "rating":
      case "rating_desc":
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
      case "date":
        filtered.sort((a, b) => {
          if (a.isNewArrival && !b.isNewArrival) return -1;
          if (!a.isNewArrival && b.isNewArrival) return 1;
          return Number(b.id) - Number(a.id);
        });
        break;
      case "name_asc":
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "featured":
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      default:
        // Keep original order
        break;
    }

    // 4. Pagination
    const totalFiltered = filtered.length;
    let paginatedProducts = filtered;
    let limit = totalFiltered; // default to returning all matches unless limit specified

    if (limitParam && limitParam !== "all" && parseInt(limitParam, 10) > 0) {
      limit = parseInt(limitParam, 10);
      const startIndex = (page - 1) * limit;
      paginatedProducts = filtered.slice(startIndex, startIndex + limit);
    }

    const totalPages = limit > 0 ? Math.ceil(totalFiltered / limit) : 1;

    // 5. Build structured facets for frontend filters
    const categoriesFacet = Array.from(categoryCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const fabricsFacet = Array.from(fabricCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const colorsFacet = Array.from(colorCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const occasionsFacet = Array.from(occasionCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      success: true,
      total: allProducts.length,
      filteredCount: totalFiltered,
      page,
      limit,
      totalPages,
      products: paginatedProducts,
      facets: {
        categories: categoriesFacet,
        fabrics: fabricsFacet,
        colors: colorsFacet,
        occasions: occasionsFacet,
        priceRange: {
          min: overallMinPrice,
          max: overallMaxPrice,
        },
      },
    });
  } catch (error: any) {
    console.error("Products filter API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process products filter request.",
        products: [],
      },
      { status: 500 }
    );
  }
}
