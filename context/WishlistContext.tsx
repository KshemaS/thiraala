"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface SareeProduct {
  id: number | string;
  productId?: number | string;
  name: string;
  price: string;
  foldedImg?: any;
  wornImg?: any;
  img?: any;
  altFolded?: string;
  altWorn?: string;
  category?: string;
  createdAt?: string;
}

interface WishlistContextType {
  wishlist: SareeProduct[];
  isLoading: boolean;
  addToWishlist: (product: SareeProduct) => Promise<void>;
  removeFromWishlist: (id: number | string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  toggleWishlist: (product: SareeProduct) => Promise<void>;
  isInWishlist: (id: number | string) => boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const STORAGE_KEY = "thiraala_wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<SareeProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  const showToast = (message: string) => {
    setToast({ message, show: true });
  };

  // Helper to get active user ID / email if logged in
  const getUserId = (): string | null => {
    try {
      const stored = localStorage.getItem("thiraala_user");
      if (stored) {
        const u = JSON.parse(stored);
        return u?.id || u?.email || null;
      }
    } catch {
      // Ignore
    }
    return null;
  };

  // Fetch wishlist from API (READ)
  const refreshWishlist = useCallback(async () => {
    try {
      const userId = getUserId();
      const url = userId ? `/api/wishlist?userId=${encodeURIComponent(userId)}` : "/api/wishlist";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          // Normalize items format
          const formatted: SareeProduct[] = data.items.map((it: any) => ({
            id: it.productId !== undefined ? it.productId : it.id,
            productId: it.productId,
            name: it.name,
            price: it.price,
            foldedImg: it.foldedImg || it.img,
            wornImg: it.wornImg || it.img,
            img: it.img || it.foldedImg || it.wornImg,
            altFolded: it.altFolded || it.name,
            altWorn: it.altWorn || it.name,
            category: it.category,
            createdAt: it.createdAt,
          }));

          setWishlist(formatted);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(formatted));
        }
      }
    } catch (e) {
      console.error("Failed to fetch wishlist from API:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load: Fast optimistic localStorage restore, then fetch from API
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        }
      } catch (e) {
        console.error("Failed to load wishlist from localStorage", e);
      }
    }

    refreshWishlist();
  }, [refreshWishlist]);

  // CREATE: Add item to wishlist
  const addToWishlist = async (product: SareeProduct) => {
    const exists = wishlist.some((item) => String(item.id) === String(product.id));
    if (exists) {
      showToast(`${product.name} is already in your wishlist`);
      return;
    }

    // Optimistic UI update
    const updated = [product, ...wishlist];
    setWishlist(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    showToast(`${product.name} added to wishlist`);

    // API call (POST /api/wishlist)
    try {
      const userId = getUserId();
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          name: product.name,
          price: product.price,
          foldedImg: typeof product.foldedImg === "string" ? product.foldedImg : null,
          wornImg: typeof product.wornImg === "string" ? product.wornImg : null,
          img: typeof product.img === "string" ? product.img : null,
          altFolded: product.altFolded || product.name,
          altWorn: product.altWorn || product.name,
          category: product.category,
          userId,
        }),
      });
    } catch (err) {
      console.error("Failed to sync add to wishlist API:", err);
    }
  };

  // DELETE: Remove item from wishlist
  const removeFromWishlist = async (id: number | string) => {
    const itemToRemove = wishlist.find((item) => String(item.id) === String(id));
    const updated = wishlist.filter((item) => String(item.id) !== String(id));

    // Optimistic UI update
    setWishlist(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (itemToRemove) {
      showToast(`${itemToRemove.name} removed from wishlist`);
    }

    // API call (DELETE /api/wishlist?productId=...)
    try {
      const userId = getUserId();
      const params = new URLSearchParams({ productId: String(id) });
      if (userId) params.append("userId", userId);

      await fetch(`/api/wishlist?${params.toString()}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to sync remove from wishlist API:", err);
    }
  };

  // DELETE ALL: Clear entire wishlist
  const clearWishlist = async () => {
    if (wishlist.length === 0) return;

    // Optimistic UI update
    setWishlist([]);
    localStorage.removeItem(STORAGE_KEY);
    showToast("Wishlist cleared");

    // API call (DELETE /api/wishlist?clearAll=true)
    try {
      const userId = getUserId();
      const params = new URLSearchParams({ clearAll: "true" });
      if (userId) params.append("userId", userId);

      await fetch(`/api/wishlist?${params.toString()}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to sync clear wishlist API:", err);
    }
  };

  // TOGGLE: Add or Remove
  const toggleWishlist = async (product: SareeProduct) => {
    const exists = wishlist.some((item) => String(item.id) === String(product.id));
    if (exists) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (id: number | string) => {
    return wishlist.some((item) => String(item.id) === String(id));
  };

  // Toast timer auto-dismiss
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        toggleWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
      {/* Premium Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-[200] pointer-events-none transition-all duration-500 transform ${
          toast.show ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
        }`}
      >
        <div className="bg-[#1E3A2C] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#DAA87C]/30 select-none">
          <svg className="w-5 h-5 text-[#DAA87C] flex-shrink-0 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      </div>
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
