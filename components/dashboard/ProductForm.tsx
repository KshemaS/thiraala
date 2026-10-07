"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Upload,
  Check,
  X,
  Sparkles,
  Layers,
  Tag,
  DollarSign,
  Package,
  AlertCircle,
  Loader2,
  Trash2,
  ImageIcon,
  Star,
  Ruler,
  Percent,
} from "lucide-react";
import { ProductItem } from "@/app/api/products/route";

interface CategoryOption {
  id?: string;
  name: string;
  slug?: string;
}

interface CollectionOption {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  status?: string;
}

const DEFAULT_CATEGORIES = [
  "Tissue Set Saree",
  "Cotton Set Saree",
  "Mul Mul Cotton",
  "Mul Chanderi",
  "Cotton Saree",
  "Cotton Set Mund",
  "Kasavu Saree",
];

interface ProductFormProps {
  initialData?: ProductItem | null;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [collectionsList, setCollectionsList] = useState<CollectionOption[]>([]);

  const [formData, setFormData] = useState<{
    name: string;
    subtitle: string;
    sku: string;
    slug: string;
    price: string;
    priceValue: number;
    mrp: number | "";
    rating: number;
    ratingCount: number;
    category: string;
    collection: string;
    stock: number;
    fabric: string;
    sareeFabric: string;
    color: string;
    selectedColor: string;
    pattern: string;
    border: string;
    blouse: string;
    occasion: string;
    sareeLength: string;
    blouseLength: string;
    careInstructions: string;
    highlights: string;
    description: string;
    foldedImg: string;
    wornImg: string;
    status: "active" | "inactive";
    isNewArrival: boolean;
  }>({
    name: initialData?.name || "",
    subtitle: (initialData as any)?.subtitle || "",
    sku: initialData?.sku || "",
    slug: initialData?.slug || "",
    price: initialData?.price || "",
    priceValue: initialData?.priceValue || 0,
    mrp: (initialData as any)?.mrp !== undefined && (initialData as any)?.mrp !== null ? Number((initialData as any).mrp) : "",
    rating: (initialData as any)?.rating !== undefined ? Number((initialData as any).rating) : 4.8,
    ratingCount: (initialData as any)?.ratingCount !== undefined ? Number((initialData as any).ratingCount) : 85,
    category: initialData?.category || DEFAULT_CATEGORIES[0],
    collection: initialData?.collection || (initialData?.collections && initialData.collections[0]) || "",
    stock: initialData?.stock !== undefined ? initialData.stock : 10,
    fabric: initialData?.fabric || "",
    sareeFabric: (initialData as any)?.sareeFabric || "",
    color: initialData?.color || "",
    selectedColor: (initialData as any)?.selectedColor || initialData?.color || "",
    pattern: initialData?.pattern || "",
    border: (initialData as any)?.border || "",
    blouse: (initialData as any)?.blouse || "",
    occasion: (initialData as any)?.occasion || "",
    sareeLength: (initialData as any)?.sareeLength || "5.5 metres",
    blouseLength: (initialData as any)?.blouseLength || "0.8 metres",
    careInstructions: (initialData as any)?.careInstructions || "",
    highlights: Array.isArray((initialData as any)?.highlights)
      ? (initialData as any).highlights.join("\n")
      : ((initialData as any)?.highlights as string) || "",
    description: initialData?.description || "",
    foldedImg: initialData?.foldedImg || "",
    wornImg: initialData?.wornImg || "",
    status: initialData?.status || "active",
    isNewArrival: Boolean(initialData?.isNewArrival),
  });

  const [showFoldedUrl, setShowFoldedUrl] = useState(false);
  const [showWornUrl, setShowWornUrl] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load categories and collections from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const apiCatNames = data.map((c: CategoryOption) => c.name.trim()).filter(Boolean);
            const combined = Array.from(new Set([...apiCatNames, ...DEFAULT_CATEGORIES]));
            setCategories(combined);

            if (!initialData?.category && combined.length > 0) {
              setFormData((prev) => ({ ...prev, category: combined[0] }));
            }
          }
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };

    const fetchCollections = async () => {
      try {
        const res = await fetch("/api/collections");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCollectionsList(data);
          }
        }
      } catch (err) {
        console.error("Error loading collections:", err);
      }
    };

    fetchCategories();
    fetchCollections();

    const handleCollectionsUpdated = () => fetchCollections();
    if (typeof window !== "undefined") {
      window.addEventListener("thiraala-collections-updated", handleCollectionsUpdated);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("thiraala-collections-updated", handleCollectionsUpdated);
      }
    };
  }, [initialData]);

  // Handle product name change and auto-generate slug
  const handleNameChange = (name: string) => {
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEdit ? prev.slug : autoSlug,
    }));
  };

  // Generate SKU helper
  const handleGenerateSKU = () => {
    const prefix = "SAR";
    const catCode = (formData.category || "GEN")
      .split(" ")
      .map((w) => w[0]?.toUpperCase())
      .join("")
      .slice(0, 3);
    const randNum = Math.floor(100 + Math.random() * 900);
    const generated = `${prefix}_${catCode}_${randNum}`;
    setFormData((prev) => ({ ...prev, sku: generated }));
  };

  // Handle price input
  const handlePriceChange = (val: string) => {
    const numeric = parseInt(val.replace(/[^0-9]/g, ""), 10) || 0;
    const formatted = numeric > 0 ? `₹${numeric.toLocaleString("en-IN")}` : "";
    setFormData((prev) => ({
      ...prev,
      price: formatted,
      priceValue: numeric,
    }));
  };

  // Handle MRP input
  const handleMrpChange = (val: string) => {
    const numeric = parseInt(val.replace(/[^0-9]/g, ""), 10) || 0;
    setFormData((prev) => ({
      ...prev,
      mrp: numeric > 0 ? numeric : "",
    }));
  };

  const currentMrp = typeof formData.mrp === "number" ? formData.mrp : 0;
  const discountPercent =
    currentMrp > formData.priceValue && formData.priceValue > 0
      ? Math.round(((currentMrp - formData.priceValue) / currentMrp) * 100)
      : 0;

  // Handle file uploads to Base64
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "folded" | "worn"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (target === "folded") {
        setFormData((prev) => ({ ...prev, foldedImg: result }));
      } else {
        setFormData((prev) => ({ ...prev, wornImg: result }));
      }
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.name.trim()) {
      setErrorMessage("Please enter a product name.");
      return;
    }

    const selectedCategory = isCustomCategory
      ? customCategoryName.trim()
      : formData.category;

    if (!selectedCategory) {
      setErrorMessage("Please select or enter a category for this product.");
      return;
    }

    if (!formData.priceValue || formData.priceValue <= 0) {
      setErrorMessage("Please enter a valid price greater than ₹0.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      mrp: typeof formData.mrp === "number" && formData.mrp > 0 ? formData.mrp : undefined,
      rating: Number(formData.rating) > 0 ? Number(formData.rating) : 4.8,
      ratingCount: Number(formData.ratingCount) >= 0 ? Number(formData.ratingCount) : 85,
      highlights: formData.highlights
        ? formData.highlights
            .split("\n")
            .map((l) => l.trim().replace(/^[•\-\*]\s*/, ""))
            .filter(Boolean)
        : [],
      category: selectedCategory,
      collection: formData.collection.trim(),
      collections: formData.collection.trim() ? [formData.collection.trim()] : [],
      foldedImg: formData.foldedImg.trim(),
      wornImg: formData.wornImg.trim(),
      stock: Number(formData.stock) >= 0 ? Number(formData.stock) : 0,
    };

    try {
      let response;
      if (isEdit && initialData?.id) {
        response = await fetch(`/api/products/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save product.");
      }

      setSuccessMessage(
        isEdit
          ? `Product "${formData.name}" updated successfully!`
          : `Product "${formData.name}" created successfully!`
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("thiraala-products-updated"));
      }

      setTimeout(() => {
        router.push("/dashboard/products");
      }, 1000);
    } catch (err: any) {
      console.error("Save product error:", err);
      setErrorMessage(err.message || "An unexpected error occurred while saving.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl pb-16">
      {/* Notifications */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-xs font-semibold"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-400 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs font-semibold"
        >
          <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Details & Pricing */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Basic Information */}
          <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#1E3A2C]/5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#1E3A2C]/10 flex items-center justify-center text-[#DAA87C]">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E3A2C]">Product Identity</h3>
                <p className="text-[11px] text-[#1E3A2C]/50">Primary details, SKU, and category classification</p>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Kasavu Golden Tissue Saree"
                className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] focus:ring-1 focus:ring-[#DAA87C] bg-[#FAF8F5]/30 transition-all font-medium"
                required
              />
            </div>

            {/* Product Subtitle / Tagline */}
            <div>
              <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">
                Product Subtitle / Tagline
              </label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. Painted Lily Motif Kerala Cotton Saree with Blouse Piece"
                className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30 transition-all font-medium"
              />
              <p className="text-[10px] text-[#1E3A2C]/50 mt-1">
                Displayed directly beneath the product title on the product detail page.
              </p>
            </div>

            {/* SKU & Slug Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#1E3A2C]">SKU Code</label>
                  <button
                    type="button"
                    onClick={handleGenerateSKU}
                    className="text-[10px] text-[#DAA87C] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-gen
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  placeholder="e.g. SAR_TIS_01"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs font-mono text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">URL Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. kasavu-golden-tissue-saree"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C]/70 focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>
            </div>

            {/* Category Selection Section */}
            <div className="pt-2 border-t border-[#1E3A2C]/5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#1E3A2C]">
                  Select Category <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(!isCustomCategory)}
                  className="text-[11px] text-[#DAA87C] hover:underline font-semibold cursor-pointer"
                >
                  {isCustomCategory ? "← Pick from List" : "+ Add Custom Category"}
                </button>
              </div>

              {!isCustomCategory ? (
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs font-semibold text-[#1E3A2C] bg-[#FAF8F5]/50 focus:outline-none focus:border-[#DAA87C] focus:ring-1 focus:ring-[#DAA87C] appearance-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#1E3A2C]/40">
                    <Tag className="w-3.5 h-3.5" />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="Type new category name..."
                  className="w-full px-4 py-2.5 rounded-xl border border-[#DAA87C] text-xs font-semibold text-[#1E3A2C] bg-white focus:outline-none focus:ring-1 focus:ring-[#DAA87C]"
                />
              )}
              <p className="text-[10px] text-[#1E3A2C]/50 mt-1.5 flex items-center gap-1">
                <span>Categories manage storefront grouping and filter tabs.</span>
                <Link
                  href="/dashboard/categories"
                  className="text-[#DAA87C] hover:underline ml-1 font-semibold"
                  target="_blank"
                >
                  Manage Categories →
                </Link>
              </p>
            </div>

            {/* Curated Collection Selection Section */}
            <div className="pt-4 border-t border-[#1E3A2C]/5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#1E3A2C] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#DAA87C]" />
                  <span>Assign to Curated Collection</span>
                  <span className="text-[11px] font-normal text-[#1E3A2C]/50">(Optional)</span>
                </label>
                <Link
                  href="/dashboard/collections"
                  className="text-[11px] text-[#DAA87C] hover:underline font-semibold flex items-center gap-1"
                  target="_blank"
                >
                  <span>+ Manage Collections</span>
                </Link>
              </div>

              <div className="relative">
                <select
                  value={formData.collection}
                  onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs font-semibold text-[#1E3A2C] bg-[#FAF8F5]/50 focus:outline-none focus:border-[#DAA87C] focus:ring-1 focus:ring-[#DAA87C] appearance-none cursor-pointer"
                >
                  <option value="">-- None (Standard Catalog Only) --</option>
                  {collectionsList.map((col) => (
                    <option key={col.id || col.name} value={col.name}>
                      {col.name} {col.status === "inactive" ? "(Inactive)" : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#1E3A2C]/40">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className="text-[10px] text-[#1E3A2C]/50 mt-1.5">
                Assign this saree to seasonal drops or themed edits (e.g. Onam Collection, Wedding & Bridal Kasavu).
              </p>
            </div>
          </div>

          {/* Card: Pricing & Stock Inventory */}
          <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#1E3A2C]/5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#1E3A2C]/10 flex items-center justify-center text-[#DAA87C]">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E3A2C]">Pricing, Discounts & Ratings</h3>
                <p className="text-[11px] text-[#1E3A2C]/50">Sale price, original MRP, discount tag, and social proof</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selling Price */}
              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">
                  Selling Price (₹ INR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1E3A2C]/40">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.priceValue || ""}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="1499"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs font-bold text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                    required
                  />
                </div>
                <p className="text-[10px] text-[#1E3A2C]/50 mt-1">Formatted: {formData.price || "₹0"}</p>
              </div>

              {/* MRP (Original Price) */}
              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">
                  MRP / Strikethrough Price (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#1E3A2C]/40">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.mrp || ""}
                    onChange={(e) => handleMrpChange(e.target.value)}
                    placeholder="4997"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs font-bold text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {discountPercent > 0 ? (
                    <span className="text-[10px] font-bold text-[#b45309] bg-[#b45309]/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Percent className="w-2.5 h-2.5" />
                      {discountPercent}% OFF (Auto calculated)
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#1E3A2C]/40">Set higher than selling price to display discount</span>
                  )}
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">
                  Stock Units Available
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs font-bold text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      formData.stock > 2 ? "bg-emerald-500" : formData.stock > 0 ? "bg-amber-500" : "bg-rose-500"
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-[#1E3A2C]/60">
                    {formData.stock > 2 ? "In Stock" : formData.stock > 0 ? "Low Stock" : "Out of Stock"}
                  </span>
                </div>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5 flex items-center gap-1">
                    <Star className="w-3 h-3 text-[#DAA87C]" />
                    <span>Rating (1-5)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 4.8 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs font-bold text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">
                    Ratings Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.ratingCount}
                    onChange={(e) => setFormData({ ...formData, ratingCount: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs font-bold text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Textile Specifications */}
          <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#1E3A2C]/5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#1E3A2C]/10 flex items-center justify-center text-[#DAA87C]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E3A2C]">Textile & Craft Specifications</h3>
                <p className="text-[11px] text-[#1E3A2C]/50">Fabric material, color tones, pattern and weave description</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Fabric</label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  placeholder="e.g. Cotton"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Saree Fabric</label>
                <input
                  type="text"
                  value={formData.sareeFabric}
                  onChange={(e) => setFormData({ ...formData, sareeFabric: e.target.value })}
                  placeholder="e.g. Kerala Cotton"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Color / Selected Shade</label>
                <input
                  type="text"
                  value={formData.selectedColor || formData.color}
                  onChange={(e) => setFormData({ ...formData, selectedColor: e.target.value, color: e.target.value })}
                  placeholder="e.g. Wine Lily"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Print or Pattern</label>
                <input
                  type="text"
                  value={formData.pattern}
                  onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                  placeholder="e.g. Floral"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Border</label>
                <input
                  type="text"
                  value={formData.border}
                  onChange={(e) => setFormData({ ...formData, border: e.target.value })}
                  placeholder="e.g. Solid or Contrast wine border"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Blouse Type</label>
                <input
                  type="text"
                  value={formData.blouse}
                  onChange={(e) => setFormData({ ...formData, blouse: e.target.value })}
                  placeholder="e.g. Running blouse"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Occasion</label>
                <input
                  type="text"
                  value={formData.occasion}
                  onChange={(e) => setFormData({ ...formData, occasion: e.target.value })}
                  placeholder="e.g. Festive, Wedding, Daily Wear"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Full Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="An off-white Kerala cotton saree with deep wine lilies painted across the pallu and pleats..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30 resize-y"
              />
            </div>

            {/* Key Features / Highlights */}
            <div>
              <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5 flex items-center justify-between">
                <span>Key Features / Highlights (Bullet points)</span>
                <span className="text-[10px] text-[#1E3A2C]/50 font-normal">One point per line</span>
              </label>
              <textarea
                rows={3}
                value={formData.highlights}
                onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                placeholder={"Off-white saree with painted lily motifs\nContrast wine border on both edges\nComes with a matching blouse piece"}
                className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30 resize-y font-mono"
              />
            </div>
          </div>

          {/* Card: Dimensions & Garment Care */}
          <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#1E3A2C]/5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#1E3A2C]/10 flex items-center justify-center text-[#DAA87C]">
                <Ruler className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E3A2C]">Size, Fit & Care Instructions</h3>
                <p className="text-[11px] text-[#1E3A2C]/50">Saree length, blouse piece length, and fabric maintenance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Saree Length</label>
                <input
                  type="text"
                  value={formData.sareeLength}
                  onChange={(e) => setFormData({ ...formData, sareeLength: e.target.value })}
                  placeholder="e.g. 5.5 metres"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Blouse Piece Length</label>
                <input
                  type="text"
                  value={formData.blouseLength}
                  onChange={(e) => setFormData({ ...formData, blouseLength: e.target.value })}
                  placeholder="e.g. 0.8 metres"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">Care Instructions</label>
                <input
                  type="text"
                  value={formData.careInstructions}
                  onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
                  placeholder="e.g. Care: Dry clean recommended or gentle hand wash in cold water"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-[#FAF8F5]/30"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Media & Publication */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Folded Saree Photo (Primary) */}
          <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A2C]/5">
              <div>
                <h3 className="text-sm font-bold text-[#1E3A2C]">Folded Saree (Primary Photo)</h3>
                <p className="text-[11px] text-[#1E3A2C]/50">Product catalog flat-lay image</p>
              </div>
              <span className="text-[10px] font-bold text-[#DAA87C] bg-[#DAA87C]/15 px-2 py-0.5 rounded-full">
                Flat-lay
              </span>
            </div>

            {/* Show already added image on edit (or if an image has been selected) */}
            {formData.foldedImg ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5]/60">
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-[#1E3A2C]/15 bg-white flex-shrink-0 shadow-2xs">
                    <Image
                      src={formData.foldedImg}
                      alt="Folded Saree"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[11px] font-bold text-[#1E3A2C] block">
                      {isEdit && initialData?.foldedImg === formData.foldedImg
                        ? "Currently Added Image"
                        : "Selected Image"}
                    </span>
                    <p className="text-[10px] text-[#1E3A2C]/50 truncate">
                      {formData.foldedImg.startsWith("data:")
                        ? "Uploaded from device"
                        : formData.foldedImg}
                    </p>
                    <div className="pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1E3A2C]/5 hover:bg-[#1E3A2C]/10 text-[11px] font-semibold text-[#1E3A2C] cursor-pointer transition-colors">
                        <Upload className="w-3 h-3 text-[#DAA87C]" />
                        <span>Change Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "folded")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, foldedImg: "" }))}
                    className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Simple upload input on create or when no image is selected */
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "folded")}
                  className="block w-full text-xs text-[#1E3A2C]/70 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1E3A2C] file:text-[#FAF8F5] hover:file:bg-[#284f3c] file:cursor-pointer cursor-pointer border border-[#1E3A2C]/15 rounded-xl p-2 bg-[#FAF8F5]/30 focus:outline-none focus:border-[#DAA87C] transition-colors"
                />
                <div className="flex items-center justify-between text-[10px] text-[#1E3A2C]/50 px-1">
                  <span>PNG, JPG, WEBP up to 5MB</span>
                  <button
                    type="button"
                    onClick={() => setShowFoldedUrl(!showFoldedUrl)}
                    className="text-[#DAA87C] hover:underline font-semibold cursor-pointer"
                  >
                    {showFoldedUrl ? "Hide URL" : "Or enter URL"}
                  </button>
                </div>
                {showFoldedUrl && (
                  <input
                    type="text"
                    value={formData.foldedImg}
                    onChange={(e) => setFormData((prev) => ({ ...prev, foldedImg: e.target.value }))}
                    placeholder="/images/example.jpeg or https://..."
                    className="w-full px-3 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white font-mono"
                  />
                )}
              </div>
            )}
          </div>

          {/* Card 2: Model Draped Photo (Secondary) */}
          <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3A2C]/5">
              <div>
                <h3 className="text-sm font-bold text-[#1E3A2C]">Model Draped (Worn Photo)</h3>
                <p className="text-[11px] text-[#1E3A2C]/50">Product page model drape view</p>
              </div>
              <span className="text-[10px] font-bold text-[#1E3A2C]/70 bg-[#1E3A2C]/5 px-2 py-0.5 rounded-full">
                Model View
              </span>
            </div>

            {/* Show already added image on edit (or if an image has been selected) */}
            {formData.wornImg ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5]/60">
                  <div className="relative w-16 h-20 rounded-lg overflow-hidden border border-[#1E3A2C]/15 bg-white flex-shrink-0 shadow-2xs">
                    <Image
                      src={formData.wornImg}
                      alt="Model Saree"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[11px] font-bold text-[#1E3A2C] block">
                      {isEdit && initialData?.wornImg === formData.wornImg
                        ? "Currently Added Image"
                        : "Selected Image"}
                    </span>
                    <p className="text-[10px] text-[#1E3A2C]/50 truncate">
                      {formData.wornImg.startsWith("data:")
                        ? "Uploaded from device"
                        : formData.wornImg}
                    </p>
                    <div className="pt-1">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1E3A2C]/5 hover:bg-[#1E3A2C]/10 text-[11px] font-semibold text-[#1E3A2C] cursor-pointer transition-colors">
                        <Upload className="w-3 h-3 text-[#DAA87C]" />
                        <span>Change Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, "worn")}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, wornImg: "" }))}
                    className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Simple upload input on create or when no image is selected */
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "worn")}
                  className="block w-full text-xs text-[#1E3A2C]/70 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1E3A2C] file:text-[#FAF8F5] hover:file:bg-[#284f3c] file:cursor-pointer cursor-pointer border border-[#1E3A2C]/15 rounded-xl p-2 bg-[#FAF8F5]/30 focus:outline-none focus:border-[#DAA87C] transition-colors"
                />
                <div className="flex items-center justify-between text-[10px] text-[#1E3A2C]/50 px-1">
                  <span>PNG, JPG, WEBP up to 5MB</span>
                  <button
                    type="button"
                    onClick={() => setShowWornUrl(!showWornUrl)}
                    className="text-[#DAA87C] hover:underline font-semibold cursor-pointer"
                  >
                    {showWornUrl ? "Hide URL" : "Or enter URL"}
                  </button>
                </div>
                {showWornUrl && (
                  <input
                    type="text"
                    value={formData.wornImg}
                    onChange={(e) => setFormData((prev) => ({ ...prev, wornImg: e.target.value }))}
                    placeholder="/images/example.jpeg or https://..."
                    className="w-full px-3 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white font-mono"
                  />
                )}
              </div>
            )}
          </div>

          {/* Card: Publishing & Visibility */}
          <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1E3A2C]">Publishing Status</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "active" })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  formData.status === "active"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                    : "border-[#1E3A2C]/10 text-[#1E3A2C]/60 hover:bg-[#FAF8F5]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active (Published)
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: "inactive" })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  formData.status === "inactive"
                    ? "bg-amber-50 border-amber-300 text-amber-800 shadow-xs"
                    : "border-[#1E3A2C]/10 text-[#1E3A2C]/60 hover:bg-[#FAF8F5]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Draft (Hidden)
              </button>
            </div>

            {/* New Arrival Toggle Switch */}
            <div className="pt-2 border-t border-[#1E3A2C]/10">
              <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition-colors">
                <div className="space-y-0.5 flex-1 pr-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#DAA87C]" />
                    <span className="text-xs font-bold text-[#1E3A2C]">New Arrival</span>
                    {formData.isNewArrival && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#DAA87C]/20 text-[#1E3A2C] border border-[#DAA87C]/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#1E3A2C]/60">
                    Mark this saree as a New Arrival on the storefront
                  </p>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={formData.isNewArrival}
                  onClick={() => setFormData((prev) => ({ ...prev, isNewArrival: !prev.isNewArrival }))}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.isNewArrival ? "bg-[#1E3A2C]" : "bg-neutral-300"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.isNewArrival ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-[#1E3A2C]/5 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-bold hover:bg-[#284f3c] transition-all shadow-sm border border-[#DAA87C]/30 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#DAA87C]" />
                    <span>Saving Product...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#DAA87C]" />
                    <span>{isEdit ? "Update Product" : "Save & Publish Saree"}</span>
                  </>
                )}
              </button>

              <Link
                href="/dashboard/products"
                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl text-xs font-semibold text-[#1E3A2C]/70 hover:text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-all text-center"
              >
                Cancel & Return to Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
