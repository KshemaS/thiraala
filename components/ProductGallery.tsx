"use client";

import { useState } from "react";
import Image from "next/image";
import type { SareeProduct } from "@/data/products";
import type { UnifiedProduct } from "@/lib/products";
import { NO_PHOTO, photoSrc } from "@/lib/placeholder";

const getImgSrc = (img: unknown): string => photoSrc(img);

export default function ProductGallery({ product }: { product: SareeProduct | UnifiedProduct }) {
  // The photo the shopper clicked, remembered per product: picking another
  // colour (a new product object) goes back to its worn photo.
  type Photo = typeof product.wornImg;
  const [picked, setPicked] = useState<{ product: typeof product; img: Photo } | null>(null);
  const activeImage = picked && picked.product === product ? picked.img : product.wornImg;
  const setActiveImage = (img: Photo) => setPicked({ product, img });

  const wornSrc = getImgSrc(product.wornImg);
  const foldedSrc = getImgSrc(product.foldedImg);
  const activeSrc = getImgSrc(activeImage);
  const noPhotos = wornSrc === NO_PHOTO && foldedSrc === NO_PHOTO;

  return (
    <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4 w-full lg:sticky lg:top-24 self-start">
      {/* Vertical Stack of Thumbnails (none when there are no photos) */}
      <div className={`flex flex-row sm:flex-col gap-3 sm:w-24 w-full flex-shrink-0 ${noPhotos ? "hidden" : ""}`}>
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
          alt={
            activeSrc === NO_PHOTO
              ? `No photo of ${product.name} yet`
              : activeImage === product.wornImg
                ? product.altWorn || product.name
                : product.altFolded || product.name
          }
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
