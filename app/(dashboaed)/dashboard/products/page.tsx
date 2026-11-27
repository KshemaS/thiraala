"use client";


import { errorMessage } from "@/lib/errors";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { m, AnimatePresence } from "framer-motion";
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  ExternalLink,
  Tag,
  Layers,
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductItem } from "@/app/api/products/route";

const PAGE_SIZE = 50;

export default function ProductsListPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStockFilter, setSelectedStockFilter] = useState<"All" | "InStock" | "OutOfStock" | "NewArrivals">("All");

  // One page of products at a time; search and filters run on the server.
  const [page, setPage] = useState(1);
  const [filteredCount, setFilteredCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [metrics, setMetrics] = useState({ total: 0, inStock: 0, outOfStock: 0, totalCategories: 0 });
  const [categoryNames, setCategoryNames] = useState<string[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);
  // Changing the search or a filter goes back to page 1.
  const filterKey = `${debouncedSearch}|${selectedCategory}|${selectedStockFilter}`;
  const [pageFor, setPageFor] = useState(filterKey);
  if (pageFor !== filterKey) {
    setPageFor(filterKey);
    setPage(1);
  }

  // Deletion modal state
  const [deletingProduct, setDeletingProduct] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  // Bulk selection + price dialog
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkBusy, setIsBulkBusy] = useState(false);
  const [priceDialog, setPriceDialog] = useState<{ mode: "set" | "percent"; value: string } | null>(null);

  // Fetch the current page of products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (selectedStockFilter !== "All") params.set("stock", selectedStockFilter);
      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);
          setFilteredCount(data.filteredCount);
          setTotalPages(data.totalPages);
          setMetrics(data.metrics);
          setCategoryNames(data.categories);
        }
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, selectedStockFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads the current page from the server; the data arrives asynchronously
    fetchProducts();

    const handleProductsUpdated = () => {
      fetchProducts();
    };

    window.addEventListener("thiraala-products-updated", handleProductsUpdated);
    return () => {
      window.removeEventListener("thiraala-products-updated", handleProductsUpdated);
    };
  }, [fetchProducts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Quick adjust stock
  const handleQuickStockChange = async (product: ProductItem, delta: number) => {
    const newStock = Math.max(0, (product.stock ?? 0) + delta);
    const updatedProducts = products.map((p) =>
      p.id === product.id ? { ...p, stock: newStock } : p
    );
    setProducts(updatedProducts);

    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: newStock }),
      });
    } catch (err) {
      console.error("Failed to update stock:", err);
    }
  };

  // Toggle New Arrival directly from table
  const handleToggleNewArrival = async (product: ProductItem) => {
    const updatedStatus = !product.isNewArrival;
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, isNewArrival: updatedStatus } : p))
    );

    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isNewArrival: updatedStatus }),
      });
      showToast(
        updatedStatus
          ? `Marked "${product.name}" as New Arrival`
          : `Removed "${product.name}" from New Arrivals`
      );
    } catch (err) {
      console.error("Failed to toggle New Arrival:", err);
    }
  };

  // Delete product
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
        showToast(`Deleted "${deletingProduct.name}"`);
        setDeletingProduct(null);
      } else {
        const data = await res.json().catch(() => ({}));
        // Products in past orders can't be deleted; offer to hide instead.
        setDeleteError(data.error || "Failed to delete product.");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      setDeleteError("Error deleting product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    setDeletingProduct(null);
    setDeleteError(null);
  };

  // Show in / hide from the shop
  const handleToggleVisibility = async (product: ProductItem) => {
    const status = product.status === "inactive" ? "active" : "inactive";
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, status } : p)));
      showToast(status === "active" ? `"${product.name}" is now visible in the shop` : `"${product.name}" is hidden from the shop`);
      window.dispatchEvent(new Event("thiraala-products-updated"));
      return true;
    }
    showToast("Failed to update product.");
    return false;
  };

  const handleDuplicate = async (product: ProductItem) => {
    const res = await fetch(`/api/admin/products/${product.id}/duplicate`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      router.push(`/dashboard/products/edit/${data.id}`);
    } else {
      showToast(data.error || "Failed to duplicate product.");
    }
  };

  const toggleSelected = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const runBulk = async (payload: Record<string, unknown>, done: string) => {
    setIsBulkBusy(true);
    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], ...payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || "Bulk update failed.");
      showToast(done.replace("{n}", String(data.updated)));
      setSelectedIds(new Set());
      setPriceDialog(null);
      await fetchProducts();
      window.dispatchEvent(new Event("thiraala-products-updated"));
    } catch (err) {
      alert(errorMessage(err));
    } finally {
      setIsBulkBusy(false);
    }
  };

  // Categories for the filter, counts over all products (both from the
  // server), and this page's products (already searched and filtered).
  const categoriesList = ["All", ...categoryNames];
  const filteredProducts = products;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <m.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-24 right-8 z-50 px-4 py-3 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold shadow-lg border border-[#DAA87C]/30 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-[#DAA87C]" />
          <span>{toastMessage}</span>
        </m.div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E3A2C]/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A2C]/50 mb-1">
            <Link href="/dashboard" className="hover:text-[#1E3A2C]">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#DAA87C] font-bold">Products</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight flex items-center gap-3">
            <Package className="w-6 h-6 text-[#DAA87C]" />
            <span>Products Catalog</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] font-semibold">
              {metrics.total} {metrics.total === 1 ? "Item" : "Items"}
            </span>
          </h1>
          <p className="text-xs text-[#1E3A2C]/60 mt-1">
            Manage your saree collection, catalog inventory, fabric details, and pricing.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => fetchProducts()}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[#1E3A2C]/15 bg-white text-[#1E3A2C] hover:bg-[#FAF8F5] transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#DAA87C]" : ""}`} />
          </button>

          <Link
            href="/dashboard/products/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-bold hover:bg-[#284f3c] transition-all shadow-sm border border-[#DAA87C]/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#DAA87C]" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1E3A2C]/60">Total Sarees</span>
            <span className="w-8 h-8 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-[#DAA87C]">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#1E3A2C] mt-2">{metrics.total}</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1E3A2C]/60">In Stock</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Check className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{metrics.inStock}</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1E3A2C]/60">Out of Stock</span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-2">{metrics.outOfStock}</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1E3A2C]/60">Categories</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#1E3A2C] mt-2">{metrics.totalCategories}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-4 shadow-2xs flex flex-col md:flex-row gap-4 md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1E3A2C]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by saree title, SKU code, or fabric..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/50 font-medium"
          />
        </div>

        {/* Category & Stock Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-3 pr-8 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs font-semibold text-[#1E3A2C] bg-[#FAF8F5]/50 focus:outline-none focus:border-[#DAA87C] appearance-none cursor-pointer"
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? "All Categories" : cat}
                </option>
              ))}
            </select>
            <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-[#1E3A2C]/40" />
          </div>

          {/* Stock Filter */}
          <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#1E3A2C]/10">
            {(["All", "InStock", "OutOfStock", "NewArrivals"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedStockFilter(filter)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  selectedStockFilter === filter
                    ? "bg-white text-[#1E3A2C] shadow-2xs font-bold"
                    : "text-[#1E3A2C]/60 hover:text-[#1E3A2C]"
                }`}
              >
                {filter === "All"
                  ? "All Stock"
                  : filter === "InStock"
                  ? "In Stock"
                  : filter === "OutOfStock"
                  ? "Out of Stock"
                  : "✨ New Arrivals"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk actions for checked products */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-[#1E3A2C] text-white">
          <span className="text-xs font-bold px-2">{selectedIds.size} selected</span>
          <button type="button" disabled={isBulkBusy} onClick={() => runBulk({ action: "show" }, "{n} products are now visible in the shop")}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> Show in shop
          </button>
          <button type="button" disabled={isBulkBusy} onClick={() => runBulk({ action: "hide" }, "{n} products hidden from the shop")}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5" /> Hide from shop
          </button>
          <button type="button" disabled={isBulkBusy} onClick={() => setPriceDialog({ mode: "percent", value: "" })}
            className="px-3 py-1.5 rounded-lg bg-white text-[#1E3A2C] hover:bg-[#FAF8F5] text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" /> Change price…
          </button>
          {isBulkBusy && <span className="text-xs opacity-80">Updating…</span>}
          <button type="button" onClick={() => setSelectedIds(new Set())}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold text-white/80 hover:text-white cursor-pointer">
            Clear
          </button>
        </div>
      )}

      {/* Products Table Container */}
      <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#DAA87C] mb-3" />
            <p className="text-xs font-semibold text-[#1E3A2C]/60">Loading products catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#1E3A2C]/40 mx-auto flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1E3A2C]">No Products Found</h3>
            <p className="text-xs text-[#1E3A2C]/60 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== "All" || selectedStockFilter !== "All"
                ? "Try adjusting your search criteria or category filter."
                : "Your products catalog is empty. Create your first saree product to get started."}
            </p>
            <Link
              href="/dashboard/products/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A2C] text-white text-xs font-semibold hover:bg-[#284f3c] transition-all mt-2"
            >
              <Plus className="w-4 h-4 text-[#DAA87C]" />
              <span>Add First Product</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E3A2C]/5 bg-[#FAF8F5]/80 text-[11px] font-bold text-[#1E3A2C]/60 uppercase tracking-wider">
                  <th className="py-3.5 pl-4 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all shown products"
                      checked={filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(String(p.id)))}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredProducts.map((p) => String(p.id))) : new Set())}
                      className="w-4 h-4 accent-[#1E3A2C] cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category & Collection</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock Level</th>
                  <th className="py-3.5 px-4">Fabric / Color</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A2C]/5 text-xs text-[#1E3A2C]">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-[#FAF8F5]/40 transition-colors group"
                  >
                    <td className="py-3.5 pl-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${product.name}`}
                        checked={selectedIds.has(String(product.id))}
                        onChange={() => toggleSelected(String(product.id))}
                        className="w-4 h-4 accent-[#1E3A2C] cursor-pointer"
                      />
                    </td>
                    {/* Thumbnail & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 rounded-lg overflow-hidden border border-[#1E3A2C]/10 bg-[#FAF8F5] flex-shrink-0">
                          <Image
                            src={product.foldedImg || "/images/no-photo.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#1E3A2C] group-hover:text-[#DAA87C] transition-colors">
                              {product.name}
                            </span>
                            {product.isNewArrival && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#DAA87C]/20 text-[#1E3A2C] border border-[#DAA87C]/30 shadow-2xs">
                                <Sparkles className="w-2.5 h-2.5 text-[#DAA87C]" />
                                New
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-[#1E3A2C]/50 mt-0.5">
                            {product.sku || `ID: ${product.id}`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category & Collection */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FAF8F5] border border-[#1E3A2C]/10 text-[#1E3A2C]/80">
                          {product.category}
                        </span>
                        {product.collection && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#DAA87C]/15 text-[#1E3A2C] border border-[#DAA87C]/30">
                            <Layers className="w-2.5 h-2.5 text-[#DAA87C]" />
                            {product.collection}
                          </span>
                        )}
                        {product.variants && product.variants.length > 0 && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-white text-[#1E3A2C] border border-[#1E3A2C]/15"
                            title={product.variants.map((v) => `${v.name}: ${v.stock}`).join("\n")}
                          >
                            <span className="flex -space-x-1">
                              {product.variants.slice(0, 4).map((v) => (
                                <span
                                  key={v.sku}
                                  className="w-2.5 h-2.5 rounded-full border border-white"
                                  style={{ backgroundColor: v.colorHex || "#1E3A2C" }}
                                />
                              ))}
                            </span>
                            {product.variants.length} {product.variants.length === 1 ? "colour" : "colours"}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-[#1E3A2C]">
                      {product.price || `₹${product.priceValue}`}
                    </td>

                    {/* Stock Adjustment */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {product.variants && product.variants.length > 0 ? (
                          <Link
                            href={`/dashboard/products/edit/${product.id}`}
                            className="px-2.5 py-0.5 text-xs font-bold min-w-[28px] text-center border border-[#1E3A2C]/15 rounded-lg bg-white shadow-2xs hover:bg-[#FAF8F5]"
                            title="Total across colour variants. Edit the product to change each variant's stock."
                          >
                            {product.stock ?? 0}
                          </Link>
                        ) : (
                        <div className="flex items-center border border-[#1E3A2C]/15 rounded-lg bg-white overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(product, -1)}
                            disabled={(product.stock ?? 0) <= 0}
                            className="px-2 py-0.5 text-xs font-bold text-[#1E3A2C]/70 hover:bg-[#FAF8F5] disabled:opacity-30 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-bold min-w-[28px] text-center">
                            {product.stock ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(product, 1)}
                            className="px-2 py-0.5 text-xs font-bold text-[#1E3A2C]/70 hover:bg-[#FAF8F5] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        )}
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            (product.stock ?? 0) > 2
                              ? "bg-emerald-500"
                              : (product.stock ?? 0) > 0
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          title={(product.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
                        />
                      </div>
                    </td>

                    {/* Fabric / Color */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-[#1E3A2C]/80">{product.fabric || "—"}</div>
                      <div className="text-[10px] text-[#1E3A2C]/50">{product.color || ""}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          product.status === "inactive"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            product.status === "inactive" ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        {product.status === "inactive" ? "Hidden" : "In shop"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleNewArrival(product)}
                          title={product.isNewArrival ? "Remove from New Arrivals" : "Mark as New Arrival"}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            product.isNewArrival
                              ? "bg-[#DAA87C]/20 text-[#DAA87C] hover:bg-[#DAA87C]/30"
                              : "text-[#1E3A2C]/40 hover:text-[#DAA87C] hover:bg-[#FAF8F5]"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/products/${product.id}`}
                          target="_blank"
                          title="View on site"
                          className="p-1.5 rounded-lg text-[#1E3A2C]/50 hover:text-[#1E3A2C] hover:bg-[#FAF8F5] transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(product)}
                          title={product.status === "inactive" ? "Show in the shop" : "Hide from the shop"}
                          aria-label={product.status === "inactive" ? `Show ${product.name} in the shop` : `Hide ${product.name} from the shop`}
                          className="p-1.5 rounded-lg text-[#1E3A2C]/50 hover:text-[#1E3A2C] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                        >
                          {product.status === "inactive" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(product)}
                          title="Duplicate (creates a hidden copy to edit)"
                          aria-label={`Duplicate ${product.name}`}
                          className="p-1.5 rounded-lg text-[#1E3A2C]/50 hover:text-[#1E3A2C] hover:bg-[#FAF8F5] transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          href={`/dashboard/products/edit/${product.id}`}
                          title="Edit product"
                          className="p-1.5 rounded-lg text-[#1E3A2C]/70 hover:text-[#DAA87C] hover:bg-[#FAF8F5] transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setDeletingProduct(product)}
                          title="Delete product"
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pages */}
        {filteredCount > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[#1E3A2C]/10 text-xs text-[#1E3A2C]/70">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredCount)} of {filteredCount}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isLoading}
                  className="h-8 px-3 rounded-lg border border-[#1E3A2C]/15 bg-white font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="font-semibold">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isLoading}
                  className="h-8 px-3 rounded-lg border border-[#1E3A2C]/15 bg-white font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk price dialog */}
      {priceDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E3A2C]/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runBulk(
                { action: "price", mode: priceDialog.mode, value: Number(priceDialog.value) },
                priceDialog.mode === "percent" ? "Prices updated on {n} products" : "Price set on {n} products"
              );
            }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-[#1E3A2C]/10 space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-[#1E3A2C]">Change price of {selectedIds.size} product{selectedIds.size === 1 ? "" : "s"}</h3>
              <p className="text-xs text-[#1E3A2C]/60 mt-1">MRPs stay as they are.</p>
            </div>
            <div className="flex gap-2">
              {([["percent", "By percentage"], ["set", "Set a price"]] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPriceDialog({ mode, value: "" })}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    priceDialog.mode === mode ? "bg-[#1E3A2C] text-white border-[#1E3A2C]" : "border-[#1E3A2C]/15 text-[#1E3A2C]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/60">
                {priceDialog.mode === "percent" ? "Change by % (use - to lower, e.g. -10)" : "New selling price (₹)"}
              </span>
              <input
                type="number"
                step={priceDialog.mode === "percent" ? "0.5" : "1"}
                required
                autoFocus
                value={priceDialog.value}
                onChange={(e) => setPriceDialog({ ...priceDialog, value: e.target.value })}
                placeholder={priceDialog.mode === "percent" ? "10" : "1599"}
                className="mt-1 w-full h-10 px-3 bg-[#FAF8F5] border border-[#1E3A2C]/15 rounded-xl text-sm font-bold text-[#1E3A2C] outline-none focus:border-[#DAA87C]"
              />
            </label>
            <p className="text-[11px] text-[#1E3A2C]/50">
              {priceDialog.mode === "percent"
                ? "Colour-specific prices change by the same percentage. Prices are rounded to whole rupees."
                : "Colours that have their own price keep it; edit those in the product."}
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPriceDialog(null)}
                className="px-4 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs font-semibold text-[#1E3A2C]/70 hover:bg-[#FAF8F5] cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={isBulkBusy || !priceDialog.value}
                className="px-4 py-2 rounded-xl bg-[#1E3A2C] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
                Apply
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E3A2C]/40 backdrop-blur-xs">
            <m.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-[#1E3A2C]/10 space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E3A2C]">Delete Product</h3>
                <p className="text-xs text-[#1E3A2C]/60 mt-1">
                  Are you sure you want to delete{" "}
                  <strong className="text-[#1E3A2C] font-semibold">{deletingProduct.name}</strong>?
                  This action cannot be undone.
                </p>
                {deleteError && (
                  <p className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">{deleteError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={closeDeleteDialog}
                  className="px-4 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs font-semibold text-[#1E3A2C]/70 hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>
                {deleteError && deletingProduct.status !== "inactive" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (await handleToggleVisibility(deletingProduct)) closeDeleteDialog();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A2C] text-white text-xs font-bold hover:bg-[#284f3c] cursor-pointer shadow-sm"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide from shop</span>
                  </button>
                ) : deleteError ? null : (
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete</span>
                </button>
                )}
              </div>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
