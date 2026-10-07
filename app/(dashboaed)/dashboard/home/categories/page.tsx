"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderTree,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Check,
  X,
  ChevronRight,
  ImageIcon,
  Search,
  Layers,
  Sparkles,
} from "lucide-react";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  status: "active" | "inactive";
}

const STORAGE_KEY = "thiraala_categories";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    image: string;
    status: "active" | "inactive";
  }>({
    name: "",
    slug: "",
    description: "",
    image: "",
    status: "active",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories from localStorage and API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setCategories(parsed);
          }
        }

        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/products"),
        ]);
        if (catRes.ok) {
          const data = await catRes.json();
          if (Array.isArray(data)) {
            setCategories(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
        }
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (Array.isArray(prodData)) {
            setProducts(prodData);
          }
        }
      } catch (e) {
        console.error("Error loading categories:", e);
      }
    };

    loadCategories();
  }, []);

  const getProductCountForCategory = (catName: string) => {
    return products.filter(
      (p) =>
        p.category?.toLowerCase() === catName.toLowerCase() ||
        (Array.isArray(p.categories) && p.categories.some((c: string) => c.toLowerCase() === catName.toLowerCase()))
    ).length;
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      status: "active",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      status: category.status || "active",
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    // Automatically generate slug if not previously customized
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : autoSlug,
    }));
  };

  const handleSaveCategory = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a category name.");
      return;
    }

    const cleanSlug =
      formData.slug.trim() ||
      formData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    let updated: CategoryItem[];
    if (editingCategory) {
      updated = categories.map((cat) =>
        cat.id === editingCategory.id
          ? {
              ...cat,
              name: formData.name.trim(),
              slug: cleanSlug,
              description: formData.description.trim(),
              image: formData.image.trim(),
              status: formData.status,
            }
          : cat
      );
    } else {
      const newCategory: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: formData.name.trim(),
        slug: cleanSlug,
        description: formData.description.trim(),
        image: formData.image.trim(),
        status: formData.status,
      };
      updated = [...categories, newCategory];
    }

    setCategories(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      window.dispatchEvent(new Event("thiraala-categories-updated"));
    } catch (e) {
      console.error("Error saving categories:", e);
    }

    setIsModalOpen(false);
    showToast(
      editingCategory
        ? `Category "${formData.name}" updated successfully!`
        : `Category "${formData.name}" added successfully!`
    );
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;
    const updated = categories.filter((cat) => cat.id !== id);
    setCategories(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      window.dispatchEvent(new Event("thiraala-categories-updated"));
    } catch (e) {
      console.error("Error deleting category:", e);
    }
    showToast(`Category "${name}" deleted.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#1E3A2C] text-[#FAF8F5] rounded-xl shadow-xl border border-[#DAA87C]/30 text-sm font-medium"
          >
            <div className="w-5 h-5 rounded-full bg-[#DAA87C] text-[#1E3A2C] flex items-center justify-center font-bold">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 border border-[#1E3A2C]/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E3A2C]/50 uppercase tracking-wider mb-2">
            <Link href="/dashboard" className="hover:text-[#1E3A2C] transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#1E3A2C]/30" />
            <Link href="/dashboard/products" className="hover:text-[#1E3A2C] transition-colors">
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#1E3A2C]/30" />
            <span className="text-[#DAA87C] font-bold">Categories</span>
          </div>

          <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight flex items-center gap-2.5">
            <FolderTree className="w-6 h-6 text-[#DAA87C]" />
            <span>Product Categories</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#1E3A2C]/65 mt-1">
            Create, manage, and organize product categories displayed on the website and home category tabs.
          </p>
        </div>

        {/* Top-Right Add Category Button */}
        <div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs sm:text-sm font-semibold hover:bg-[#284f3c] transition-all shadow-md shadow-[#1E3A2C]/15 cursor-pointer border border-[#DAA87C]/30"
          >
            <Plus className="w-4 h-4 text-[#DAA87C]" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Stats & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#1E3A2C]/10">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#1E3A2C]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full pl-9.5 pr-4 py-2 bg-white rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] placeholder:text-[#1E3A2C]/40 focus:outline-none focus:border-[#DAA87C]"
          />
        </div>

        {/* Quick Stats & View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-[#1E3A2C]/10 text-xs font-semibold text-[#1E3A2C]">
            <Layers className="w-3.5 h-3.5 text-[#DAA87C]" />
            <span>Total:</span>
            <span className="font-mono text-[#DAA87C] font-bold">{categories.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-[#1E3A2C]/10 text-xs font-semibold text-[#1E3A2C]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active:</span>
            <span className="font-mono text-emerald-700 font-bold">
              {categories.filter((c) => c.status !== "inactive").length}
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-white rounded-xl border border-[#1E3A2C]/10 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-[#1E3A2C] text-[#FAF8F5] shadow-xs"
                  : "text-[#1E3A2C]/60 hover:text-[#1E3A2C] hover:bg-[#FAF8F5]"
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden md:inline text-[11px]">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-[#1E3A2C] text-[#FAF8F5] shadow-xs"
                  : "text-[#1E3A2C]/60 hover:text-[#1E3A2C] hover:bg-[#FAF8F5]"
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span className="hidden md:inline text-[11px]">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories View (List / Grid) */}
      {filteredCategories.length > 0 ? (
        viewMode === "list" ? (
          <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1E3A2C]/5 bg-[#FAF8F5]/80 text-[11px] font-bold text-[#1E3A2C]/60 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 min-w-[240px]">Category</th>
                    <th className="py-3.5 px-4 min-w-[260px]">Description</th>
                    <th className="py-3.5 px-4 text-center min-w-[100px]">Products</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E3A2C]/5 text-xs text-[#1E3A2C]">
                  {filteredCategories.map((cat, index) => {
                    const prodCount = getProductCountForCategory(cat.name);
                    return (
                      <tr
                        key={cat.id}
                        className="hover:bg-[#FAF8F5]/50 transition-colors group"
                      >
                        {/* Index */}
                        <td className="py-3.5 px-4 text-center font-mono text-[11px] text-[#1E3A2C]/40">
                          {index + 1}
                        </td>

                        {/* Thumbnail + Name + Slug */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-[#1E3A2C]/10 bg-[#FAF8F5] flex-shrink-0 flex items-center justify-center shadow-2xs">
                              {cat.image ? (
                                <Image
                                  src={cat.image}
                                  alt={cat.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  unoptimized
                                />
                              ) : (
                                <FolderTree className="w-5 h-5 text-[#DAA87C]" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-[#1E3A2C] group-hover:text-[#DAA87C] transition-colors">
                                {cat.name}
                              </div>
                              <div className="font-mono text-[11px] text-[#DAA87C] font-semibold mt-0.5">
                                /{cat.slug}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4">
                          <p className="text-xs text-[#1E3A2C]/70 line-clamp-2 leading-relaxed max-w-md">
                            {cat.description || (
                              <span className="text-[#1E3A2C]/30 italic">No description provided</span>
                            )}
                          </p>
                        </td>

                        {/* Products Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF8F5] border border-[#1E3A2C]/10 text-[#1E3A2C]/75">
                            {prodCount} {prodCount === 1 ? "Product" : "Products"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              cat.status === "inactive"
                                ? "bg-neutral-100 text-neutral-600 border border-neutral-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cat.status === "inactive" ? "bg-neutral-400" : "bg-emerald-500"
                              }`}
                            />
                            {cat.status === "inactive" ? "Inactive" : "Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(cat)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#1E3A2C]/15 bg-white text-xs font-semibold text-[#1E3A2C] hover:text-[#DAA87C] hover:border-[#DAA87C]/50 hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
                              title="Edit category"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#DAA87C]" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat, index) => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs overflow-hidden flex flex-col hover:border-[#DAA87C]/40 transition-all group"
              >
                {/* Card Header & Status */}
                <div className="p-3.5 border-b border-[#1E3A2C]/10 flex items-center justify-between bg-[#FAF8F5]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#DAA87C]"></span>
                    <span className="text-[11px] font-mono font-semibold text-[#1E3A2C]/60">
                      #{index + 1}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      cat.status === "inactive"
                        ? "bg-neutral-200 text-neutral-600"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {cat.status === "inactive" ? "Inactive" : "Active"}
                  </span>
                </div>

                {/* Category Image Preview */}
                <div className="relative w-full h-44 bg-[#FAF8F5] overflow-hidden flex items-center justify-center">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1E3A2C] to-[#284f3c] flex flex-col items-center justify-center text-white/50 p-4">
                      <FolderTree className="w-10 h-10 text-[#DAA87C]/70 mb-1" />
                      <span className="text-[11px] text-[#FAF8F5]/60 font-medium">No Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="font-bold text-base tracking-tight leading-tight">{cat.name}</h3>
                    <span className="text-[10px] text-white/80 font-mono">/{cat.slug}</span>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-[#1E3A2C]/70 line-clamp-2 leading-relaxed">
                    {cat.description || "No description provided for this category."}
                  </p>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-[#FAF8F5]/60 border-t border-[#1E3A2C]/10 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#1E3A2C]/15 hover:border-[#1E3A2C]/40 text-xs font-semibold text-[#1E3A2C] transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#DAA87C]" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-[#1E3A2C]/10 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#1E3A2C]/20 mx-auto flex items-center justify-center">
            <FolderTree className="w-8 h-8 text-[#1E3A2C]/30" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#1E3A2C]">
              {searchQuery ? "No Categories Match Your Search" : "No Categories Added Yet"}
            </h3>
            <p className="text-xs text-[#1E3A2C]/60 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? "Try searching with a different term or clear the filter."
                : "Create product categories to organize your saree and fabric collections."}
            </p>
          </div>
          <button
            type="button"
            onClick={searchQuery ? () => setSearchQuery("") : handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#284f3c] transition-all cursor-pointer shadow-sm border border-[#DAA87C]/30"
          >
            {searchQuery ? (
              <span>Clear Search</span>
            ) : (
              <>
                <Plus className="w-4 h-4 text-[#DAA87C]" />
                <span>Add First Category</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ADD / EDIT CATEGORY MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-[#1E3A2C]/50 backdrop-blur-sm"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#1E3A2C]/15 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 bg-[#1E3A2C] text-[#FAF8F5] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FolderTree className="w-4 h-4 text-[#DAA87C]" />
                  <h3 className="font-bold text-base">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-[#FAF8F5]/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {/* Category Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1E3A2C] flex items-center gap-1">
                    <span>Category Name</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Pure Tissue Saree"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E3A2C]/20 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white font-medium"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1E3A2C]">URL Slug / Identifier</label>
                  <div className="flex items-center rounded-xl border border-[#1E3A2C]/20 bg-[#FAF8F5] overflow-hidden">
                    <span className="px-3 py-2 text-xs text-[#1E3A2C]/50 font-mono border-r border-[#1E3A2C]/10">
                      /category/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="pure-tissue-saree"
                      className="flex-1 px-3 py-2 text-xs font-mono text-[#1E3A2C] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1E3A2C]">Brief Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Short description highlighting the fabric, weave, or occasion..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E3A2C]/20 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white resize-none"
                  />
                </div>

                {/* Image Upload & Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1E3A2C]">Category Cover Image</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#1E3A2C] hover:text-[#DAA87C] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#DAA87C]" />
                      <span>Upload Image</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="flex items-center gap-4 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#1E3A2C]/10">
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-neutral-200 border border-[#1E3A2C]/15 flex-shrink-0 flex items-center justify-center">
                      {formData.image ? (
                        <Image
                          src={formData.image}
                          alt="Preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-[#1E3A2C]/30" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                        placeholder="/images/... or upload"
                        className="w-full px-3 py-2 rounded-xl border border-[#1E3A2C]/20 text-xs font-mono text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="pt-2 flex items-center justify-between p-3 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5]">
                  <div>
                    <span className="text-xs font-bold text-[#1E3A2C] block">Category Status</span>
                    <span className="text-[11px] text-[#1E3A2C]/60">
                      Visible in storefront filter & category tabs
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        status: prev.status === "active" ? "inactive" : "active",
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.status === "active"
                        ? "bg-[#1E3A2C] text-[#DAA87C]"
                        : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {formData.status === "active" ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-[#FAF8F5] border-t border-[#1E3A2C]/10 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#1E3A2C]/20 text-xs font-semibold text-[#1E3A2C] hover:bg-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategory}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#284f3c] transition-all cursor-pointer shadow-sm border border-[#DAA87C]/30"
                >
                  <Check className="w-3.5 h-3.5 text-[#DAA87C]" />
                  <span>Save Category</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
