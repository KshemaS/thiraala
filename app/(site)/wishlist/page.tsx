"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import CategoryCard from "@/components/CategoryCard";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ShoppingBag, ArrowRight, Heart } from "lucide-react";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [isClearing, setIsClearing] = useState(false);

  const handleAddAllToCart = () => {
    wishlist.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        foldedImg: item.foldedImg,
        wornImg: item.wornImg,
      });
    });
  };

  const handleConfirmClear = async () => {
    if (confirm("Are you sure you want to clear all items from your wishlist?")) {
      setIsClearing(true);
      await clearWishlist();
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />

      <main className="flex-1 py-12 sm:py-16 lg:py-20">
        <Container>
          {/* Header Section */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] text-xs font-semibold uppercase tracking-wider mb-3">
              <Heart className="w-3.5 h-3.5 text-[#DAA87C] fill-[#DAA87C]" />
              <span>Personal Collection</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight">
              Your Wishlist
            </h1>
            <div className="w-12 h-1 bg-[#DAA87C] mx-auto my-3 rounded-full"></div>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
              Curate your favorite drapes. Save sarees to customize your selections or prepare for your next signature occasion.
            </p>
          </div>

          {/* Wishlist Items Content */}
          {wishlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-400 mb-6 border border-red-100 shadow-inner">
                <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#1E3A2C]">Your wishlist is empty</h3>
              <p className="text-xs text-[#1E3A2C]/60 mt-2 leading-relaxed font-semibold">
                Explore our collection to find elegant, lightweight, and handwoven sarees for every occasion.
              </p>
              <Link
                href="/products"
                className="mt-8 px-8 py-3.5 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-md shadow-[#1E3A2C]/10 transition-all hover:scale-[1.02] inline-flex items-center gap-1.5 group cursor-pointer text-white"
              >
                Explore Collections
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Toolbar Actions Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#1E3A2C]/10 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A2C]">
                  <span className="w-2 h-2 rounded-full bg-[#DAA87C]"></span>
                  <span>{wishlist.length} {wishlist.length === 1 ? "saree saved" : "sarees saved"}</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {/* Add All to Cart */}
                  <button
                    type="button"
                    onClick={handleAddAllToCart}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1E3A2C] text-[#FAF8F5] text-xs font-bold hover:bg-[#284f3c] transition-all shadow-xs cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#DAA87C]" />
                    <span>Add All to Bag</span>
                  </button>

                  {/* Clear Wishlist */}
                  <button
                    type="button"
                    onClick={handleConfirmClear}
                    disabled={isClearing}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                    title="Clear all wishlist items"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                <AnimatePresence>
                  {wishlist.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className="relative group/card flex flex-col"
                    >
                      <CategoryCard
                        actionLabel="Shop Now"
                        product={{
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          foldedImg: item.foldedImg,
                          wornImg: item.wornImg,
                          altFolded: item.altFolded || item.name,
                          altWorn: item.altWorn || item.name,
                        }}
                      />

                      {/* Quick Action Footer for Wishlist Item */}
                      <div className="mt-2.5 flex items-center justify-between gap-2 px-1">
                        <button
                          type="button"
                          onClick={() =>
                            addToCart({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              foldedImg: item.foldedImg,
                              wornImg: item.wornImg,
                            })
                          }
                          className="flex-1 py-2 px-3 rounded-xl border border-[#1E3A2C]/10 bg-white hover:bg-[#1E3A2C] text-[#1E3A2C] hover:text-[#FAF8F5] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group/btn"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#DAA87C]" />
                          <span>Add to Bag</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeFromWishlist(item.id)}
                          className="p-2 rounded-xl border border-rose-200/60 bg-rose-50/40 hover:bg-rose-100 text-rose-600 transition-all cursor-pointer shadow-2xs"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
