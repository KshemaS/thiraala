"use client";

import Image from "next/image";
import Link from "next/link";
import { m } from "framer-motion";
import Container from "@/components/Container";
import type { FilteredProduct } from "@/app/api/products/filter/route";


/** Best-selling products, loaded on the server with the page (lib/homeData.ts). */
export default function BestSellers({ items }: { items: FilteredProduct[] }) {

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 45, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const leftVariant = {
    hidden: { y: 40, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const rightVariant = {
    hidden: { y: 40, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const centerVariant = {
    hidden: { y: 40, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  if (items.length === 0) return null;

  return (
    <section className="w-full mb-[140px] select-none overflow-hidden">
      <Container>
        <m.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="space-y-16"
        >
          {/* Centered Heading and Description */}
          <m.div className="text-center max-w-2xl mx-auto" variants={itemVariants}>
            <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
              Best Sellers
            </h2>
            <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed font-normal">
              The pieces our community loves the most. Hand-selected for their exceptional quality, comfort, and timeless beauty.
            </p>
          </m.div>

          {/* Grid listing section using unique Arch Card style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 sm:gap-4">
            {items.map((saree, idx) => {
              const col = idx % 4;
              const cardVariant = col === 0 ? leftVariant : col === 3 ? rightVariant : centerVariant;
              const wornSrc = saree.wornImg || saree.foldedImg || "/images/no-photo.svg";
              const altText = saree.altWorn || saree.name;

              return (
                <m.div
                  key={saree.id}
                  variants={cardVariant}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                  className="group flex flex-col items-center bg-transparent overflow-hidden"
                >
                  <Link href={`/products/${saree.id}`} className="w-full h-full flex flex-col items-center bg-transparent">
                    {/* Arch-Shaped Image Container with Shadow */}
                    <div className="relative aspect-[2/3] w-[85%] sm:w-[100%] mx-auto overflow-hidden rounded-t-full shadow-md border border-[#1E3A2C]/5 bg-[#fbfaf8] transition-shadow duration-300 group-hover:shadow-lg">
                      <Image
                        src={wornSrc}
                        alt={altText}
                        fill
                        sizes="(max-width: 768px) 80vw, (max-width: 1024px) 40vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                      />
                    </div>

                    {/* Details Below */}
                    <div className="mt-6 text-center flex flex-col items-center">
                      <span className="text-[10px] font-bold tracking-widest text-[#0c2b1c]/60 uppercase mb-1">
                        Bestseller
                      </span>
                      <h3 className="text-[#1E3A2C] font-bold text-lg tracking-tight group-hover:text-[#0c2b1c] transition-colors duration-200">
                        {saree.name}
                      </h3>
                      <span className="text-base font-bold text-[#0c2b1c] mt-1.5">
                        {saree.price}
                      </span>

                      <span className="text-[11px] font-bold text-[#1E3A2C] group-hover:text-[#0c2b1c] flex items-center gap-1 mt-3 transition-colors border-b border-[#1E3A2C]/20 hover:border-[#0c2b1c] pb-0.5">
                        View Collection
                        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </m.div>
              );
            })}
          </div>
        </m.div>
      </Container>
    </section>
  );
}
