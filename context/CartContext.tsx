"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Photo } from "@/lib/placeholder";
import type { ProductItem } from "@/app/api/products/route";

export interface CartItem {
  id: number | string;
  name: string;
  price: string;
  foldedImg?: Photo;
  wornImg?: Photo;
  quantity: number;
  stock?: number;
  /** Set for colour variants, where `id` is a per-colour cart key. */
  productId?: number | string;
  variantId?: string;
  selectedColor?: string;
  sku?: string;
  priceValue?: number;
}

/** What can be put in the bag: a product, or a product with a colour chosen. */
export type CartProductInput = Omit<CartItem, "quantity">;

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: CartProductInput, quantity?: number) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => Promise<boolean>;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  const saveCart = (items: CartItem[]) => {
    setCart(items);
    if (typeof window !== "undefined") {
      const key = user?.id ? `thiraala_cart_user_${user.id}` : "thiraala_cart_guest";
      localStorage.setItem(key, JSON.stringify(items));
    }
  };

  // Synchronize cart on mount or when user authentication state changes (TH-041)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (user?.id) {
      // User logged in: migrate any guest items into user account cart
      const guestRaw = localStorage.getItem("thiraala_cart_guest") || localStorage.getItem("thiraala_cart");
      let guestItems: CartItem[] = [];
      if (guestRaw) {
        try {
          guestItems = JSON.parse(guestRaw);
        } catch (e) {
          console.error("Failed to parse guest cart", e);
        }
      }

      const userKey = `thiraala_cart_user_${user.id}`;
      const userRaw = localStorage.getItem(userKey);
      let userItems: CartItem[] = [];
      if (userRaw) {
        try {
          userItems = JSON.parse(userRaw);
        } catch (e) {
          console.error("Failed to parse user cart", e);
        }
      }

      if (guestItems.length > 0) {
        const merged = [...userItems];
        guestItems.forEach((gItem) => {
          const idx = merged.findIndex((m) => String(m.id) === String(gItem.id));
          if (idx > -1) {
            // Cap at the stock we know about (the lower figure, if both carts
            // have one). If neither does, keep the sum: refreshCart below fetches
            // the real stock and trims it, and checkout checks stock anyway.
            const known = [merged[idx].stock, gItem.stock].filter((n): n is number => typeof n === "number");
            const sum = merged[idx].quantity + gItem.quantity;
            merged[idx] = {
              ...merged[idx],
              quantity: known.length ? Math.max(1, Math.min(sum, ...known)) : sum,
              ...(known.length ? { stock: Math.min(...known) } : {}),
            };
          } else {
            merged.push(gItem);
          }
        });
        localStorage.setItem(userKey, JSON.stringify(merged));
        localStorage.removeItem("thiraala_cart_guest");
        localStorage.removeItem("thiraala_cart");
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the saved bag from localStorage (outside React) when the signed-in user changes
        setCart(merged);
      } else {
        setCart(userItems);
      }
    } else {
      // Guest mode: load guest cart or initialize empty
      const guestRaw = localStorage.getItem("thiraala_cart_guest");
      if (guestRaw) {
        try {
          setCart(JSON.parse(guestRaw));
        } catch {
          setCart([]);
        }
      } else {
        setCart([]);
      }
    }
  }, [user]);

  const stockMessage = (name: string, left: number) =>
    left <= 0 ? `Sorry, ${name} is out of stock` : `Only ${left} left in stock`;

  const addToCart = (product: CartProductInput, quantity: number = 1) => {
    let updated: CartItem[];
    const existingIndex = cart.findIndex((item) => String(item.id) === String(product.id));
    
    // Stock comes with the product from the shop (and is refreshed in the bag).
    // Unknown stock isn't guessed: the bag refreshes real stock and checkout checks it.
    const stockLimit = typeof product.stock === "number" ? product.stock : Infinity;

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const newQty = currentQty + quantity;
      if (newQty > stockLimit) {
        showToast(stockMessage(product.name, stockLimit));
        return;
      }
      updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        stock: typeof product.stock === "number" ? product.stock : updated[existingIndex].stock,
      };
      saveCart(updated);
      showToast(`${product.name} quantity increased in bag (${newQty})`);
    } else {
      if (quantity > stockLimit) {
        showToast(stockMessage(product.name, stockLimit));
        return;
      }
      updated = [
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          foldedImg: product.foldedImg,
          wornImg: product.wornImg,
          quantity,
          stock: typeof product.stock === "number" ? product.stock : undefined,
          productId: product.productId,
          variantId: product.variantId,
          selectedColor: product.selectedColor,
          sku: product.sku,
          priceValue: product.priceValue,
        },
      ];
      saveCart(updated);
      showToast(`${product.name} added to bag`);
    }
  };

  const removeFromCart = (id: number | string) => {
    const itemToRemove = cart.find((item) => String(item.id) === String(id));
    const updated = cart.filter((item) => String(item.id) !== String(id));
    saveCart(updated);
    if (itemToRemove) {
      showToast(`${itemToRemove.name} removed from bag`);
    }
  };

  const updateQuantity = (id: number | string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const targetItem = cart.find((item) => String(item.id) === String(id));
    const stockLimit = typeof targetItem?.stock === "number" ? targetItem.stock : Infinity;
    
    if (quantity > stockLimit) {
      showToast(stockMessage(targetItem?.name ?? "This item", stockLimit));
      return;
    }
    const updated = cart.map((item) =>
      String(item.id) === String(id) ? { ...item, quantity } : item
    );
    saveCart(updated);
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== "undefined") {
      const key = user?.id ? `thiraala_cart_user_${user.id}` : "thiraala_cart_guest";
      localStorage.removeItem(key);
      localStorage.removeItem("thiraala_cart");
    }
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

  /**
   * Updates prices, stock, names and photos in the bag from the current
   * catalogue. The server prices every order itself, so a stale bag would
   * otherwise be refused at checkout. Returns true if anything changed.
   */
  const refreshCart = async (): Promise<boolean> => {
    if (cart.length === 0) return false;
    try {
      // Only the products in the bag, not the whole catalogue.
      const ids = [...new Set(cart.map((item) => String(item.productId ?? item.id)))];
      const res = await fetch(`/api/products?ids=${encodeURIComponent(ids.join(","))}`, { cache: "no-store" });
      if (!res.ok) return false;
      const products: ProductItem[] = await res.json();
      if (!Array.isArray(products)) return false;
      const byId = new Map(products.map((p) => [String(p.id), p]));

      let changed = false;
      const updated = cart.map((item) => {
        const product = byId.get(String(item.productId ?? item.id));
        if (!product || product.status === "inactive") return item;
        const variant = item.variantId
          ? (product.variants || []).find((v) => v.id === item.variantId)
          : null;
        if (item.variantId && !variant) return item;

        const priceValue: number = variant?.priceValue ?? product.priceValue ?? 0;
        const stock: number | undefined = variant ? variant.stock : product.stock;
        const next: CartItem = {
          ...item,
          // Trim to what's actually left (an out-of-stock item keeps its
          // quantity so the bag can show it as unavailable).
          quantity: typeof stock === "number" && stock > 0 ? Math.min(item.quantity, stock) : item.quantity,
          name: product.name,
          price: `₹${priceValue.toLocaleString("en-IN")}`,
          priceValue,
          stock,
          foldedImg: variant?.foldedImg || product.foldedImg,
          wornImg: variant?.wornImg || product.wornImg,
        };
        if (next.price !== item.price || next.stock !== item.stock || next.name !== item.name || next.quantity !== item.quantity) changed = true;
        return next;
      });

      if (changed) saveCart(updated);
      return changed;
    } catch {
      return false;
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const cartTotal = cart.reduce((total, item) => {
    const cleanPrice = parseInt(item.price.replace(/[^\d]/g, ""), 10) || 0;
    return total + cleanPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
      {/* Cart Toast Notification */}
      <div
        className={`fixed bottom-20 right-6 z-[200] pointer-events-none transition-all duration-500 transform ${
          toast.show ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
        }`}
      >
        <div className="bg-[#1E3A2C] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#DAA87C]/30 select-none">
          <svg className="w-5 h-5 text-[#DAA87C] flex-shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
