"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { m } from "framer-motion";
import Container from "@/components/Container";
import type { FilteredProduct } from "@/app/api/products/filter/route";


/** Newest products, loaded on the server with the page (lib/homeData.ts). */
export default function NewArrivals({ items }: { items: FilteredProduct[] }) {
  const [visibleSlides, setVisibleSlides] = useState(3);
  const [slideIndex, setSlideIndex] = useState(0);

  // Monitor screen size dynamically to determine active slide counts
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleSlides(1);
      } else if (window.innerWidth < 1024) {
        setVisibleSlides(2);
      } else {
        setVisibleSlides(3);
      }
    };
    
    handleResize(); // Initial count check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, items.length - visibleSlides);
  // Kept in range when a resize shows more cards at once.
  const currentIndex = Math.min(slideIndex, maxIndex);

  const nextSlide = () => {
    if (currentIndex < maxIndex) setSlideIndex(currentIndex + 1);
  };

  const prevSlide = () => {
    if (currentIndex > 0) setSlideIndex(currentIndex - 1);
  };

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
              New Arrivals
            </h2>
            <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
              Be the first to explore our latest weaves fresh off the looms. Discover timeless designs reinvented for modern celebrations.
            </p>
          </m.div>

          {/* Slick-like Slider Container */}
          <div className="relative w-full px-2 sm:px-6 md:px-12">
            {/* Prev Navigation Button */}
            <button
              type="button"
              onClick={prevSlide}
              className={`absolute left-0 sm:left-1 md:left-0 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full btn-animate-border-circle flex items-center justify-center text-[#1E3A2C] hover:text-white cursor-pointer z-20 shadow-sm [--btn-bg:#ffffff] [--btn-hover-bg:#1E3A2C] ${
                currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100"
              }`}
              disabled={currentIndex === 0}
              aria-label="Previous Slide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Main Slider Viewport wrapper */}
            <div className="overflow-hidden w-full rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / visibleSlides)}%)`,
                }}
              >
                {items.map((saree, idx) => {
                  const col = idx % 3;
                  const cardVariant = col === 0 ? leftVariant : col === 2 ? rightVariant : centerVariant;
                  const imgSrc = saree.img || saree.wornImg || saree.foldedImg || "/images/no-photo.svg";
                  const imgAlt = saree.altWorn || saree.name;

                  return (
                    <m.div
                      key={saree.id}
                      variants={cardVariant}
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.25 }}
                      className="w-full md:w-1/2 lg:w-1/3 p-3 flex-shrink-0"
                    >
                      <Link href={`/products/${saree.id}`} className="block w-full h-full">
                        {/* Saree Card (Full-width bg image style with overlay text) */}
                        <div className="group relative aspect-[4/5] w-full rounded-2xl border border-[#1E3A2C]/5 overflow-hidden shadow-md cursor-pointer">
                          {/* Background Saree Image */}
                          <Image
                            src={imgSrc}
                            alt={imgAlt}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                          />

                          {/* Soft Legibility Vignette Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-all duration-300 group-hover:from-black/90 pointer-events-none" />

                          {/* Overlaid metadata text at bottom */}
                          <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col justify-end transition-all duration-300 transform group-hover:translate-y-[-4px]">
                            <span className="text-[10px] font-bold tracking-widest text-[#DAA87C]/95 uppercase mb-1">
                              New Arrival
                            </span>
                            <h3 className="font-bold text-lg md:text-xl tracking-tight leading-snug">
                              {saree.name}
                            </h3>
                            
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-base font-bold text-[#DAA87C]">
                                {saree.price}
                              </span>
                              
                              <span className="text-[10px] font-bold tracking-wider uppercase text-white/80 border-b border-white/20 pb-0.5 group-hover:text-white group-hover:border-white transition-colors">
                                Shop Now
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </m.div>
                  );
                })}
              </div>
            </div>

            {/* Next Navigation Button */}
            <button
              type="button"
              onClick={nextSlide}
              className={`absolute right-0 sm:right-1 md:right-0 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full btn-animate-border-circle flex items-center justify-center text-[#1E3A2C] hover:text-white cursor-pointer z-20 shadow-sm [--btn-bg:#ffffff] [--btn-hover-bg:#1E3A2C] ${
                currentIndex >= maxIndex ? "opacity-30 cursor-not-allowed" : "opacity-100"
              }`}
              disabled={currentIndex >= maxIndex}
              aria-label="Next Slide"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </m.div>
      </Container>
    </section>
  );
}
