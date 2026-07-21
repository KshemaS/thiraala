"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface SareeProduct {
  id: number;
  name: string;
  price: string;
  foldedImg?: any;
  wornImg?: any;
  img?: any;
  altFolded?: string;
  altWorn?: string;
  category?: string;
}

interface WishlistContextType {
  wishlist: SareeProduct[];
  toggleWishlist: (product: SareeProduct) => void;
  isInWishlist: (id: number) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<SareeProduct[]>([]);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("thiraala_wishlist");
    if (stored) {
      try {
        setWishlist(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load wishlist", e);
      }
    }
  }, []);

  const toggleWishlist = (product: SareeProduct) => {
    let updated: SareeProduct[];
    const exists = wishlist.some((item) => item.id === product.id);

    if (exists) {
      updated = wishlist.filter((item) => item.id !== product.id);
      showToast(`${product.name} removed from wishlist`);
    } else {
      updated = [...wishlist, product];
      showToast(`${product.name} added to wishlist`);
    }

    setWishlist(updated);
    localStorage.setItem("thiraala_wishlist", JSON.stringify(updated));
  };

  const isInWishlist = (id: number) => {
    return wishlist.some((item) => item.id === id);
  };

  const showToast = (message: string) => {
    setToast({ message, show: true });
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
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
