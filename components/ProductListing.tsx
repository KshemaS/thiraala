"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CategoryCard from "@/components/CategoryCard";
import Container from "@/components/Container";
import { motion, AnimatePresence } from "framer-motion";
import { FilteredProduct } from "@/app/api/products/filter/route";

interface FacetItem {
  name: string;
  count: number;
}

interface FacetsData {
  categories: FacetItem[];
  fabrics: FacetItem[];
  colors: FacetItem[];
  occasions: FacetItem[];
  priceRange: {
    min: number;
    max: number;
  };
}

const PRICE_PRESETS = [
  { label: "All Prices", min: undefined, max: undefined },
  { label: "Under ₹1,000", min: undefined, max: 1000 },
  { label: "₹1,000 - ₹1,500", min: 1000, max: 1500 },
  { label: "Above ₹1,500", min: 1500, max: undefined },
];

const SORT_OPTIONS = [
  { value: "default", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "New Arrivals" },
  { value: "name_asc", label: "Name: A to Z" },
];

export default function ProductListing() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Read initial query params
  const initialCategory = searchParams.get("category") || "All";
  const initialFabric = searchParams.get("fabric") || "All";
  const initialSort = searchParams.get("sort") || "default";
  const initialSearch = searchParams.get("q") || searchParams.get("search") || "";
  const initialMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const initialMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedFabric, setSelectedFabric] = useState<string>(initialFabric);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [selectedPriceIdx, setSelectedPriceIdx] = useState<number>(() => {
    if (initialMinPrice === 1000 && initialMaxPrice === 1500) return 2;
    if (initialMaxPrice === 1000) return 1;
    if (initialMinPrice === 1500) return 3;
    return 0;
  });
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Products and facets data
  const [products, setProducts] = useState<FilteredProduct[]>([]);
  const [facets, setFacets] = useState<FacetsData>({
    categories: [],
    fabrics: [],
    colors: [],
    occasions: [],
    priceRange: { min: 0, max: 5000 },
  });
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from /api/products/filter
  const fetchFilteredProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();

      if (selectedCategory && selectedCategory !== "All") {
        params.set("category", selectedCategory);
      }
      if (selectedFabric && selectedFabric !== "All") {
        params.set("fabric", selectedFabric);
      }
      if (sortBy && sortBy !== "default") {
        params.set("sort", sortBy);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      if (inStockOnly) {
        params.set("inStock", "true");
      }

      const activePricePreset = PRICE_PRESETS[selectedPriceIdx];
      if (activePricePreset.min !== undefined) {
        params.set("minPrice", String(activePricePreset.min));
      }
      if (activePricePreset.max !== undefined) {
        params.set("maxPrice", String(activePricePreset.max));
      }

      const res = await fetch(`/api/products/filter?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch filtered products");
      }
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        if (data.facets) {
          setFacets(data.facets);
        }
        setFilteredCount(data.filteredCount ?? data.products?.length ?? 0);
        setTotalCount(data.total ?? data.products?.length ?? 0);
      } else {
        throw new Error(data.error || "Failed to load products");
      }
    } catch (err: any) {
      console.error("Filter request error:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedFabric, sortBy, searchQuery, selectedPriceIdx, inStockOnly]);

  useEffect(() => {
    fetchFilteredProducts();
  }, [fetchFilteredProducts]);

  // Keep URL query string in sync smoothly without page reload
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== "All") params.set("category", selectedCategory);
    if (selectedFabric !== "All") params.set("fabric", selectedFabric);
    if (sortBy !== "default") params.set("sort", sortBy);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());

    const activePrice = PRICE_PRESETS[selectedPriceIdx];
    if (activePrice.min !== undefined) params.set("minPrice", String(activePrice.min));
    if (activePrice.max !== undefined) params.set("maxPrice", String(activePrice.max));

    const newQuery = params.toString();
    const targetUrl = newQuery ? `/products?${newQuery}` : "/products";

    startTransition(() => {
      window.history.replaceState(null, "", targetUrl);
    });
  }, [selectedCategory, selectedFabric, sortBy, searchQuery, selectedPriceIdx]);

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedFabric("All");
    setSelectedPriceIdx(0);
    setSearchQuery("");
    setSortBy("default");
    setInStockOnly(false);
  };

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedFabric !== "All" ||
    selectedPriceIdx !== 0 ||
    Boolean(searchQuery.trim()) ||
    sortBy !== "default" ||
    inStockOnly;

  return (
    <section className="w-full py-10 lg:py-14">
      <Container>
        {/* Top Header Controls: Search bar & Sorter & Result Counter */}
        <div className="w-full mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-5 rounded-[22px] border border-[#1E3A2C]/10 shadow-[0_4px_20px_rgba(30,58,44,0.03)]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E3A2C]/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by saree name, fabric, design..."
              className="w-full pl-10 pr-9 py-2 sm:py-2.5 bg-[#fbfaf8] border border-[#1E3A2C]/15 rounded-xl text-xs text-[#1E3A2C] placeholder:text-[#1E3A2C]/40 focus:outline-none focus:border-[#DAA87C] focus:ring-2 focus:ring-[#DAA87C]/20 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E3A2C]/40 hover:text-[#1E3A2C] text-xs"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Counts & Sorter */}
          <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 sm:gap-4 w-full md:w-auto">
            <div className="text-[11px] sm:text-xs text-[#1E3A2C]/65 font-medium shrink-0">
              {loading ? (
                <span>Loading weaves...</span>
              ) : (
                <span>
                  Showing <strong className="text-[#1E3A2C] font-bold">{filteredCount}</strong> of{" "}
                  <strong className="text-[#1E3A2C] font-bold">{totalCount}</strong> sarees
                </span>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <label htmlFor="sort-dropdown" className="text-xs text-[#1E3A2C]/50 hidden sm:inline">
                Sort:
              </label>
              <select
                id="sort-dropdown"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 px-2.5 sm:py-2 sm:px-3 bg-[#fbfaf8] border border-[#1E3A2C]/15 rounded-xl text-[11px] sm:text-xs font-semibold text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] cursor-pointer max-w-[140px] sm:max-w-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips / Badges */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#1E3A2C]/50 uppercase tracking-wider mr-1">
              Active Filters:
            </span>

            {selectedCategory !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#1E3A2C] text-[#fcfbfa] font-medium shadow-xs">
                Category: {selectedCategory}
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className="hover:text-[#DAA87C] ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {selectedFabric !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#1E3A2C] text-[#fcfbfa] font-medium shadow-xs">
                Fabric: {selectedFabric}
                <button
                  type="button"
                  onClick={() => setSelectedFabric("All")}
                  className="hover:text-[#DAA87C] ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {selectedPriceIdx !== 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#DAA87C]/15 border border-[#DAA87C]/30 text-[#1E3A2C] font-medium shadow-xs">
                Price: {PRICE_PRESETS[selectedPriceIdx].label}
                <button
                  type="button"
                  onClick={() => setSelectedPriceIdx(0)}
                  className="hover:text-red-500 ml-0.5 cursor-pointer font-bold"
                >
                  ✕
                </button>
              </span>
            )}

            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-[#1E3A2C]/10 text-[#1E3A2C] font-medium">
                Search: &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-red-500 ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                In Stock Only
                <button
                  type="button"
                  onClick={() => setInStockOnly(false)}
                  className="hover:text-red-500 ml-0.5 cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-[#DAA87C] hover:underline underline-offset-4 ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden w-full mb-4">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="w-full py-3 px-4 rounded-2xl border border-[#1E3A2C]/15 bg-white flex items-center justify-between text-xs font-bold text-[#1E3A2C] shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#DAA87C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>{isMobileFilterOpen ? "Hide Filter Options" : "Filter Sarees"}</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-[#DAA87C]" />
              )}
            </div>
            <span className="text-[11px] text-[#DAA87C] font-semibold">
              {isMobileFilterOpen ? "Close ▲" : "Filter ▼"}
            </span>
          </button>
        </div>

        {/* Main Layout: Filter Sidebar + Products Grid */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start w-full">
          {/* Left Sidebar: Filter Panel */}
          <aside className={`${isMobileFilterOpen ? "block" : "hidden lg:block"} w-full lg:w-[270px] flex-shrink-0 bg-white p-6 rounded-[24px] border border-[#1E3A2C]/10 shadow-[0_10px_30px_rgba(30,58,44,0.02)] space-y-6`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A2C]/10">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#DAA87C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h3 className="text-xs font-extrabold text-[#1E3A2C] uppercase tracking-wider">
                  Filters
                </h3>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-[#DAA87C] hover:text-[#1E3A2C] transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-[#1E3A2C] uppercase tracking-wider flex items-center justify-between">
                <span>Category</span>
                <span className="text-[10px] text-[#1E3A2C]/40 font-normal">
                  {facets.categories.length} available
                </span>
              </h4>
              <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto pr-1">
                {/* "All" Category */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All")}
                  className={`w-full flex items-center justify-between text-xs py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    selectedCategory === "All"
                      ? "bg-[#1E3A2C] text-[#fcfbfa] font-bold shadow-xs"
                      : "text-[#1E3A2C]/75 hover:bg-[#1E3A2C]/5 hover:text-[#1E3A2C]"
                  }`}
                >
                  <span>All Categories</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedCategory === "All"
                        ? "bg-white/20 text-white"
                        : "bg-[#1E3A2C]/5 text-[#1E3A2C]/60"
                    }`}
                  >
                    {totalCount}
                  </span>
                </button>

                {/* Categories from Facets */}
                {facets.categories.map((cat) => {
                  const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setSelectedCategory(isActive ? "All" : cat.name)}
                      className={`w-full flex items-center justify-between text-xs py-2 px-3 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#1E3A2C] text-[#fcfbfa] font-bold shadow-xs"
                          : "text-[#1E3A2C]/75 hover:bg-[#1E3A2C]/5 hover:text-[#1E3A2C]"
                      }`}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#1E3A2C]/5 text-[#1E3A2C]/60"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fabric Filter */}
            <div className="space-y-3 pt-2 border-t border-[#1E3A2C]/10">
              <h4 className="text-[11px] font-bold text-[#1E3A2C] uppercase tracking-wider flex items-center justify-between">
                <span>Fabric</span>
                <span className="text-[10px] text-[#1E3A2C]/40 font-normal">
                  {facets.fabrics.length} types
                </span>
              </h4>
              <div className="flex flex-col gap-1 max-h-[190px] overflow-y-auto pr-1">
                {/* "All" Fabric */}
                <button
                  type="button"
                  onClick={() => setSelectedFabric("All")}
                  className={`w-full flex items-center justify-between text-xs py-2 px-3 rounded-xl transition-all cursor-pointer ${
                    selectedFabric === "All"
                      ? "bg-[#1E3A2C] text-[#fcfbfa] font-bold shadow-xs"
                      : "text-[#1E3A2C]/75 hover:bg-[#1E3A2C]/5 hover:text-[#1E3A2C]"
                  }`}
                >
                  <span>All Fabrics</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedFabric === "All"
                        ? "bg-white/20 text-white"
                        : "bg-[#1E3A2C]/5 text-[#1E3A2C]/60"
                    }`}
                  >
                    {totalCount}
                  </span>
                </button>

                {/* Fabrics from Facets */}
                {facets.fabrics.map((fab) => {
                  const isActive = selectedFabric.toLowerCase() === fab.name.toLowerCase();
                  return (
                    <button
                      key={fab.name}
                      type="button"
                      onClick={() => setSelectedFabric(isActive ? "All" : fab.name)}
                      className={`w-full flex items-center justify-between text-xs py-2 px-3 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#1E3A2C] text-[#fcfbfa] font-bold shadow-xs"
                          : "text-[#1E3A2C]/75 hover:bg-[#1E3A2C]/5 hover:text-[#1E3A2C]"
                      }`}
                    >
                      <span className="truncate pr-2">{fab.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#1E3A2C]/5 text-[#1E3A2C]/60"
                        }`}
                      >
                        {fab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Preset Filter */}
            <div className="space-y-3 pt-2 border-t border-[#1E3A2C]/10">
              <h4 className="text-[11px] font-bold text-[#1E3A2C] uppercase tracking-wider">
                Price Range
              </h4>
              <div className="flex flex-col gap-1.5">
                {PRICE_PRESETS.map((preset, idx) => {
                  const isActive = selectedPriceIdx === idx;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSelectedPriceIdx(idx)}
                      className={`w-full text-left text-xs py-2 px-3 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#DAA87C]/15 border border-[#DAA87C] text-[#1E3A2C] font-bold shadow-xs"
                          : "text-[#1E3A2C]/75 hover:bg-[#1E3A2C]/5 hover:text-[#1E3A2C]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* In Stock Only Checkbox */}
            <div className="pt-2 border-t border-[#1E3A2C]/10">
              <label className="flex items-center gap-2.5 text-xs text-[#1E3A2C] font-semibold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 accent-[#1E3A2C] rounded border-[#1E3A2C]/30 focus:ring-[#DAA87C]"
                />
                <span>In Stock Weaves Only</span>
              </label>
            </div>
          </aside>

          {/* Right Product Grid */}
          <div className="flex-1 w-full min-h-[400px]">
            {/* Loading Skeletons */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[30px] gap-y-[50px]">
                {[1, 2, 3, 4, 5, 6].map((sk) => (
                  <div
                    key={sk}
                    className="flex flex-col bg-white rounded-2xl border border-[#1E3A2C]/5 overflow-hidden shadow-sm animate-pulse"
                  >
                    <div className="aspect-square bg-[#1E3A2C]/5 w-full" />
                    <div className="p-5 space-y-3">
                      <div className="h-4 bg-[#1E3A2C]/10 rounded-md w-3/4" />
                      <div className="h-3 bg-[#1E3A2C]/5 rounded-md w-1/2" />
                      <div className="flex items-center justify-between pt-2">
                        <div className="h-5 bg-[#1E3A2C]/10 rounded-md w-16" />
                        <div className="h-4 bg-[#1E3A2C]/5 rounded-md w-20" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              /* Error State */
              <div className="w-full text-center py-20 bg-white border border-red-100 rounded-[32px] shadow-sm">
                <h3 className="text-lg font-bold text-red-600 mb-2">Error loading products</h3>
                <p className="text-sm text-[#1E3A2C]/60 mb-6">{error}</p>
                <button
                  type="button"
                  onClick={fetchFilteredProducts}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-[#1E3A2C] rounded-full hover:bg-[#0c2b1c] transition-all cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : products.length > 0 ? (
              /* Products Grid */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[30px] gap-y-[50px]"
              >
                <AnimatePresence>
                  {products.map((saree) => (
                    <CategoryCard
                      key={saree.id}
                      product={{
                        id: saree.id,
                        name: saree.name,
                        price: saree.price,
                        foldedImg: saree.foldedImg,
                        wornImg: saree.wornImg,
                        img: saree.img || saree.wornImg,
                        altFolded: saree.altFolded || saree.name,
                        altWorn: saree.altWorn || saree.name,
                      }}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Empty State */
              <div className="w-full text-center py-20 bg-white border border-[#1E3A2C]/5 rounded-[32px] shadow-sm p-8">
                <svg className="w-14 h-14 mx-auto stroke-[#DAA87C] opacity-70 mb-4" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-[#1E3A2C] mb-2">No sarees match your filters</h3>
                <p className="text-sm text-[#1E3A2C]/60 max-w-sm mx-auto">
                  We couldn&apos;t find any sarees matching your selected criteria. Try adjusting the category, fabric, or price range.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 px-7 py-3 text-xs font-bold text-[#fcfbfa] bg-[#1E3A2C] rounded-full hover:bg-[#0c2b1c] transition-all cursor-pointer shadow-md hover:scale-102"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
