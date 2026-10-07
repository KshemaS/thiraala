"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Edit3,
  Check,
  X,
  Upload,
  RefreshCw,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

interface BannerImages {
  image1: string;
  image2: string;
  image3: string;
}

const DEFAULT_IMAGES: BannerImages = {
  image1: "",
  image2: "",
  image3: "",
};

const STORAGE_KEY = "thiraala_hero_banners";

// Quick pickable presets from the project images
const PRESET_OPTIONS = [
  { label: "Honey Saree", path: "/images/honey.jpeg" },
  { label: "Kshema Saree", path: "/images/kshe.jpeg" },
  { label: "Swathi Saree", path: "/images/swa.jpeg" },
  { label: "Cream Gold Saree", path: "/images/saree-cream-gold.png" },
  { label: "Green Gold Saree", path: "/images/saree-green-gold.png" },
  { label: "Emerald Saree", path: "/images/saree-emerald-designer.png" },
  { label: "Shoot Editorial", path: "/images/shoot.png" },
  { label: "Products Weave", path: "/images/products-bg.png" },
];

export default function HomeBannerPage() {
  const [images, setImages] = useState<BannerImages>(DEFAULT_IMAGES);
  const [formData, setFormData] = useState<BannerImages>(DEFAULT_IMAGES);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"image1" | "image2" | "image3">("image1");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File input ref for uploading
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved images from API and localStorage
  useEffect(() => {
    const loadBanners = async () => {
      try {
        // First check client localStorage for immediate display
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const loaded = {
            image1: parsed.image1 || "",
            image2: parsed.image2 || "",
            image3: parsed.image3 || "",
          };
          setImages(loaded);
          setFormData(loaded);
        }

        // Fetch authoritative server data
        const res = await fetch("/api/banners");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const loaded = {
              image1: data.image1 || "",
              image2: data.image2 || "",
              image3: data.image3 || "",
            };
            setImages(loaded);
            setFormData(loaded);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
          }
        }
      } catch (e) {
        console.error("Error reading banners:", e);
      }
    };

    loadBanners();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenEdit = (field: "image1" | "image2" | "image3") => {
    setFormData({ ...images });
    setActiveTab(field);
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    setImages(formData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      window.dispatchEvent(new Event("thiraala-banners-updated"));
    } catch (e) {
      console.error("Error saving banners:", e);
    }
    setIsEditModalOpen(false);
    showToast("Banner images updated successfully!");
  };

  const handleReset = async () => {
    if (confirm("Clear all banner images?")) {
      setImages(DEFAULT_IMAGES);
      setFormData(DEFAULT_IMAGES);
      localStorage.removeItem(STORAGE_KEY);
      try {
        await fetch("/api/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(DEFAULT_IMAGES),
        });
        window.dispatchEvent(new Event("thiraala-banners-updated"));
      } catch (e) {
        console.error("Error resetting banners:", e);
      }
      setIsEditModalOpen(false);
      showToast("Cleared banner images.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData((prev) => ({ ...prev, [activeTab]: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const tabLabels = {
    image1: { title: "1. Left Image", desc: "Square (1:1) • Small left floating card" },
    image2: { title: "2. Center Image", desc: "Portrait (3:4) • Medium center card" },
    image3: { title: "3. Right Image", desc: "Tall (9:16) • Large right focal card" },
  };

  const hasAnyImages = Boolean(images.image1 || images.image2 || images.image3);

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

      {/* Top Header (No Edit button on top) */}
      <div className="bg-white rounded-2xl p-6 border border-[#1E3A2C]/10 shadow-xs">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E3A2C]/50 uppercase tracking-wider mb-2">
          <Link href="/dashboard" className="hover:text-[#1E3A2C] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#1E3A2C]/30" />
          <span>Home</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#1E3A2C]/30" />
          <span className="text-[#DAA87C] font-bold">Banner</span>
        </div>

        <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight flex items-center gap-2.5">
          <ImageIcon className="w-6 h-6 text-[#DAA87C]" />
          <span>Hero Banner Images</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#1E3A2C]/65 mt-1">
          Manage the 3 showcase images displayed on the homepage hero section. Only images configured here will appear on the website.
        </p>
      </div>

      {/* The 3 Images Display Grid with individual Edit buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Field 1: Image 1 (Left) */}
        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#1E3A2C]/10 flex items-center justify-between bg-[#FAF8F5]">
            <span className="font-bold text-sm text-[#1E3A2C]">1. Left Image</span>
            {/* Edit Button on Card */}
            <button
              type="button"
              onClick={() => handleOpenEdit("image1")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#284f3c] transition-all shadow-xs cursor-pointer border border-[#DAA87C]/30"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#DAA87C]" />
              <span>Edit</span>
            </button>
          </div>

          <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[220px]">
            {images.image1 ? (
              <div className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-2xl overflow-hidden border border-[#1E3A2C]/10 shadow-sm bg-neutral-100">
                <Image
                  src={images.image1}
                  alt="Banner Image 1"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-[#1E3A2C]/40 space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-dashed border-[#1E3A2C]/20 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-[#1E3A2C]/30" />
                </div>
                <p className="text-xs font-semibold text-[#1E3A2C]/60">No image added</p>
                <p className="text-[11px] text-[#1E3A2C]/40">Click Edit to add this banner image</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#FAF8F5]/60 border-t border-[#1E3A2C]/10 text-xs text-[#1E3A2C]/70">
            <span className="font-semibold block text-[#1E3A2C]">Placement:</span>
            <span className="text-[11px] text-[#1E3A2C]/60">Small left floating hero card</span>
          </div>
        </div>

        {/* Field 2: Image 2 (Center) */}
        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#1E3A2C]/10 flex items-center justify-between bg-[#FAF8F5]">
            <span className="font-bold text-sm text-[#1E3A2C]">2. Center Image</span>
            {/* Edit Button on Card */}
            <button
              type="button"
              onClick={() => handleOpenEdit("image2")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#284f3c] transition-all shadow-xs cursor-pointer border border-[#DAA87C]/30"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#DAA87C]" />
              <span>Edit</span>
            </button>
          </div>

          <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[220px]">
            {images.image2 ? (
              <div className="relative w-40 h-56 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border border-[#1E3A2C]/10 shadow-sm bg-neutral-100">
                <Image
                  src={images.image2}
                  alt="Banner Image 2"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-[#1E3A2C]/40 space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-dashed border-[#1E3A2C]/20 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-[#1E3A2C]/30" />
                </div>
                <p className="text-xs font-semibold text-[#1E3A2C]/60">No image added</p>
                <p className="text-[11px] text-[#1E3A2C]/40">Click Edit to add this banner image</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#FAF8F5]/60 border-t border-[#1E3A2C]/10 text-xs text-[#1E3A2C]/70">
            <span className="font-semibold block text-[#1E3A2C]">Placement:</span>
            <span className="text-[11px] text-[#1E3A2C]/60">Medium center floating hero card</span>
          </div>
        </div>

        {/* Field 3: Image 3 (Right) */}
        <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#1E3A2C]/10 flex items-center justify-between bg-[#FAF8F5]">
            <span className="font-bold text-sm text-[#1E3A2C]">3. Right Image</span>
            {/* Edit Button on Card */}
            <button
              type="button"
              onClick={() => handleOpenEdit("image3")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#284f3c] transition-all shadow-xs cursor-pointer border border-[#DAA87C]/30"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#DAA87C]" />
              <span>Edit</span>
            </button>
          </div>

          <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[220px]">
            {images.image3 ? (
              <div className="relative w-40 h-64 sm:w-48 sm:h-72 rounded-2xl overflow-hidden border border-[#1E3A2C]/10 shadow-sm bg-neutral-100">
                <Image
                  src={images.image3}
                  alt="Banner Image 3"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-[#1E3A2C]/40 space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-dashed border-[#1E3A2C]/20 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-[#1E3A2C]/30" />
                </div>
                <p className="text-xs font-semibold text-[#1E3A2C]/60">No image added</p>
                <p className="text-[11px] text-[#1E3A2C]/40">Click Edit to add this banner image</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#FAF8F5]/60 border-t border-[#1E3A2C]/10 text-xs text-[#1E3A2C]/70">
            <span className="font-semibold block text-[#1E3A2C]">Placement:</span>
            <span className="text-[11px] text-[#1E3A2C]/60">Large right hero focal card</span>
          </div>
        </div>
      </div>

      {/* Live Layout Preview */}
      <div className="bg-white rounded-2xl p-6 border border-[#1E3A2C]/10 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#1E3A2C]">Live Arrangement Preview</h2>
          <p className="text-xs text-[#1E3A2C]/60">
            Simulated view of the images as rendered together on the website hero section.
          </p>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl p-6 sm:p-10 flex items-end justify-center gap-3 sm:gap-6 border border-[#1E3A2C]/5 min-h-[260px]">
          {hasAnyImages ? (
            <>
              {/* Left Preview */}
              {images.image1 && (
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl overflow-hidden relative shadow-md border border-white flex-shrink-0">
                  <Image
                    src={images.image1}
                    alt="Left Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Center Preview */}
              {images.image2 && (
                <div className="w-20 h-32 sm:w-28 sm:h-44 rounded-2xl overflow-hidden relative shadow-md border border-white flex-shrink-0">
                  <Image
                    src={images.image2}
                    alt="Center Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Right Preview */}
              {images.image3 && (
                <div className="w-32 h-44 sm:w-44 sm:h-60 rounded-2xl overflow-hidden relative shadow-lg border border-white flex-shrink-0">
                  <Image
                    src={images.image3}
                    alt="Right Preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-xs text-[#1E3A2C]/50">
              No banner images added yet. Click &quot;Edit&quot; on any slot above to add images from dashboard.
            </div>
          )}
        </div>
      </div>

      {/* EDIT MODAL */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="fixed inset-0 bg-[#1E3A2C]/50 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#1E3A2C]/15 overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 bg-[#1E3A2C] text-[#FAF8F5] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-4 h-4 text-[#DAA87C]" />
                  <h3 className="font-bold text-base">Edit Banner Image</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded-lg text-[#FAF8F5]/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Slot Switcher Tabs */}
              <div className="p-2 bg-[#FAF8F5] border-b border-[#1E3A2C]/10 flex items-center gap-1.5">
                {(["image1", "image2", "image3"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === key
                        ? "bg-[#1E3A2C] text-[#FAF8F5] shadow-xs"
                        : "text-[#1E3A2C]/70 hover:bg-white/70"
                    }`}
                  >
                    {tabLabels[key].title}
                  </button>
                ))}
              </div>

              {/* Form Body for Selected Tab */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#1E3A2C]">
                      {tabLabels[activeTab].title}
                    </h4>
                    <p className="text-[11px] text-[#1E3A2C]/60">
                      {tabLabels[activeTab].desc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#1E3A2C]/15 hover:border-[#1E3A2C]/40 text-xs font-semibold text-[#1E3A2C] cursor-pointer transition-all"
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

                {/* Preview & Path Input */}
                <div className="flex items-center gap-4 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#1E3A2C]/10">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-neutral-200 border border-[#1E3A2C]/15 flex-shrink-0 flex items-center justify-center">
                    {formData[activeTab] ? (
                      <Image
                        src={formData[activeTab]}
                        alt={tabLabels[activeTab].title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#1E3A2C]/20" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label className="text-[11px] font-bold text-[#1E3A2C]">
                      Image Source Path / URL
                    </label>
                    <input
                      type="text"
                      value={formData[activeTab]}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [activeTab]: e.target.value }))
                      }
                      placeholder="/images/honey.jpeg or upload"
                      className="w-full px-3 py-2 rounded-xl border border-[#1E3A2C]/20 text-xs font-mono text-[#1E3A2C] focus:outline-none focus:border-[#DAA87C] bg-white"
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-[#FAF8F5] border-t border-[#1E3A2C]/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-red-600 hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#1E3A2C]/20 text-xs font-semibold text-[#1E3A2C] hover:bg-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#1E3A2C] text-[#FAF8F5] text-xs font-semibold hover:bg-[#284f3c] transition-all cursor-pointer shadow-sm border border-[#DAA87C]/30"
                  >
                    <Check className="w-3.5 h-3.5 text-[#DAA87C]" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
