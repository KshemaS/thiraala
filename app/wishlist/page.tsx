"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import CategoryCard from "@/components/CategoryCard";
import { useWishlist } from "@/context/WishlistContext";
import Link from "next/link";

export default function WishlistPage() {
  const { wishlist } = useWishlist();

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />

      <main className="flex-1 py-12 sm:py-16 lg:py-20 select-none">
        <Container>
          {/* Header Section */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight">
              Your Wishlist
            </h1>
            <div className="w-12 h-1 bg-[#DAA87C] mx-auto my-4 rounded-full"></div>
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
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-20 sm:gap-10">
              {wishlist.map((item) => (
                <div key={item.id}>
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
                </div>
              ))}
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
