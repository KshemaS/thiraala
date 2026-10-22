"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

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

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<SareeProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  const showToast = (message: string) => {
    setToast({ message, show: true });
  };

  // Helper to get active user ID / email if logged in
  const getUserId = useCallback((): string | null => {
    return user?.id || user?.email || null;
  }, [user]);

  // Fetch wishlist from local storage for guests, or API for authenticated users
  const refreshWishlist = useCallback(async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        if (typeof window !== "undefined") {
          try {
            const stored = localStorage.getItem("thiraala_guest_wishlist");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                // Filter out corrupted or broken items (e.g. price '?' or missing names)
                const validItems = parsed.filter(
                  (item: any) =>
                    item &&
                    item.name &&
                    item.price &&
                    item.price !== "?" &&
                    !String(item.price).includes("NaN") &&
                    item.name !== "Mayil Peacock Motif" &&
                    item.name !== "Gopuram Classic Kasavu"
                );
                setWishlist(validItems);
                if (validItems.length !== parsed.length) {
                  localStorage.setItem("thiraala_guest_wishlist", JSON.stringify(validItems));
                }
              } else {
                setWishlist([]);
              }
            } else {
              setWishlist([]);
            }
          } catch {
            setWishlist([]);
          }
        }
        return;
      }

      const url = `/api/wishlist?userId=${encodeURIComponent(userId)}`;
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
        }
      }
    } catch (e) {
      console.error("Failed to fetch wishlist:", e);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId]);

  // Initial load: Fetch from API or localStorage
  useEffect(() => {
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
    showToast(`${product.name} added to wishlist`);

    const userId = getUserId();
    if (!userId) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("thiraala_guest_wishlist", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return;
    }

    // API call (POST /api/wishlist)
    try {
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
    if (itemToRemove) {
      showToast(`${itemToRemove.name} removed from wishlist`);
    } else {
      showToast("Removed from wishlist");
    }

    const userId = getUserId();
    if (!userId) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("thiraala_guest_wishlist", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return;
    }

    // API call (DELETE /api/wishlist?productId=...)
    try {
      const params = new URLSearchParams({ productId: String(id), id: String(id) });
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
    showToast("Wishlist cleared");

    const userId = getUserId();
    if (!userId) {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("thiraala_guest_wishlist");
        } catch {
          // ignore
        }
      }
      return;
    }

    // API call (DELETE /api/wishlist?clearAll=true)
    try {
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
