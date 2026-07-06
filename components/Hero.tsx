"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import honey from '@/public/images/honey.jpeg';
import kshe from '@/public/images/kshe.jpeg';
import swa from '@/public/images/swa.jpeg';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Handle scroll positions for interactive parallax effect
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Handle screen size checks for responsive adjustments
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <main className="w-full flex-1 max-w-7xl mx-auto px-6 lg:px-12 flex flex-col justify-center py-6 lg:py-0">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">

        {/* Left Column: Headings & Subtext */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full min-h-[380px] lg:py-16">
          <div className="space-y-6">
            {/* Gold small heading */}
            <h2 className="text-[#DAA87C] font-bold text-sm lg:text-base tracking-wide uppercase select-none animate-text-slide-up-1 opacity-0">
              thiraala
            </h2>

            {/* Giant bold title */}
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-[#1E3A2C] leading-none select-none animate-text-slide-up-2 opacity-0">
              Saree Collections
            </h1>

            {/* Description */}
            <p className="text-[#1E3A2C]/85 text-sm lg:text-[15px] leading-relaxed max-w-sm animate-text-slide-up-3 opacity-0">
              Welcome to thiraala. Discover our curated collection of beautiful sarees for every occasion—blending simple elegance, comfort, and premium quality to make your everyday and special moments look effortless.
            </p>
          </div>

          {/* Bottom mini-caption */}
          <div className="pt-12 lg:pt-0">
            <p className="text-[#1E3A2C]/60 text-[10px] leading-normal max-w-[220px] animate-text-slide-up-4 opacity-0">
              Curated with care, bringing you a beautiful variety of daily wear, casual, festive, and designer sarees for every budget.
            </p>
          </div>
        </div>

        {/* Right Column: Moving / Floating Images Grid grouped to the right (justify-end) */}
        <div className="lg:col-span-7 flex items-end justify-end gap-3 sm:gap-4 lg:gap-6 w-full h-[400px] sm:h-[480px] lg:h-[580px] select-none mt-8 lg:mt-0">

          {/* Card 1: Small left (Cream gold saree) - Fixed proportional width */}
          <div
            className="w-[110px] sm:w-[150px] lg:w-[180px] h-[110px] sm:h-[150px] lg:h-[180px] self-end animate-grow-up-1 opacity-0 pointer-events-none flex-shrink-0"
            style={{
              transform: !isMobile ? `translateY(${scrollY * 0.07}px)` : "none"
            }}
          >
            <div className="w-full h-full rounded-[24px] sm:rounded-[32px] overflow-hidden image-card animate-float-slow-1 relative">
              <Image
                src={honey.src}
                alt="Elegant cream saree"
                fill
                sizes="(max-width: 768px) 110px, 180px"
                className="object-cover pointer-events-none"
                priority
              />
            </div>
          </div>

          {/* Card 2: Medium center (Green gold saree) - Fixed proportional width, bottom-aligned */}
          <div
            className="w-[110px] sm:w-[150px] lg:w-[180px] h-[170px] sm:h-[230px] lg:h-[280px] self-end animate-grow-up-2 opacity-0 pointer-events-none flex-shrink-0"
            style={{
              transform: !isMobile ? `translateY(${scrollY * 0.03}px)` : "none"
            }}
          >
            <div className="w-full h-full rounded-[24px] sm:rounded-[32px] overflow-hidden image-card animate-float-slow-2 relative">
              <Image
                src={kshe.src}
                alt="Elegant green saree"
                fill
                sizes="(max-width: 768px) 110px, 180px"
                className="object-cover pointer-events-none"
                priority
              />
            </div>
          </div>

          {/* Card 3: Large right (Emerald designer saree) - Fixed double width, bottom-aligned */}
          <div
            className="w-[220px] sm:w-[300px] lg:w-[360px] h-[310px] sm:h-[420px] lg:h-[520px] self-end animate-grow-up-3 opacity-0 pointer-events-none flex-shrink-0"
            style={{
              transform: !isMobile ? `translateY(${scrollY * -0.03}px)` : "none"
            }}
          >
            <div className="w-full h-full rounded-[24px] sm:rounded-[32px] overflow-hidden image-card animate-float-slow-3 relative">
              <Image
                src={swa.src}
                alt="Beautiful designer saree"
                fill
                sizes="(max-width: 768px) 220px, 360px"
                className="object-cover pointer-events-none"
                priority
              />

              {/* Subtle vignette gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
