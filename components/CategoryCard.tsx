"use client";

import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { useWishlist } from "@/context/WishlistContext";

export interface CategoryProduct {
  id: number;
  name: string;
  price: string;
  foldedImg?: StaticImageData;
  wornImg?: StaticImageData;
  img?: StaticImageData;
  altFolded?: string;
  altWorn?: string;
  alt?: string;
}

interface CategoryCardProps {
  product: CategoryProduct;
  actionLabel?: string;
}

export default function CategoryCard({ product, actionLabel = "Shop Now" }: CategoryCardProps) {
  // Gracefully resolve image source
  const imageSrc = product.img || product.wornImg || product.foldedImg;
  const imageAlt = product.alt || product.altWorn || product.altFolded || product.name;

  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      foldedImg: product.foldedImg || imageSrc,
      wornImg: product.wornImg || imageSrc,
      altFolded: product.altFolded || imageAlt,
      altWorn: product.altWorn || imageAlt,
    });
  };

  return (
    <Link href={`/products/${product.id}`} className="group flex flex-col justify-between bg-white rounded-2xl border border-[#1E3A2C]/5 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full">
      {/* Square Image Container with Zoom Hover Effect */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#fbfaf8]">
        {/* Wishlist Toggle Button */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/85 hover:bg-white text-[#1E3A2C]/80 hover:text-red-500 transition-all duration-300 shadow-md backdrop-blur-xs flex items-center justify-center cursor-pointer group/wishlist active:scale-90"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 group-hover/wishlist:scale-110 ${
              isWishlisted ? "fill-red-500 stroke-red-500 text-red-500" : "fill-none stroke-current"
            }`}
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        {imageSrc && (
          <Image
            src={imageSrc.src || imageSrc}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
          />
        )}
      </div>

      {/* Information Block */}
      <div className="p-5 flex flex-col justify-between flex-1 border-t border-[#1E3A2C]/5">
        <div>
          <h3 className="text-[#1E3A2C] font-bold text-base tracking-tight group-hover:text-[#0c2b1c] transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-[#1E3A2C]/40 text-xs mt-1">Lightweight, comfortable, and easy to drape</p>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-[#0c2b1c]">
            {product.price}
          </span>
          
          <span className="text-[11px] font-bold text-[#1E3A2C] group-hover:text-[#0c2b1c] flex items-center gap-1 transition-colors">
            {actionLabel}
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
