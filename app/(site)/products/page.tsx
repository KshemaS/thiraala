import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductBanner from "@/components/ProductBanner";
import ProductListing from "@/components/ProductListing";

export const metadata: Metadata = {
  title: "Curated Saree Collection",
  description: "Browse handwoven Kasavu, cotton, tissue, and festive sarees at thiraala. Filter by fabric, sort by newest arrivals and top ratings.",
};

export default function ProductsListingPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C]">
      <Header />

      <main className="flex-1 w-full bg-[#fcfbfa]">
        <ProductBanner />
        <Suspense
          fallback={
            <div className="w-full py-20 flex justify-center items-center">
              <div className="w-8 h-8 border-2 border-[#DAA87C] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <ProductListing />
        </Suspense>
      </main>

      <div className="w-full border-b border-[#1E3A2C]/15"></div>
      <Footer />
    </div>
  );
}
