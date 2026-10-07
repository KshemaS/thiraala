"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Check,
  X,
  Search,
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
  FolderTree,
  ImageIcon,
} from "lucide-react";
import { CollectionItem } from "@/app/api/collections/route";
import { ProductItem } from "@/app/api/products/route";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    image: string;
    status: "active" | "inactive";
    featured: boolean;
  }>({
    name: "",
    slug: "",
    description: "",
    image: "",
    status: "active",
    featured: false,
  });

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deletingCollection, setDeletingCollection] = useState<CollectionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch collections and products (for counting assigned products)
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [colRes, prodRes] = await Promise.all([
        fetch("/api/collections"),
        fetch("/api/products"),
      ]);

      if (colRes.ok) {
        const colData = await colRes.json();
        if (Array.isArray(colData)) {
          setCollections(colData);
        }
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (Array.isArray(prodData)) {
          setProducts(prodData);
        }
      }
    } catch (err) {
      console.error("Failed to load collections:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleCollectionsUpdated = () => {
      fetchData();
    };

    window.addEventListener("thiraala-collections-updated", handleCollectionsUpdated);
    return () => {
      window.removeEventListener("thiraala-collections-updated", handleCollectionsUpdated);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCollection(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      status: "active",
      featured: false,
    });
    setShowUrlInput(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (col: CollectionItem) => {
    setEditingCollection(col);
    setFormData({
      name: col.name,
      slug: col.slug,
      description: col.description || "",
      image: col.image || "",
      status: col.status || "active",
      featured: Boolean(col.featured),
    });
    setShowUrlInput(false);
    setIsModalOpen(true);
  };

  // Auto-slug on name change
  const handleNameChange = (name: string) => {
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCollection ? prev.slug : autoSlug,
    }));
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // Save Collection
  const handleSaveCollection = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a collection name.");
      return;
    }

    setIsSubmitting(true);
    const cleanSlug =
      formData.slug.trim() ||
      formData.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const payload = {
      ...formData,
      name: formData.name.trim(),
      slug: cleanSlug,
      description: formData.description.trim(),
      image: formData.image.trim(),
    };

    try {
      let res;
      if (editingCollection) {
        res = await fetch(`/api/collections/${editingCollection.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        await fetchData();
        setIsModalOpen(false);
        showToast(
          editingCollection
            ? `Collection "${formData.name}" updated successfully!`
            : `Collection "${formData.name}" created successfully!`
        );
        window.dispatchEvent(new Event("thiraala-collections-updated"));
      } else {
        alert("Failed to save collection.");
      }
    } catch (err) {
      console.error("Save collection error:", err);
      alert("An error occurred while saving collection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Collection
  const handleConfirmDelete = async () => {
    if (!deletingCollection) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/collections/${deletingCollection.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== deletingCollection.id));
        showToast(`Deleted collection "${deletingCollection.name}"`);
        window.dispatchEvent(new Event("thiraala-collections-updated"));
      } else {
        showToast("Failed to delete collection.");
      }
    } catch (err) {
      console.error("Delete collection error:", err);
      showToast("Error deleting collection.");
    } finally {
      setIsDeleting(false);
      setDeletingCollection(null);
    }
  };

  // Computed metrics
  const metrics = useMemo(() => {
    const total = collections.length;
    const active = collections.filter((c) => c.status === "active").length;
    const featured = collections.filter((c) => c.featured).length;
    return { total, active, featured };
  }, [collections]);

  // Filtered collections
  const filteredCollections = useMemo(() => {
    return collections.filter((col) => {
      const q = searchQuery.toLowerCase();
      return (
        col.name.toLowerCase().includes(q) ||
        col.slug.toLowerCase().includes(q) ||
        (col.description && col.description.toLowerCase().includes(q))
      );
    });
  }, [collections, searchQuery]);

  // Product count lookup by collection name
  const getProductCountForCollection = (colName: string) => {
    return products.filter((p) => p.collection === colName || p.collections?.includes(colName)).length;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
      {/* Toast */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-24 right-8 z-50 px-4 py-3 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold shadow-lg border border-[#DAA87C]/30 flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-[#DAA87C]" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E3A2C]/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A2C]/50 mb-1">
            <Link href="/dashboard" className="hover:text-[#1E3A2C]">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#DAA87C] font-bold">Collections</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight flex items-center gap-3">
            <Layers className="w-6 h-6 text-[#DAA87C]" />
            <span>Collections Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] font-semibold">
              {collections.length} {collections.length === 1 ? "Collection" : "Collections"}
            </span>
          </h1>
          <p className="text-xs text-[#1E3A2C]/60 mt-1">
            Organize and group sarees into curated collections (e.g. Onam Collection, Wedding Kasavu, Cotton Classics).
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-[#1E3A2C]/15 bg-white text-[#1E3A2C] hover:bg-[#FAF8F5] transition-all cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#DAA87C]" : ""}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-bold hover:bg-[#284f3c] transition-all shadow-sm border border-[#DAA87C]/30 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#DAA87C]" />
            <span>Add Collection</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1E3A2C]/60">Total Collections</span>
            <span className="w-8 h-8 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-[#DAA87C]">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#1E3A2C] mt-2">{metrics.total}</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1E3A2C]/60">Active Collections</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Check className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{metrics.active}</div>
        </div>

        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1E3A2C]/60">Featured Collections</span>
            <span className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2">{metrics.featured}</div>
        </div>
      </div>

      {/* Search Bar & View Mode Toggle */}
      <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 flex items-center gap-3">
          <Search className="w-4 h-4 text-[#1E3A2C]/40 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections by title, slug, or theme..."
            className="w-full text-xs text-[#1E3A2C] focus:outline-none bg-transparent font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[#1E3A2C]/40 hover:text-[#1E3A2C]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center self-end sm:self-auto p-1 bg-[#FAF8F5] rounded-xl border border-[#1E3A2C]/10">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-[#1E3A2C] text-[#FAF8F5] shadow-xs"
                : "text-[#1E3A2C]/60 hover:text-[#1E3A2C] hover:bg-white"
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
                : "text-[#1E3A2C]/60 hover:text-[#1E3A2C] hover:bg-white"
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

      {/* Collections Cards Grid */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-[#1E3A2C]/10">
          <Loader2 className="w-8 h-8 animate-spin text-[#DAA87C] mb-3" />
          <p className="text-xs font-semibold text-[#1E3A2C]/60">Loading collections catalog...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-2xl border border-[#1E3A2C]/10">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#1E3A2C]/40 mx-auto flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#1E3A2C]">No Collections Found</h3>
          <p className="text-xs text-[#1E3A2C]/60 max-w-sm mx-auto">
            {searchQuery
              ? "No collections match your search filter."
              : "No collections have been created yet. Add your first collection to group sarees."}
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A2C] text-white text-xs font-semibold hover:bg-[#284f3c] transition-all mt-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#DAA87C]" />
            <span>Add Collection</span>
          </button>
        </div>
      ) : viewMode === "list" ? (
        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E3A2C]/5 bg-[#FAF8F5]/80 text-[11px] font-bold text-[#1E3A2C]/60 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Collection</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Description</th>
                  <th className="py-3.5 px-4 text-center min-w-[120px]">Assigned Sarees</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Featured</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3A2C]/5 text-xs text-[#1E3A2C]">
                {filteredCollections.map((col, index) => {
                  const assignedCount = getProductCountForCollection(col.name);
                  return (
                    <tr
                      key={col.id}
                      className="hover:bg-[#FAF8F5]/50 transition-colors group"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-[#1E3A2C]/40">
                        {index + 1}
                      </td>

                      {/* Cover + Name + Slug */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#1E3A2C]/10 bg-[#FAF8F5] flex-shrink-0 flex items-center justify-center shadow-2xs">
                            {col.image ? (
                              <Image
                                src={col.image}
                                alt={col.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-[#DAA87C]" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[#1E3A2C] group-hover:text-[#DAA87C] transition-colors">
                              {col.name}
                            </div>
                            <div className="font-mono text-[11px] text-[#DAA87C] font-semibold mt-0.5">
                              /collections/{col.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-[#1E3A2C]/70 line-clamp-2 leading-relaxed max-w-md">
                          {col.description || (
                            <span className="text-[#1E3A2C]/30 italic">No description provided</span>
                          )}
                        </p>
                      </td>

                      {/* Assigned Sarees */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FAF8F5] border border-[#1E3A2C]/10 text-[#1E3A2C]/80">
                          {assignedCount} {assignedCount === 1 ? "Saree" : "Sarees"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            col.status === "active"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              col.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          {col.status === "active" ? "Active" : "Draft"}
                        </span>
                      </td>

                      {/* Featured */}
                      <td className="py-3.5 px-4">
                        {col.featured ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#DAA87C]/20 text-[#1E3A2C] border border-[#DAA87C]/40">
                            <Sparkles className="w-3 h-3 text-[#DAA87C]" />
                            Featured
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#1E3A2C]/30 font-medium">Standard</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(col)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#1E3A2C]/15 bg-white text-xs font-semibold text-[#1E3A2C] hover:text-[#DAA87C] hover:border-[#DAA87C]/50 hover:bg-[#FAF8F5] transition-all cursor-pointer shadow-2xs"
                            title="Edit collection"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#DAA87C]" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCollection(col)}
                            className="p-1.5 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete collection"
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
          {filteredCollections.map((col) => {
            const assignedCount = getProductCountForCollection(col.name);
            return (
              <div
                key={col.id}
                className="bg-white rounded-2xl border border-[#1E3A2C]/10 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image / Header Thumbnail */}
                  <div className="relative h-40 w-full bg-[#FAF8F5] overflow-hidden border-b border-[#1E3A2C]/5">
                    {col.image ? (
                      <Image
                        src={col.image}
                        alt={col.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#1E3A2C]/30">
                        <ImageIcon className="w-8 h-8 mb-1.5" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider">No Cover Image</span>
                      </div>
                    )}

                    {/* Badges Over Image */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md shadow-xs ${
                          col.status === "active"
                            ? "bg-emerald-900/80 text-emerald-100 border border-emerald-400/30"
                            : "bg-amber-900/80 text-amber-100 border border-amber-400/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            col.status === "active" ? "bg-emerald-400" : "bg-amber-400"
                          }`}
                        />
                        {col.status === "active" ? "Active" : "Draft"}
                      </span>

                      {col.featured && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#1E3A2C]/80 text-[#DAA87C] border border-[#DAA87C]/30 backdrop-blur-md shadow-xs">
                          <Sparkles className="w-3 h-3 text-[#DAA87C]" />
                          Featured
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-[#1E3A2C] group-hover:text-[#DAA87C] transition-colors">
                        {col.name}
                      </h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#FAF8F5] text-[#1E3A2C]/70 border border-[#1E3A2C]/10 flex-shrink-0">
                        {assignedCount} {assignedCount === 1 ? "Saree" : "Sarees"}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] text-[#DAA87C] font-semibold">
                      /collections/{col.slug}
                    </div>

                    {col.description && (
                      <p className="text-xs text-[#1E3A2C]/65 line-clamp-2 leading-relaxed">
                        {col.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 border-t border-[#1E3A2C]/5 bg-[#FAF8F5]/30 flex items-center justify-between">
                  <span className="text-[10px] text-[#1E3A2C]/50 font-medium">
                    ID: {col.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(col)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#1E3A2C]/15 bg-white text-xs font-semibold text-[#1E3A2C] hover:text-[#DAA87C] hover:border-[#DAA87C]/50 transition-all cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingCollection(col)}
                      className="p-1.5 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Delete collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Collection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E3A2C]/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#1E3A2C]/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[#1E3A2C]/10 flex items-center justify-between bg-[#FAF8F5]/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#1E3A2C]/10 flex items-center justify-center text-[#DAA87C]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1E3A2C]">
                      {editingCollection ? "Edit Collection" : "Create New Collection"}
                    </h3>
                    <p className="text-[11px] text-[#1E3A2C]/50">
                      Configure collection metadata, slug, and cover photo
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-[#1E3A2C]/40 hover:text-[#1E3A2C] hover:bg-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {/* Collection Name */}
                <div>
                  <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">
                    Collection Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Onam Collection 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white font-medium"
                    required
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">
                    URL Identifier / Slug
                  </label>
                  <div className="flex items-center rounded-xl border border-[#1E3A2C]/15 bg-[#FAF8F5] overflow-hidden">
                    <span className="px-3 py-2 text-xs text-[#1E3A2C]/50 font-mono border-r border-[#1E3A2C]/10">
                      /collections/
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="onam-collection-2026"
                      className="flex-1 px-3 py-2 text-xs font-mono text-[#1E3A2C] focus:outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-[#1E3A2C] mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the occasion, weave inspirations, or seasonal theme..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white resize-none"
                  />
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#1E3A2C]">
                      Collection Cover Image
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] text-[#DAA87C] hover:underline font-semibold cursor-pointer"
                    >
                      {showUrlInput ? "Hide URL" : "Or enter URL"}
                    </button>
                  </div>

                  {formData.image ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5]/60">
                      <div className="relative w-16 h-14 rounded-lg overflow-hidden border border-[#1E3A2C]/15 bg-white flex-shrink-0">
                        <Image src={formData.image} alt="Cover" fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold text-[#1E3A2C] block">Cover Image Attached</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-[#DAA87C] hover:underline font-semibold cursor-pointer"
                        >
                          Change image
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: "" })}
                        className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="block w-full text-xs text-[#1E3A2C]/70 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#1E3A2C] file:text-[#FAF8F5] hover:file:bg-[#284f3c] file:cursor-pointer cursor-pointer border border-[#1E3A2C]/15 rounded-xl p-2 bg-[#FAF8F5]/30 focus:outline-none"
                      />
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {showUrlInput && (
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="/images/folded-gopuram.jpeg or https://..."
                      className="w-full px-3 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] font-mono bg-white"
                    />
                  )}
                </div>

                {/* Status & Featured Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5]/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1E3A2C] block">Active Status</span>
                      <span className="text-[10px] text-[#1E3A2C]/50">Show in storefront</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.status === "active"}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          status: formData.status === "active" ? "inactive" : "active",
                        })
                      }
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        formData.status === "active" ? "bg-[#1E3A2C]" : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ${
                          formData.status === "active" ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5]/50 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1E3A2C] block">Featured</span>
                      <span className="text-[10px] text-[#1E3A2C]/50">Highlight on home</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.featured}
                      onClick={() => setFormData({ ...formData, featured: !formData.featured })}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        formData.featured ? "bg-[#DAA87C]" : "bg-neutral-300"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ${
                          formData.featured ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-[#1E3A2C]/10 bg-[#FAF8F5]/80 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs font-semibold text-[#1E3A2C]/70 hover:bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveCollection}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-bold hover:bg-[#284f3c] transition-all cursor-pointer shadow-sm border border-[#DAA87C]/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#DAA87C]" />
                  ) : (
                    <Check className="w-4 h-4 text-[#DAA87C]" />
                  )}
                  <span>{editingCollection ? "Update Collection" : "Save Collection"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingCollection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E3A2C]/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-[#1E3A2C]/10 space-y-4"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E3A2C]">Delete Collection</h3>
                <p className="text-xs text-[#1E3A2C]/60 mt-1">
                  Are you sure you want to delete the collection{" "}
                  <strong className="text-[#1E3A2C] font-semibold">{deletingCollection.name}</strong>?
                  Products mapped to this collection will remain intact.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingCollection(null)}
                  className="px-4 py-2 rounded-xl border border-[#1E3A2C]/15 text-xs font-semibold text-[#1E3A2C]/70 hover:bg-[#FAF8F5] cursor-pointer"
                >
                  Cancel
                </button>
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
