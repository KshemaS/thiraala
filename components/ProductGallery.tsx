"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { SareeProduct } from "@/data/products";

const getImgSrc = (img: any): string => {
  if (!img) return "/images/folded-gopuram.jpeg";
  if (typeof img === "string") return img;
  return img.src || "/images/folded-gopuram.jpeg";
};

export default function ProductGallery({ product }: { product: SareeProduct }) {
  const [activeImage, setActiveImage] = useState(product.wornImg);

  // Sync active image when product changes
  useEffect(() => {
    setActiveImage(product.wornImg);
  }, [product]);

  const wornSrc = getImgSrc(product.wornImg);
  const foldedSrc = getImgSrc(product.foldedImg);
  const activeSrc = getImgSrc(activeImage);

  return (
    <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4 w-full">
      {/* Vertical Stack of Thumbnails */}
      <div className="flex flex-row sm:flex-col gap-3 sm:w-24 w-full flex-shrink-0">
        <button
          onClick={() => setActiveImage(product.wornImg)}
          className={`relative aspect-[4/5] sm:w-24 w-1/2 rounded-xl overflow-hidden border-2 bg-stone-50 transition-all cursor-pointer ${
            activeImage === product.wornImg ? "border-[#DAA87C]" : "border-[#1E3A2C]/10 hover:border-[#DAA87C]/50"
          }`}
          aria-label="View Saree on Model"
        >
          <Image
            src={wornSrc}
            alt={product.altWorn || product.name}
            fill
            sizes="96px"
            className="object-cover pointer-events-none"
            unoptimized={wornSrc.startsWith("data:")}
          />
        </button>
        <button
          onClick={() => setActiveImage(product.foldedImg)}
          className={`relative aspect-[4/5] sm:w-24 w-1/2 rounded-xl overflow-hidden border-2 bg-stone-50 transition-all cursor-pointer ${
            activeImage === product.foldedImg ? "border-[#DAA87C]" : "border-[#1E3A2C]/10 hover:border-[#DAA87C]/50"
          }`}
          aria-label="View Folded Saree Close-up"
        >
          <Image
            src={foldedSrc}
            alt={product.altFolded || product.name}
            fill
            sizes="96px"
            className="object-cover pointer-events-none"
            unoptimized={foldedSrc.startsWith("data:")}
          />
        </button>
      </div>

      {/* Large Main Display Image Container */}
      <div className="flex-1 relative aspect-[4/5] w-full overflow-hidden rounded-[24px] sm:rounded-[32px] border border-[#1E3A2C]/5 bg-stone-50/50 shadow-sm select-none h-[380px] sm:h-[500px] lg:h-[600px]">
        <Image
          src={activeSrc}
          alt={activeImage === product.wornImg ? product.altWorn || product.name : product.altFolded || product.name}
          fill
          sizes="(max-width: 1024px) 100vw, 700px"
          className="object-cover transition-all duration-700 hover:scale-[1.03]"
          priority
          unoptimized={activeSrc.startsWith("data:")}
        />
      </div>
    </div>
  );
}
