"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductBanner from "@/components/ProductBanner";
import ProductListing from "@/components/ProductListing";

export default function ProductsListingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C]">
      <Header />

      <main className="flex-1 w-full bg-[#fcfbfa]">
        <ProductBanner />
        <ProductListing />
      </main>

      <div className="w-full border-b border-[#1E3A2C]/15"></div>
      <Footer />
    </div>
  );
}
