"use client";

import { useState } from "react";
import Image from "next/image";
import { SareeProduct } from "@/data/products";
import { UnifiedProduct } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ShoppingBag, Heart, Truck, CheckCircle2, AlertCircle, MapPin, Loader2 } from "lucide-react";

export interface PincodeCheckResult {
  valid: boolean;
  message: string;
  carrier?: string;
  location?: string;
  postOffice?: string;
  district?: string;
  state?: string;
  estimatedDays?: string;
  estimatedDate?: string;
  hasDirectDelivery?: boolean;
}

export default function ProductInfo({ product }: { product: SareeProduct | UnifiedProduct | any }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // State
  const [selectedColor, setSelectedColor] = useState<string>(
    product.selectedColor || product.color || "Wine Lily"
  );
  const [pincode, setPincode] = useState("");
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<PincodeCheckResult | null>(null);
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

  // India Post Delivery check handler
  const handleCheckPincode = async () => {
    const pin = pincode.trim();
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setPincodeStatus({
        valid: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      });
      return;
    }

    setIsCheckingPincode(true);
    try {
      const res = await fetch(`/api/pincode/check?pincode=${pin}`);
      const data = await res.json();

      if (data.available) {
        setPincodeStatus({
          valid: true,
          message: data.message,
          carrier: data.carrier || "India Post (Speed Post)",
          location: data.location,
          postOffice: data.postOffice,
          district: data.district,
          state: data.state,
          estimatedDays: data.estimatedDays,
          estimatedDate: data.estimatedDate,
          hasDirectDelivery: data.hasDirectDelivery !== false,
        });
      } else {
        setPincodeStatus({
          valid: false,
          message: "Delivery Unavailable",
        });
      }
    } catch (err) {
      console.error("Failed to check pincode:", err);
      setPincodeStatus({
        valid: false,
        message: "Delivery Unavailable",
      });
    } finally {
      setIsCheckingPincode(false);
    }
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

      {/* 7. DELIVERY & INDIA POST PINCODE CHECK */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#1E3A2C]" />
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              DELIVERY OPTIONS
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#b45309] bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
            India Post Service
          </span>
        </div>

        <div className="flex items-center max-w-sm rounded-lg border border-neutral-300 px-3 py-2 bg-white focus-within:border-[#1E3A2C] focus-within:ring-1 focus-within:ring-[#1E3A2C]/20 transition-all shadow-xs">
          <MapPin className="w-4 h-4 text-neutral-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCheckPincode();
              }
            }}
            placeholder="Enter 6-digit PIN code"
            className="w-full text-xs text-neutral-900 focus:outline-none placeholder:text-neutral-400 font-medium tracking-wide"
          />
          <button
            type="button"
            onClick={handleCheckPincode}
            disabled={isCheckingPincode}
            className="text-xs font-bold text-[#b45309] hover:text-[#92400e] disabled:opacity-50 cursor-pointer pl-3 flex-shrink-0 flex items-center gap-1.5 transition-colors"
          >
            {isCheckingPincode ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Checking...</span>
              </>
            ) : pincodeStatus?.valid ? (
              "Change"
            ) : (
              "Check"
            )}
          </button>
        </div>

        {/* Status result card */}
        {pincodeStatus && (
          <div
            className={`px-3 py-2.5 rounded-lg border text-xs flex items-center gap-2.5 transition-all ${
              pincodeStatus.valid
                ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-950"
                : "bg-rose-50/70 border-rose-200/80 text-rose-950"
            }`}
          >
            {pincodeStatus.valid ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <p className="font-semibold text-[13px]">
              {pincodeStatus.valid ? "Delivery Available" : "Delivery Unavailable"}
            </p>
          </div>
        )}

        {/* Feature list */}
        <div className="space-y-1.5 pt-1 text-xs text-neutral-600">
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A2C]/60" />
            <span>Delivered via <strong>India Post Speed Post & Parcel</strong> service</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A2C]/60" />
            <span>Expected in 2–4 days across Kerala, 4–7 days all-India</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A2C]/60" />
            <span>Real-time India Post tracking ID shared after dispatch</span>
          </p>
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
