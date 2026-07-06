"use client";

import Image, { StaticImageData } from "next/image";

export interface SareeProduct {
  id: number;
  name: string;
  price: string;
  foldedImg: StaticImageData;
  wornImg: StaticImageData;
  altFolded: string;
  altWorn: string;
  category?: string;
  priority?: boolean;
}

interface ProductCardProps {
  saree: SareeProduct;
}

export default function ProductCard({ saree }: ProductCardProps) {
  return (
    <div className="group flex flex-col justify-between bg-white rounded-2xl border border-[#1E3A2C]/5 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
      {/* Image Container with Cross-Fade Hover Effect */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#fbfaf8]">
        {/* Folded Saree (Initially shown) */}
        <Image
          src={saree.foldedImg.src}
          alt={saree.altFolded}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-all duration-500 group-hover:opacity-0 group-hover:scale-105 pointer-events-none"
          priority={saree.priority}
        />
        
        {/* Worn Saree (Shown on hover) */}
        <Image
          src={saree.wornImg.src}
          alt={saree.altWorn}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="absolute inset-0 object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-105 pointer-events-none"
        />
      </div>

      {/* Information Block */}
      <div className="p-5 flex flex-col justify-between flex-1 border-t border-[#1E3A2C]/5">
        <div>
          <h3 className="text-[#1E3A2C] font-bold text-base tracking-tight group-hover:text-[#0c2b1c] transition-colors duration-200">
            {saree.name}
          </h3>
          <p className="text-[#1E3A2C]/50 text-xs mt-1">Free Delivery & Cash on Delivery Available</p>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-[#0c2b1c]">
            {saree.price}
          </span>
          
          <button className="text-[11px] font-bold text-[#1E3A2C] group-hover:text-[#0c2b1c] flex items-center gap-1 transition-colors cursor-pointer">
            Quick View
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
