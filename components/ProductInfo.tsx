"use client";

import { useState } from "react";
import Link from "next/link";
import { SareeProduct } from "@/data/products";

// Color definitions matching the design reference swatches
const colorVariants = [
  { id: 1, name: "Golden Kasavu", colorHex: "#DAA87C", productId: 1 },
  { id: 2, name: "Pearl White", colorHex: "#FFFFFF", productId: 2 },
  { id: 3, name: "Crimson Red", colorHex: "#9B2C2C", productId: 3 },
  { id: 4, name: "Mango Yellow", colorHex: "#ED8936", productId: 4 },
  { id: 6, name: "Sage Green", colorHex: "#2F855A", productId: 6 },
];

export default function ProductInfo({ product }: { product: SareeProduct }) {
  const [quantity, setQuantity] = useState(1);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const getProductDescription = (saree: SareeProduct) => {
    switch (saree.fabric) {
      case "Cotton":
        return "Expertly handwoven with premium long-staple organic cotton threads, this saree offers exceptional breathability and a pre-softened drape. The subtle gold zari border features traditional geometric motifs, making it a classic choice that balances daily comfort with celebratory elegance.";
      case "Silk":
        return "An exceptional masterpiece of premium craftsmanship. Woven with luxurious tissue silk threads, this saree features a rich, fluid texture that catches the light beautifully. The grand gold swan (arayannam) zari embroidery along the border frames the drape in absolute sophistication.";
      case "Mul Cotton":
        return "Designed for weightless, breezy comfort. Crafted using premium fine mul cotton fibers, this saree is pre-washed to offer an incredibly soft feel right out of the box. Its minimalist gold-line borders and pastel tones are perfect for creating an effortless, modern everyday look.";
      default:
        return "A beautiful signature piece from the thiraala collection. Handwoven by master artisan weavers in traditional Kerala loom communities, this saree balances soft, lightweight comfort with a classic minimalist aesthetic. Pre-washed to ensure a natural, fluid drape from the very first wear.";
    }
  };

  return (
    <div className="lg:col-span-5 space-y-6">
      {/* Category, Item Code & Share Link */}
      <div className="flex items-center justify-between text-xs font-semibold text-[#0c2b1c]/60 uppercase tracking-widest">
        <span>Item No: S-{1000 + product.id}</span>
        <span className="text-[#DAA87C]">In Stock</span>
      </div>

      {/* Saree Name */}
      <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight leading-tight select-none">
        {product.name}
      </h1>

      {/* Product Star Rating */}
      <div className="flex items-center gap-2">
        <div className="flex text-[#DAA87C]">
          {"★".repeat(5)}
        </div>
        <span className="text-xs font-bold text-[#1E3A2C]/70 mt-0.5">
          4.8 (85 verified reviews)
        </span>
      </div>

      {/* Pricing Display */}
      <div className="py-2 border-y border-[#1E3A2C]/10">
        <span className="text-3xl font-extrabold text-[#0c2b1c]">
          {product.price}
        </span>
        <span className="text-xs text-[#1E3A2C]/50 block mt-1">
          Inclusive of all taxes. Free delivery across India.
        </span>
      </div>

      {/* Short Description */}
      <p className="text-[#1E3A2C]/80 text-sm sm:text-base leading-relaxed font-normal">
        {getProductDescription(product)}
      </p>

      {/* Color Variants Section */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-[#1E3A2C] uppercase tracking-widest">
          Colors Variants:
        </h4>
        <div className="flex items-center justify-start gap-2">
          {colorVariants.map((color) => {
            const isActive = color.productId === product.id;
            return (
              <Link
                key={color.id}
                href={`/products/${color.productId}`}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${isActive
                    ? "bg-[#1E3A2C]/5 border-[#1E3A2C] text-[#1E3A2C]"
                    : "border-stone-200 text-[#1E3A2C]/70 hover:border-[#DAA87C] hover:text-[#1E3A2C]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-4 h-4 rounded-full border border-[#1E3A2C]/15 block shadow-inner"
                    style={{ backgroundColor: color.colorHex }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Specifications Accordion */}
      <div className="pt-6 border-t border-[#1E3A2C]/10 space-y-2">
        <button
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className="w-full flex items-center justify-between py-2 text-left cursor-pointer focus:outline-none"
        >
          <span className="text-xs font-bold text-[#1E3A2C] uppercase tracking-widest">
            Saree Specifications
          </span>
          <svg
            className={`w-4 h-4 text-[#1E3A2C] transition-transform duration-300 ${
              isAccordionOpen ? "rotate-180" : "rotate-0"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isAccordionOpen && (
          <div className="grid grid-cols-2 gap-y-4 text-xs font-semibold text-[#1E3A2C]/80 pt-2 transition-all duration-300">
            <div className="text-[#1E3A2C]/50 uppercase tracking-wider">Category</div>
            <div>{product.category}</div>
            <div className="text-[#1E3A2C]/50 uppercase tracking-wider">Fabric</div>
            <div>100% Handloom {product.fabric}</div>
            <div className="text-[#1E3A2C]/50 uppercase tracking-wider">Length</div>
            <div>6.2 Metres (includes blouse piece)</div>
            <div className="text-[#1E3A2C]/50 uppercase tracking-wider">Care</div>
            <div>Gentle handwash / Dry clean recommended</div>
          </div>
        )}
      </div>
      {/* Quantity Selector & Add to Cart Counter */}
      <div className="flex items-center gap-4 pt-4 max-w-[200px]">
        <button className="flex-1 h-12 rounded-full font-bold text-xs tracking-wider uppercase bg-[#1E3A2C] text-[#fcfbfa] hover:bg-[#0c2b1c] transition-colors shadow-md shadow-[#1E3A2C]/10 cursor-pointer">
          Add to Cart
        </button>
      </div>

    </div>
  );
}
