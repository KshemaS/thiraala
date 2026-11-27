"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import RegisterModal from "@/components/RegisterModal";
import type { Photo } from "@/lib/placeholder";

/**
 * The wishlist is for signed-in customers only, kept on the server
 * (/api/wishlist). A guest who taps the heart is asked to sign in, and the
 * saree is saved as soon as they do.
 */
const OLD_GUEST_KEY = "thiraala_guest_wishlist";

export interface SareeProduct {
  id: number | string;
  productId?: number | string;
  name: string;
  price: string;
  foldedImg?: Photo;
  wornImg?: Photo;
  img?: Photo;
  altFolded?: string;
  altWorn?: string;
  category?: string;
  createdAt?: string;
}

/** An item as /api/wishlist returns it. */
interface WishlistApiItem {
  id: string;
  productId?: string;
  name: string;
  price: string;
  foldedImg?: string;
  wornImg?: string;
  img?: string;
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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  // The saree a guest tried to save; added once they sign in.
  const pendingRef = useRef<SareeProduct | null>(null);
  const signedInRef = useRef(false);

  const showToast = (message: string) => {
    setToast({ message, show: true });
  };

  // Helper to get active user ID / email if logged in
  const getUserId = useCallback((): string | null => {
    return user?.id || user?.email || null;
  }, [user]);

  // Load the signed-in customer's wishlist from the API (guests have none)
  const refreshWishlist = useCallback(async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        setWishlist([]);
        // Guest wishlists used to live in the browser; drop the leftovers.
        try {
          localStorage.removeItem(OLD_GUEST_KEY);
        } catch {
          // storage unavailable
        }
        return;
      }

      // The server knows who is signed in from the session cookie.
      const res = await fetch("/api/wishlist");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.items)) {
          // Normalize items format
          const formatted: SareeProduct[] = data.items.map((it: WishlistApiItem) => ({
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

  // Initial load (and again whenever the signed-in customer changes)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loads data from the server when this opens; the data arrives asynchronously
    refreshWishlist();
  }, [refreshWishlist]);

  /** Saves one saree on the server; returns false if it was refused. */
  const saveToServer = async (product: SareeProduct): Promise<boolean> => {
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The server takes name, price and photos from the product itself.
        body: JSON.stringify({ productId: product.productId ?? product.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        showToast(data?.error || "Couldn't save to your wishlist. Please try again.");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Failed to add to wishlist:", err);
      showToast("Couldn't save to your wishlist. Please try again.");
      return false;
    }
  };

  // CREATE: Add item to wishlist (signed-in customers only)
  const addToWishlist = async (product: SareeProduct) => {
    if (!getUserId()) {
      pendingRef.current = product;
      setIsLoginOpen(true);
      return;
    }

    const exists = wishlist.some((item) => String(item.id) === String(product.id));
    if (exists) {
      showToast(`${product.name} is already in your wishlist`);
      return;
    }

    // Optimistic UI update, undone if the server refuses.
    const before = wishlist;
    setWishlist([product, ...wishlist]);
    showToast(`${product.name} added to wishlist`);
    if (!(await saveToServer(product))) setWishlist(before);
  };

  // After a guest signs in from the heart button, save the saree they chose.
  useEffect(() => {
    const pending = pendingRef.current;
    if (!user || !pending) return;
    pendingRef.current = null;
    (async () => {
      if (await saveToServer(pending)) showToast(`${pending.name} added to wishlist`);
      await refreshWishlist();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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

    if (!getUserId()) return;

    // API call (DELETE /api/wishlist?productId=...)
    try {
      const params = new URLSearchParams({ productId: String(id) });

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

    if (!getUserId()) return;

    // API call (DELETE /api/wishlist?clearAll=true)
    try {
      const params = new URLSearchParams({ clearAll: "true" });

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
      <RegisterModal
        isOpen={isLoginOpen}
        // Called before onClose on a successful sign-in; keeps the saree so the
        // effect above saves it once the signed-in user arrives.
        onRegisterSuccess={() => {
          signedInRef.current = true;
        }}
        onClose={() => {
          setIsLoginOpen(false);
          // Closed without signing in: forget the saree.
          if (!signedInRef.current) pendingRef.current = null;
          signedInRef.current = false;
        }}
        initialMode="login"
        notice="Please sign in to save sarees to your wishlist."
      />
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
