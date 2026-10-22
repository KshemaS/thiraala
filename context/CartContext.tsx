"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { sareesData } from "@/data/products";

export interface CartItem {
  id: number | string;
  name: string;
  price: string;
  foldedImg?: any;
  wornImg?: any;
  quantity: number;
  stock?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
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
            merged[idx].quantity = Math.min(
              merged[idx].quantity + gItem.quantity,
              merged[idx].stock ?? 10
            );
          } else {
            merged.push(gItem);
          }
        });
        localStorage.setItem(userKey, JSON.stringify(merged));
        localStorage.removeItem("thiraala_cart_guest");
        localStorage.removeItem("thiraala_cart");
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

  const addToCart = (product: any, quantity: number = 1) => {
    let updated: CartItem[];
    const existingIndex = cart.findIndex((item) => String(item.id) === String(product.id));
    
    // Resolve accurate stock limit from product object or catalog
    const catalogItem = sareesData.find(
      (p) => String(p.id) === String(product.id) || p.slug === product.slug || p.name === product.name
    );
    const stockLimit = product.stock !== undefined ? product.stock : (catalogItem?.stock ?? 10);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const newQty = currentQty + quantity;
      if (newQty > stockLimit) {
        showToast(`Only ${stockLimit} left in stock`);
        return;
      }
      updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        stock: stockLimit,
      };
      saveCart(updated);
      showToast(`${product.name} quantity increased in bag (${newQty})`);
    } else {
      if (quantity > stockLimit) {
        showToast(`Only ${stockLimit} left in stock`);
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
          stock: stockLimit,
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
    const catalogItem = sareesData.find((p) => String(p.id) === String(id));
    const stockLimit = targetItem?.stock !== undefined ? targetItem.stock : (catalogItem?.stock ?? 10);
    
    if (quantity > stockLimit) {
      showToast(`Only ${stockLimit} left in stock`);
      return;
    }
    const updated = cart.map((item) =>
      String(item.id) === String(id) ? { ...item, quantity, stock: stockLimit } : item
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
