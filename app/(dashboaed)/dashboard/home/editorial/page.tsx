"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Check,
  X,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

export interface EditorialPhoto {
  id: string;
  url: string;
  title: string;
}

const STORAGE_KEY = "thiraala_editorial_photos";

export default function EditorialPage() {
  const [photos, setPhotos] = useState<EditorialPhoto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<EditorialPhoto | null>(null);
  const [formData, setFormData] = useState<{ url: string; title: string }>({
    url: "",
    title: "",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos from localStorage and API
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setPhotos(parsed);
          }
        }

        const res = await fetch("/api/editorial");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setPhotos(data);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          }
        }
      } catch (e) {
        console.error("Error loading editorial photos:", e);
      }
    };

    loadPhotos();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenAdd = () => {
    setEditingPhoto(null);
    setFormData({ url: "", title: `Editorial Shoot ${photos.length + 1}` });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (photo: EditorialPhoto) => {
    setEditingPhoto(photo);
    setFormData({ url: photo.url, title: photo.title || "" });
    setIsModalOpen(true);
  };

  const handleSavePhoto = async () => {
    if (!formData.url.trim()) {
      alert("Please choose or upload an image first.");
      return;
    }

    let updated: EditorialPhoto[];
    if (editingPhoto) {
      updated = photos.map((p) =>
        p.id === editingPhoto.id
          ? { ...p, url: formData.url, title: formData.title || p.title }
          : p
      );
    } else {
      const newPhoto: EditorialPhoto = {
        id: `editorial-${Date.now()}`,
        url: formData.url,
        title: formData.title || `Editorial Shoot ${photos.length + 1}`,
      };
      updated = [...photos, newPhoto];
    }

    setPhotos(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await fetch("/api/editorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      window.dispatchEvent(new Event("thiraala-editorial-updated"));
    } catch (e) {
      console.error("Error saving editorial photos:", e);
    }

    setIsModalOpen(false);
    showToast(editingPhoto ? "Photo updated successfully!" : "Photo added successfully!");
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Are you sure you want to delete this editorial photo?")) return;
    const updated = photos.filter((p) => p.id !== id);
    setPhotos(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      await fetch("/api/editorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      window.dispatchEvent(new Event("thiraala-editorial-updated"));
    } catch (e) {
      console.error("Error deleting editorial photo:", e);
    }
    showToast("Editorial photo deleted.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((prev) => ({ ...prev, url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

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

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-[#1E3A2C]/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E3A2C]/50 uppercase tracking-wider mb-2">
            <Link href="/dashboard" className="hover:text-[#1E3A2C] transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#1E3A2C]/30" />
            <span>Home</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#1E3A2C]/30" />
            <span className="text-[#DAA87C] font-bold">Editorial Photos</span>
          </div>

          <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight flex items-center gap-2.5">
            <Camera className="w-6 h-6 text-[#DAA87C]" />
            <span>Editorial Photos</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#1E3A2C]/65 mt-1">
            Add and manage photoshoot gallery photos displayed in the website editorial slider.
          </p>
        </div>

        {/* Top-Right Add Photo Button */}
        <div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs sm:text-sm font-semibold hover:bg-[#284f3c] transition-all shadow-md shadow-[#1E3A2C]/15 cursor-pointer border border-[#DAA87C]/30"
          >
            <Plus className="w-4 h-4 text-[#DAA87C]" />
            <span>Add Photo</span>
          </button>
        </div>
      </div>

      {/* Editorial Photos Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs overflow-hidden flex flex-col hover:border-[#DAA87C]/40 transition-all"
            >
              {/* Header */}
              <div className="p-3.5 border-b border-[#1E3A2C]/10 flex items-center justify-between bg-[#FAF8F5]">
                <span className="font-bold text-xs text-[#1E3A2C] truncate max-w-[170px]">
                  {photo.title || `Photo #${index + 1}`}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E3A2C]/10 text-[#1E3A2C]">
                  Slide {index + 1}
                </span>
              </div>

              {/* Photo Preview */}
              <div className="relative w-full h-52 bg-neutral-100 overflow-hidden">
                <Image
                  src={photo.url}
                  alt={photo.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-[#FAF8F5]/60 border-t border-[#1E3A2C]/10 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(photo)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[#1E3A2C]/15 hover:border-[#1E3A2C]/40 text-xs font-semibold text-[#1E3A2C] transition-all cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#DAA87C]" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-[#1E3A2C]/10 shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] border border-dashed border-[#1E3A2C]/20 mx-auto flex items-center justify-center">
            <Camera className="w-8 h-8 text-[#1E3A2C]/30" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#1E3A2C]">No Editorial Photos Added Yet</h3>
            <p className="text-xs text-[#1E3A2C]/60 mt-1 max-w-sm mx-auto">
              Photos added here will be automatically displayed on the website&apos;s editorial photoshoots slider.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#284f3c] transition-all cursor-pointer shadow-sm border border-[#DAA87C]/30"
          >
            <Plus className="w-4 h-4 text-[#DAA87C]" />
            <span>Add First Photo</span>
          </button>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
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
                  <Camera className="w-4 h-4 text-[#DAA87C]" />
                  <h3 className="font-bold text-base">
                    {editingPhoto ? "Edit Editorial Photo" : "Add Editorial Photo"}
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
                {/* Title field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#1E3A2C]">Photo Title / Label</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Traditional Handloom Series"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#1E3A2C]/20 text-xs text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white"
                  />
                </div>

                {/* Image Preview & Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1E3A2C]">Photo Image</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#1E3A2C] hover:text-[#DAA87C] cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#DAA87C]" />
                      <span>Upload File</span>
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
                      {formData.url ? (
                        <Image
                          src={formData.url}
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
                        value={formData.url}
                        onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                        placeholder="/images/shoot.png or upload"
                        className="w-full px-3 py-2 rounded-xl border border-[#1E3A2C]/20 text-xs font-mono text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white"
                      />
                    </div>
                  </div>
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
                  onClick={handleSavePhoto}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#284f3c] transition-all cursor-pointer shadow-sm border border-[#DAA87C]/30"
                >
                  <Check className="w-3.5 h-3.5 text-[#DAA87C]" />
                  <span>Save Photo</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
