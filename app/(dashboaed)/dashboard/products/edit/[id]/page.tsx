"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit3, Loader2, AlertCircle } from "lucide-react";
import ProductForm from "@/components/dashboard/ProductForm";
import { ProductItem } from "@/app/api/products/route";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          throw new Error("Product not found");
        }
        const data = await res.json();
        setProduct(data);
      } catch (err: any) {
        console.error("Error loading product:", err);
        setError(err.message || "Failed to load product details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#DAA87C] mb-3" />
        <p className="text-xs font-semibold text-[#1E3A2C]/60">Loading product information...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex-1 p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#1E3A2C]">Product Not Found</h2>
        <p className="text-xs text-[#1E3A2C]/60">
          {error || "The product you are attempting to edit does not exist or has been removed."}
        </p>
        <Link
          href="/dashboard/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3A2C] text-white text-xs font-semibold hover:bg-[#284f3c] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Products</span>
        </Link>
      </div>
    );
  }

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
            <span className="text-[#DAA87C] font-bold">Edit #{product.sku || product.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight flex items-center gap-2.5">
            <Edit3 className="w-6 h-6 text-[#DAA87C]" />
            <span>Edit Product: {product.name}</span>
          </h1>
          <p className="text-xs text-[#1E3A2C]/60">
            Modify product details, update pricing, adjust stock units, or switch category.
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

      {/* Product Form Component in Edit Mode */}
      <ProductForm initialData={product} isEdit={true} />
    </div>
  );
}
