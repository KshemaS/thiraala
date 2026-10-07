"use client";

import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import ProductForm from "@/components/dashboard/ProductForm";

export default function CreateProductPage() {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E3A2C]/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A2C]/50">
            <Link href="/dashboard" className="hover:text-[#1E3A2C] transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/products" className="hover:text-[#1E3A2C] transition-colors">
              Products
            </Link>
            <span>/</span>
            <span className="text-[#DAA87C] font-bold">Add Product</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight flex items-center gap-2.5">
            <PlusCircle className="w-6 h-6 text-[#DAA87C]" />
            <span>Add New Product</span>
          </h1>
          <p className="text-xs text-[#1E3A2C]/60">
            Create a new saree product with fabric specifications, pricing, inventory stock, and category.
          </p>
        </div>

        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1E3A2C]/15 bg-white text-xs font-bold text-[#1E3A2C] hover:bg-[#FAF8F5] transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#DAA87C]" />
          <span>Back to Products</span>
        </Link>
      </div>

      {/* Product Form Component */}
      <ProductForm isEdit={false} />
    </div>
  );
}
