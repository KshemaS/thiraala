"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// Import all saree assets statically to align with workspace practices
import kshe from "@/public/images/kshe.jpeg";
import honey from "@/public/images/honey.jpeg";
import swa from "@/public/images/swa.jpeg";
import arayannam from "@/public/images/arayannam.jpeg";
import gopura from "@/public/images/gopura.jpeg";
import mambazham from "@/public/images/mambazham.jpeg";

const newArrivals = [
  {
    id: 601,
    name: "Avanthika Silk Kasavu",
    price: "₹3,250",
    img: kshe,
    alt: "Avanthika silk Kasavu saree with gold zari detail",
  },
  {
    id: 602,
    name: "Mayilpeeli Designer Saree",
    price: "₹2,950",
    img: swa,
    alt: "Mayilpeeli designer saree with peacock motif weave",
  },
  {
    id: 603,
    name: "Athira Weave Special",
    price: "₹2,400",
    img: honey,
    alt: "Athira weave cotton daily wear saree",
  },
  {
    id: 604,
    name: "Vrindavan Border Cotton",
    price: "₹1,850",
    img: arayannam,
    alt: "Vrindavan border cotton lightweight saree",
  },
  {
    id: 605,
    name: "Haritha Floral Weave",
    price: "₹2,200",
    img: gopura,
    alt: "Haritha floral motif designer green gold border saree",
  },
  {
    id: 606,
    name: "Kanaka Gold Tissue",
    price: "₹3,600",
    img: mambazham,
    alt: "Kanaka gold tissue silk traditional set saree",
  },
];

export default function NewArrivals() {
  const [visibleSlides, setVisibleSlides] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const maxIndex = Math.max(0, newArrivals.length - visibleSlides);

  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Adjust slides viewport positioning if container resize forces index bounds out-of-range
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  return (
    <section className="w-full mb-[140px] max-w-7xl mx-auto px-6 lg:px-12 select-none overflow-hidden">
      {/* Centered Heading and Description */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
          New Arrivals
        </h2>
        <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
        <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
          Be the first to explore our latest weaves fresh off the looms. Discover timeless designs reinvented for modern celebrations.
        </p>
      </div>

      {/* Slick-like Slider Container */}
      <div className="relative w-full px-4 md:px-12">
        {/* Prev Navigation Button */}
        <button
          onClick={prevSlide}
          className={`absolute left-[-10px] md:left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full btn-animate-border-circle flex items-center justify-center text-[#1E3A2C] hover:text-white cursor-pointer z-20 shadow-sm [--btn-bg:#ffffff] [--btn-hover-bg:#1E3A2C] ${
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
            {newArrivals.map((saree) => (
              <div
                key={saree.id}
                className="w-full md:w-1/2 lg:w-1/3 p-3 flex-shrink-0"
              >
                {/* Saree Card (Full-width bg image style with overlay text) */}
                <div className="group relative aspect-[4/5] w-full rounded-2xl border border-[#1E3A2C]/5 overflow-hidden shadow-md cursor-pointer">
                  {/* Background Saree Image */}
                  <Image
                    src={saree.img.src}
                    alt={saree.alt}
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
                      
                      <span className="text-[10px] font-bold tracking-wider uppercase border-b border-white/40 pb-0.5 group-hover:border-white transition-all">
                        Explore Weave
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Navigation Button */}
        <button
          onClick={nextSlide}
          className={`absolute right-[-10px] md:right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full btn-animate-border-circle flex items-center justify-center text-[#1E3A2C] hover:text-white cursor-pointer z-20 shadow-sm [--btn-bg:#ffffff] [--btn-hover-bg:#1E3A2C] ${
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
    </section>
  );
}
