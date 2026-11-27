"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { UnifiedProduct } from "@/lib/products";
import type { ProductVariantItem } from "@/lib/productVariants";
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

interface ProductInfoProps {
  /** With a colour selected, `id` is the per-colour cart key and `productId` the product's own id. */
  product: UnifiedProduct & { productId?: number | string; variantId?: string };
  /** Colour variants; the picker is shown only when there are any. */
  variants?: ProductVariantItem[];
  selectedVariantId?: string;
  onSelectVariant?: (variantId: string) => void;
}

export default function ProductInfo({
  product,
  variants = [],
  selectedVariantId,
  onSelectVariant,
}: ProductInfoProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const hasVariants = variants.length > 0;
  const selectedVariant = variants.find((v) => v.id === selectedVariantId);
  const isVariantSoldOut = hasVariants && (selectedVariant?.stock ?? 0) <= 0;
  // Products without colours carry their own stock.
  const isSoldOut = hasVariants
    ? isVariantSoldOut
    : typeof product.stock === "number" && product.stock <= 0;
  const otherColourInStock = hasVariants && variants.some((v) => v.stock > 0);
  const [pincode, setPincode] = useState("");
  const [isCheckingPincode, setIsCheckingPincode] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<PincodeCheckResult | null>(null);

  // The wishlist is per product, not per colour.
  const wishlistProduct = product.productId ? { ...product, id: product.productId } : product;
  const isWishlisted = isInWishlist(wishlistProduct.id);

  // MRP and discount calculations
  const priceVal = product.priceValue || 1499;
  // Only show a strikethrough MRP when one was set and it's above the price.
  const mrpVal = product.mrp && product.mrp > priceVal ? product.mrp : 0;
  const hasMrp = mrpVal > 0;
  const discountPercent = hasMrp ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;

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


  // India Post Delivery check handler
  const handleCheckPincode = async () => {
    const pin = pincode.trim();
    if (!pin || pin.length !== 6 || !/^[1-9]\d{5}$/.test(pin)) {
      setPincodeStatus({
        valid: false,
        message: "Enter a valid 6 digit PIN",
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

  // Buy Now handler: Adds to cart and redirects directly to cart page
  const handleBuyNow = () => {
    if (isSoldOut) return;
    addToCart(product, 1);
    router.push("/cart");
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

      {/* 2. RATINGS BADGE (only when the product has a real rating) */}
      {(product.rating ?? 0) > 0 && (product.ratingCount ?? 0) > 0 && (
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-neutral-300 text-[11px] text-neutral-800 bg-white shadow-2xs font-medium">
            <span className="font-bold">{product.rating}</span>
            <span className="text-[#1E3A2C] text-xs">★</span>
            <span className="text-neutral-300 mx-0.5">|</span>
            <span className="text-neutral-500 font-normal">
              {product.ratingCount} Ratings
            </span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="w-full border-b border-neutral-200" />

      {/* 3. PRICING SECTION */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            {product.price || `₹${priceVal.toLocaleString("en-IN")}`}
          </span>
          {hasMrp && (
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
        {isSoldOut && (
          <p
            role="status"
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {otherColourInStock ? "This colour is out of stock" : "Out of stock"}
          </p>
        )}
      </div>

      {/* 4. MORE COLOURS (Only shown if product has variants) */}
      {hasVariants && (
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
            MORE COLOURS
          </h3>
          <div className="flex items-center gap-2.5 pt-1">
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariantId;
              const thumb = variant.wornImg || variant.foldedImg;
              const soldOut = variant.stock <= 0;
              return (
                <button
                  key={variant.id || variant.sku}
                  type="button"
                  onClick={() => variant.id && onSelectVariant?.(variant.id)}
                  aria-pressed={isSelected}
                  className={`relative w-12 h-16 rounded overflow-hidden transition-all cursor-pointer bg-neutral-100 ${
                    isSelected
                      ? "border-2 border-neutral-900 shadow-xs"
                      : "border border-neutral-200 hover:border-neutral-400 opacity-75 hover:opacity-100"
                  }`}
                  title={soldOut ? `${variant.name} (sold out)` : variant.name}
                >
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={variant.name}
                      fill
                      sizes="48px"
                      className={`object-cover ${soldOut ? "grayscale" : ""}`}
                      unoptimized={thumb.startsWith("data:")}
                    />
                  ) : (
                    <span className="absolute inset-0" style={{ backgroundColor: variant.colorHex || "#e5e5e5" }} />
                  )}
                  {soldOut && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="block w-[140%] h-px bg-neutral-500 rotate-[-55deg]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-neutral-600 pt-0.5">
            Selected: <span className="font-bold text-neutral-900">{selectedVariant?.name}</span>
            {isVariantSoldOut && <span className="ml-2 font-bold text-rose-600">Sold out</span>}
          </p>
        </div>
      )}

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

      {/* 6. ACTION CTAS (ADD TO BAG, BUY NOW & WISHLIST) */}
      <div className="space-y-2 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {isSoldOut ? (
            /* Sold out: one disabled button in place of Add to Bag + Buy Now */
            <button
              type="button"
              disabled
              className="sm:col-span-2 w-full bg-neutral-200 text-neutral-500 border-2 border-neutral-200 text-xs font-bold uppercase tracking-wider py-3.5 px-3 rounded-md flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span>OUT OF STOCK</span>
            </button>
          ) : (
            <>
              {/* ADD TO BAG Button */}
              <button
                type="button"
                onClick={() => addToCart(product, 1)}
                className="w-full bg-white hover:bg-neutral-50 text-[#1E3A2C] border-2 border-[#1E3A2C] text-xs font-bold uppercase tracking-wider py-3.5 px-3 rounded-md flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-[#1E3A2C]" />
                <span>ADD TO BAG</span>
              </button>

              {/* BUY NOW Button */}
              <button
                type="button"
                onClick={handleBuyNow}
                className="w-full bg-[#1E3A2C] hover:bg-[#162e22] text-white text-xs font-bold uppercase tracking-wider py-3.5 px-3 rounded-md flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>BUY NOW</span>
              </button>
            </>
          )}

          {/* WISHLIST Button */}
          <button
            type="button"
            onClick={() => toggleWishlist(wishlistProduct)}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            className={`w-full border text-xs font-bold uppercase tracking-wider py-3.5 px-3 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isWishlisted
                ? "bg-rose-50 border-rose-300 text-rose-600"
                : "bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                isWishlisted ? "fill-rose-500 text-rose-500" : "text-neutral-700"
              }`}
            />
            <span>{isWishlisted ? "WISHLISTED" : "WISHLIST"}</span>
          </button>
        </div>

        {isSoldOut && (
          <p className="text-xs text-neutral-600 text-center sm:text-left">
            {otherColourInStock
              ? "Pick another colour above, or wishlist this one to find it again later."
              : "Add it to your wishlist to find it again when it's back."}
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
              {pincodeStatus.message}
            </p>
          </div>
        )}

        {/* Feature list - hidden when an invalid pincode is checked */}
        {(!pincodeStatus || pincodeStatus.valid) && (
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
        )}
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
          {hasMrp && discountPercent > 0 && (
            <li className="flex items-start gap-2">
              <span className="text-neutral-400">•</span>
              <span>
                Flat {discountPercent}% off on MRP of ₹{mrpVal.toLocaleString("en-IN")}, already applied
              </span>
            </li>
          )}
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
          <p className="text-xs text-neutral-700">{product.fabric || "Kerala Cotton"}</p>
          <p className="text-xs text-neutral-700 mt-1">
            {product.careInstructions && !product.careInstructions.includes("[confirm care instructions]")
              ? product.careInstructions
              : "Dry clean recommended for first wash. Gentle hand wash in cold water with mild detergent thereafter. Dry in shade."}
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
                  {product.fabric || "Kerala Cotton"}
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
                  {product.sareeFabric || product.fabric || "Kerala Cotton"}
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
