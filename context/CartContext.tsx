"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: string;
  foldedImg?: any;
  wornImg?: any;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState<{ message: string; show: boolean }>({ message: "", show: false });

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("thiraala_cart");
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  const addToCart = (product: any, quantity: number = 1) => {
    let updated: CartItem[];
    const existingIndex = cart.findIndex((item) => item.id === product.id);

    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].quantity += quantity;
    } else {
      updated = [
        ...cart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          foldedImg: product.foldedImg,
          wornImg: product.wornImg,
          quantity,
        },
      ];
    }

    setCart(updated);
    localStorage.setItem("thiraala_cart", JSON.stringify(updated));
    showToast(`${quantity} x ${product.name} added to cart`);
  };

  const removeFromCart = (id: number) => {
    const itemToRemove = cart.find((item) => item.id === id);
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem("thiraala_cart", JSON.stringify(updated));
    if (itemToRemove) {
      showToast(`${itemToRemove.name} removed from cart`);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    const updated = cart.map((item) => (item.id === id ? { ...item, quantity } : item));
    setCart(updated);
    localStorage.setItem("thiraala_cart", JSON.stringify(updated));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("thiraala_cart");
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
