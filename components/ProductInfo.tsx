"use client";

import { useState } from "react";
import Image from "next/image";
import { SareeProduct } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ShoppingBag, Heart, Truck } from "lucide-react";

export default function ProductInfo({ product }: { product: SareeProduct }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // State
  const [selectedColor, setSelectedColor] = useState<string>(
    product.selectedColor || product.color || "Wine Lily"
  );
  const [pincode, setPincode] = useState("");
  const [pincodeStatus, setPincodeStatus] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [buyNowNotice, setBuyNowNotice] = useState<string | null>(null);

  const isWishlisted = isInWishlist(product.id);

  // MRP and discount calculations
  const priceVal = product.priceValue || 1499;
  const mrpVal = product.mrp || 4997;
  const discountPercent =
    mrpVal > priceVal
      ? Math.round(((mrpVal - priceVal) / mrpVal) * 100)
      : product.discountPercent || 70;

  // Highlights list
  const defaultHighlights = [
    "Off-white saree with painted lily motifs",
    "Contrast wine border on both edges",
    "Comes with a matching blouse piece",
  ];

  const highlightsList: string[] = product.highlights
    ? Array.isArray(product.highlights)
      ? product.highlights
      : product.highlights.split("\n").filter(Boolean)
    : defaultHighlights;

  // Description fallback
  const descriptionText =
    product.description ||
    "An off-white Kerala cotton saree with deep wine lilies painted across the pallu and pleats, framed by a slim contrast border. Light enough for long festive days, rooted in the coast it comes from.";

  // Color variants gallery
  const colorVariantsList = [
    {
      name: "Wine Lily",
      img: typeof product.wornImg === "string" ? product.wornImg : "/images/gopura.jpeg",
    },
    {
      name: "Pink Lily",
      img: typeof product.foldedImg === "string" ? product.foldedImg : "/images/folded-gopuram.jpeg",
    },
    {
      name: "Meadow Green",
      img: typeof product.wornImg === "string" ? product.wornImg : "/images/gopura.jpeg",
    },
  ];

  // Delivery check handler
  const handleCheckPincode = () => {
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setPincodeStatus({
        valid: false,
        message: "Please enter a valid 6-digit Kerala pincode.",
      });
      return;
    }
    setPincodeStatus({
      valid: true,
      message: `Delivery available to ${pincode}! Expected delivery within 2-3 business days.`,
    });
  };

  // Buy Now handler
  const handleBuyNow = () => {
    addToCart(product, 1);
    setBuyNowNotice("Added to bag! Proceeding to checkout...");
    setTimeout(() => {
      setBuyNowNotice(null);
    }, 2500);
  };

  return (
    <div className="lg:col-span-5 space-y-6 text-[#1E3A2C]">
      {/* 1. PRODUCT NAME (Replaced "THIRAALA" with product name as requested) */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-wide uppercase text-[#1E3A2C] leading-tight">
          {product.name}
        </h1>
        {/* Subtitle / Tagline */}
        <p className="text-xs sm:text-sm text-[#1E3A2C]/80 mt-1 font-normal leading-relaxed">
          {product.subtitle || `${product.name} with Blouse Piece`}
        </p>
      </div>

      {/* 2. RATINGS BADGE */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-300 text-[11px] text-neutral-800 bg-white shadow-2xs font-medium">
          <span className="font-bold">{product.rating ?? 4.8}</span>
          <span className="text-[#1E3A2C] text-xs">★</span>
          <span className="text-neutral-300 mx-0.5">|</span>
          <span className="text-neutral-500 font-normal">
            {product.ratingCount ?? 85} Ratings
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-b border-neutral-200" />

      {/* 3. PRICING SECTION */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            {product.price || `₹${priceVal.toLocaleString("en-IN")}`}
          </span>
          {mrpVal > 0 && (
            <span className="text-neutral-400 text-sm font-normal line-through">
              MRP ₹{mrpVal.toLocaleString("en-IN")}
            </span>
          )}
          {discountPercent > 0 && (
            <span className="text-[#b45309] text-sm font-bold">
              ({discountPercent}% OFF)
            </span>
          )}
        </div>
        <p className="text-emerald-700 text-xs font-semibold">
          inclusive of all taxes
        </p>
      </div>

      {/* 4. MORE COLOURS */}
      <div className="space-y-2 pt-1">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
          MORE COLOURS
        </h3>
        <div className="flex items-center gap-2.5 pt-1">
          {colorVariantsList.map((variant, idx) => {
            const isSelected = selectedColor.toLowerCase() === variant.name.toLowerCase();
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedColor(variant.name)}
                className={`relative w-12 h-16 rounded overflow-hidden transition-all cursor-pointer bg-neutral-100 ${isSelected
                    ? "border-2 border-neutral-900 shadow-xs"
                    : "border border-neutral-200 hover:border-neutral-400 opacity-75 hover:opacity-100"
                  }`}
                title={variant.name}
              >
                <Image
                  src={variant.img}
                  alt={variant.name}
                  fill
                  className="object-cover"
                  unoptimized={typeof variant.img === "string" && variant.img.startsWith("data:")}
                />
              </button>
            );
          })}
        </div>
        <p className="text-xs text-neutral-600 pt-0.5">
          Selected: <span className="font-bold text-neutral-900">{selectedColor}</span>
        </p>
      </div>

      {/* 5. SELECT SIZE */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-6 py-2 rounded-full border-2 border-[#1E3A2C] text-[#1E3A2C] text-xs font-bold bg-[#1E3A2C]/5 transition-colors"
          >
            Onesize
          </button>
        </div>
      </div>

      {/* 6. ACTION CTAS (BUY NOW & WISHLIST) */}
      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* BUY NOW Button */}
          <button
            type="button"
            onClick={handleBuyNow}
            className="w-full bg-[#1E3A2C] hover:bg-[#162e22] text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-md flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>BUY NOW • {product.price || `₹${priceVal.toLocaleString("en-IN")}`}</span>
          </button>

          {/* WISHLIST Button */}
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`w-full border text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${isWishlisted
                ? "bg-rose-50 border-rose-300 text-rose-600"
                : "bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50"
              }`}
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-neutral-700"
                }`}
            />
            <span>{isWishlisted ? "WISHLISTED" : "WISHLIST"}</span>
          </button>
        </div>

        {buyNowNotice && (
          <p className="text-xs text-emerald-700 font-semibold text-center animate-fade-in">
            {buyNowNotice}
          </p>
        )}
      </div>

      {/* Divider */}
      <div className="w-full border-b border-neutral-200" />

      {/* 7. DELIVERY OPTIONS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            DELIVERY OPTIONS
          </span>
          <Truck className="w-4 h-4 text-neutral-800" />
        </div>

        <div className="flex items-center max-w-xs rounded border border-neutral-300 px-3 py-2 bg-white focus-within:border-neutral-800 transition-colors">
          <input
            type="text"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Enter pincode"
            className="w-full text-xs text-neutral-900 focus:outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            onClick={handleCheckPincode}
            className="text-xs font-bold text-[#b45309] hover:text-[#92400e] cursor-pointer pl-3 flex-shrink-0"
          >
            Check
          </button>
        </div>

        {pincodeStatus && (
          <p
            className={`text-xs font-medium ${pincodeStatus.valid ? "text-emerald-700" : "text-rose-600"
              }`}
          >
            {pincodeStatus.message}
          </p>
        )}

        <p className="text-[11px] text-neutral-500">
          We deliver across Kerala. Enter your pincode to check.
        </p>

        <div className="space-y-1.5 pt-1 text-xs text-neutral-600">
          <p>100% original Thiraala products</p>
          <p>Delivery available across all of Kerala</p>
          <p>Easy returns and exchanges available</p>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-b border-neutral-200" />

      {/* 8. BEST OFFERS */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
          BEST OFFERS
        </h3>
        <p className="text-xs font-bold text-neutral-900">
          Best Price: {product.price || `₹${priceVal.toLocaleString("en-IN")}`}
        </p>
        <ul className="space-y-1.5 text-xs text-neutral-600">
          <li className="flex items-start gap-2">
            <span className="text-neutral-400">•</span>
            <span>
              Flat {discountPercent}% off on MRP of ₹{mrpVal.toLocaleString("en-IN")}, already applied
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-neutral-400">•</span>
            <span>Pay securely online via Razorpay (UPI, cards, net banking)</span>
          </li>
        </ul>
      </div>

      {/* Divider */}
      <div className="w-full border-b border-neutral-200" />

      {/* 9. PRODUCT DETAILS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
          PRODUCT DETAILS
        </h3>
        <p className="text-xs sm:text-sm text-neutral-700 leading-relaxed font-normal">
          {descriptionText}
        </p>

        {highlightsList.length > 0 && (
          <ul className="space-y-1.5 text-xs text-neutral-700">
            {highlightsList.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-neutral-400">•</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Size & Fit */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-neutral-900 mb-1">Size & Fit</h4>
          <p className="text-xs text-neutral-700">
            Saree length: {product.sareeLength || "5.5 metres"} · Blouse piece:{" "}
            {product.blouseLength || "0.8 metres"}
          </p>
        </div>

        {/* Material & Care */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-neutral-900 mb-1">Material & Care</h4>
          <p className="text-xs text-neutral-700">{product.fabric || "Cotton"}</p>
          <p className="text-xs text-neutral-700">
            {product.careInstructions || "Care: [confirm care instructions]"}
          </p>
        </div>

        {/* Specifications Table */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-neutral-900 mb-3">Specifications</h4>
          <div className="grid grid-cols-2 gap-x-8 text-xs">
            {/* Column 1 */}
            <div>
              <div className="border-b border-neutral-200 pb-2 mb-2">
                <span className="text-[11px] text-neutral-400 block font-normal">Fabric</span>
                <span className="text-neutral-900 font-medium block mt-0.5">
                  {product.fabric || "Cotton"}
                </span>
              </div>
              <div className="border-b border-neutral-200 pb-2 mb-2">
                <span className="text-[11px] text-neutral-400 block font-normal">
                  Print or Pattern
                </span>
                <span className="text-neutral-900 font-medium block mt-0.5">
                  {product.pattern || "Floral"}
                </span>
              </div>
              <div className="border-b border-neutral-200 pb-2 mb-2">
                <span className="text-[11px] text-neutral-400 block font-normal">Blouse</span>
                <span className="text-neutral-900 font-medium block mt-0.5">
                  {product.blouse || "Running blouse"}
                </span>
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <div className="border-b border-neutral-200 pb-2 mb-2">
                <span className="text-[11px] text-neutral-400 block font-normal">
                  Saree Fabric
                </span>
                <span className="text-neutral-900 font-medium block mt-0.5">
                  {product.sareeFabric || "Kerala Cotton"}
                </span>
              </div>
              <div className="border-b border-neutral-200 pb-2 mb-2">
                <span className="text-[11px] text-neutral-400 block font-normal">Border</span>
                <span className="text-neutral-900 font-medium block mt-0.5">
                  {product.border || "Solid"}
                </span>
              </div>
              <div className="border-b border-neutral-200 pb-2 mb-2">
                <span className="text-[11px] text-neutral-400 block font-normal">Occasion</span>
                <span className="text-neutral-900 font-medium block mt-0.5">
                  {product.occasion || "Festive"}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-neutral-600 mt-4">
            Product code: <span className="font-bold text-neutral-900">{product.sku || "THR-XXXX"}</span>
          </p>
        </div>
      </div>

    </div>
  );
}
