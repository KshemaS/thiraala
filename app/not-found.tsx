import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />

      <main className="flex-1 py-16 sm:py-24 flex items-center justify-center">
        <Container>
          <div className="max-w-md mx-auto text-center space-y-6">
            {/* Ornamental 404 Graphic */}
            <div className="relative mx-auto w-28 h-28 rounded-full bg-[#1E3A2C]/5 border border-[#DAA87C]/30 flex items-center justify-center shadow-inner">
              <span className="text-4xl font-extrabold text-[#1E3A2C] tracking-tighter">
                404
              </span>
              <div className="absolute -bottom-1 w-10 h-1 bg-[#DAA87C] rounded-full"></div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1E3A2C] tracking-tight">
                Page Not Found
              </h1>
              <p className="text-xs sm:text-sm text-[#1E3A2C]/65 leading-relaxed font-semibold">
                The drape or page you are looking for may have been moved, renamed, or is no longer available in our collection.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-bold btn-animate-border btn-animate-border-dark text-white shadow-md shadow-[#1E3A2C]/10 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#DAA87C]" />
                <span>Back to Shop</span>
              </Link>

              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-xs font-bold border border-[#1E3A2C]/20 text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return Home</span>
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
