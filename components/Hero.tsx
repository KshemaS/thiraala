"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Container from "@/components/Container";
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1] as const, // Smooth premium custom bezier
      },
    },
  };

  const cardVariants1 = {
    hidden: { y: 80, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1.4,
        delay: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const cardVariants2 = {
    hidden: { y: 80, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1.4,
        delay: 0.7,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const cardVariants3 = {
    hidden: { y: 80, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1.4,
        delay: 0.9,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <main className="relative w-full flex-1 flex flex-col justify-center py-6 lg:py-0 overflow-hidden">

      {/* Saree-inspired flowing background SVG */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden opacity-60">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <g className="opacity-75">
            {/* Drape Body 1 (Soft green flow) */}
            <path
              d="M -100,750 C 300,700 600,850 900,600 C 1100,450 1300,550 1600,450 L 1600,850 L -100,850 Z"
              fill="url(#saree-grad-green)"
              className="animate-saree-wave-1 origin-center"
            />

            {/* Drape Body 2 (Subtle cream/gold flow offset) */}
            <path
              d="M -100,700 C 250,620 550,780 850,520 C 1050,380 1250,480 1600,380 L 1600,850 L -100,850 Z"
              fill="url(#saree-grad-gold)"
              className="animate-saree-wave-2 origin-center"
            />

            {/* Zari Border 1 (Main Gold Border) */}
            <path
              d="M -100,700 C 250,620 550,780 850,520 C 1050,380 1250,480 1600,380"
              stroke="#DAA87C"
              strokeWidth="5"
              strokeLinecap="round"
              className="animate-saree-wave-2 origin-center"
            />
            {/* Zari Inner Line */}
            <path
              d="M -100,690 C 250,610 550,770 850,510 C 1050,370 1250,470 1600,370"
              stroke="#DAA87C"
              strokeWidth="1.5"
              strokeDasharray="4 8"
              strokeLinecap="round"
              className="animate-saree-wave-2 origin-center"
            />

            {/* Pleats (Thin parallel lines simulating fabric folds) */}
            <path
              d="M -100,660 C 220,570 520,730 820,470 C 1020,330 1220,430 1600,330"
              stroke="#1E3A2C"
              strokeWidth="1.5"
              strokeOpacity="0.4"
              className="animate-saree-wave-3 origin-center"
            />
            <path
              d="M -100,645 C 210,550 510,710 810,450 C 1010,310 1210,410 1600,310"
              stroke="#DAA87C"
              strokeWidth="1"
              strokeOpacity="0.5"
              className="animate-saree-wave-1 origin-center"
            />
            <path
              d="M -100,630 C 200,530 500,690 800,430 C 1000,290 1200,390 1600,290"
              stroke="#1E3A2C"
              strokeWidth="1.5"
              strokeOpacity="0.3"
              className="animate-saree-wave-3 origin-center"
            />
          </g>

          <defs>
            <linearGradient id="saree-grad-green" x1="0" y1="800" x2="1440" y2="400" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E3A2C" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#1E3A2C" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#1E3A2C" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="saree-grad-gold" x1="0" y1="800" x2="1440" y2="300" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#DAA87C" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#DAA87C" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#DAA87C" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <Container className="relative z-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-12 items-center w-full">

          {/* Left Column: Headings & Subtext */}
          <motion.div
            className="lg:col-span-5 flex flex-col justify-between h-full min-h-[auto] lg:min-h-[380px] py-4 lg:py-16 text-center lg:text-left"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <div className="space-y-4 lg:space-y-6">
              {/* Gold small heading */}
              <motion.h2
                className="text-[#DAA87C] font-bold text-sm lg:text-base tracking-wide uppercase select-none"
                variants={itemVariants}
              >
                thiraala
              </motion.h2>

              {/* Giant bold title */}
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-[#1E3A2C] leading-none select-none"
                variants={itemVariants}
              >
                Saree Collections
              </motion.h1>

              {/* Description */}
              <motion.p
                className="text-[#1E3A2C]/85 text-sm lg:text-[15px] leading-relaxed max-w-sm mx-auto lg:mx-0"
                variants={itemVariants}
              >
                Welcome to thiraala. Discover our curated collection of beautiful sarees for every occasion—blending simple elegance, comfort, and premium quality to make your everyday and special moments look effortless.
              </motion.p>
            </div>
          </motion.div>

          {/* Right Column: Moving / Floating Images Grid */}
          <div className="lg:col-span-7 flex items-end justify-center lg:justify-end gap-2.5 sm:gap-4 lg:gap-6 w-full h-[260px] sm:h-[480px] lg:h-[580px] select-none  relative">

            {/* Decorative Rotating Mandala & Floating Circles */}
            <div
              className="absolute left-0 sm:left-[-20px] lg:left-[-60px] xl:left-[-80px] top-[15%] lg:top-[25%] pointer-events-none select-none z-10"
              style={{
                transform: !isMobile
                  ? `translateY(${scrollY * 0.04}px) rotate(${scrollY * 0.12}deg)`
                  : `rotate(${scrollY * 0.05}deg)`
              }}
            >
              {/* Main Mandala */}
              <div className="w-12 h-12 sm:w-20 lg:w-24 lg:h-24 relative flex items-center justify-center">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full stroke-[#DAA87C]/70 animate-spin-slow">
                  {/* Outer dotted circle */}
                  <circle cx="50" cy="50" r="45" strokeDasharray="2 3" strokeWidth="1" />
                  {/* Outer solid thin ring */}
                  <circle cx="50" cy="50" r="41" strokeWidth="0.5" strokeOpacity="0.6" />
                  {/* Sun rays or petals */}
                  <path d="M 50,15 L 50,21 M 50,79 L 50,85 M 15,50 L 21,50 M 79,50 L 85,50 M 25.25,25.25 L 29.5,29.5 M 70.5,70.5 L 74.75,74.75 M 25.25,74.75 L 29.5,70.5 M 70.5,25.25 L 74.75,29.5" strokeWidth="1" strokeLinecap="round" />
                  {/* Inner ring */}
                  <circle cx="50" cy="50" r="30" strokeWidth="0.75" />
                  {/* Concentric details */}
                  <circle cx="50" cy="50" r="26" strokeDasharray="1 2" strokeWidth="0.8" />
                  {/* Central flower / sun */}
                  <path d="M 50,38 C 47,45 42,47 50,50 C 58,47 53,45 50,38 Z" fill="#DAA87C" fillOpacity="0.15" />
                  <path d="M 50,62 C 47,55 42,53 50,50 C 58,53 53,55 50,62 Z" fill="#DAA87C" fillOpacity="0.15" />
                  <path d="M 38,50 C 45,47 47,42 50,50 C 47,58 45,53 38,50 Z" fill="#DAA87C" fillOpacity="0.15" />
                  <path d="M 62,50 C 55,47 53,42 50,50 C 53,58 55,53 62,50 Z" fill="#DAA87C" fillOpacity="0.15" />
                  {/* Center dot */}
                  <circle cx="50" cy="50" r="2.5" fill="#DAA87C" fillOpacity="0.8" />
                </svg>
              </div>

              {/* Small companion dots / rings */}
              <div className="absolute top-[-12px] right-[-8px] w-2 h-2 rounded-full bg-[#DAA87C]/40 animate-pulse" />
              <div className="absolute bottom-[-8px] left-[-12px] w-3 h-3 rounded-full border border-[#DAA87C]/30 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#DAA87C]/60" />
              </div>
            </div>

            {/* Card 1: Small left (Cream gold saree) */}
            <motion.div
              className="w-[75px] sm:w-[150px] lg:w-[180px] h-[75px] sm:h-[150px] lg:h-[180px] self-end flex-shrink-0"
              variants={cardVariants1}
              initial="hidden"
              animate="show"
              style={{
                transform: !isMobile ? `translateY(${scrollY * 0.07}px)` : "none"
              }}
            >
              <div className="w-full h-full rounded-[16px] sm:rounded-[32px] overflow-hidden image-card animate-float-slow-1 relative">
                <Image
                  src={honey.src}
                  alt="Elegant cream saree"
                  fill
                  sizes="(max-width: 768px) 75px, 180px"
                  className="object-cover pointer-events-none"
                  priority
                />
              </div>
            </motion.div>

            {/* Card 2: Medium center (Green gold saree) */}
            <motion.div
              className="w-[75px] sm:w-[150px] lg:w-[180px] h-[120px] sm:h-[230px] lg:h-[280px] self-end flex-shrink-0"
              variants={cardVariants2}
              initial="hidden"
              animate="show"
              style={{
                transform: !isMobile ? `translateY(${scrollY * 0.03}px)` : "none"
              }}
            >
              <div className="w-full h-full rounded-[16px] sm:rounded-[32px] overflow-hidden image-card animate-float-slow-2 relative">
                <Image
                  src={kshe.src}
                  alt="Elegant green saree"
                  fill
                  sizes="(max-width: 768px) 75px, 180px"
                  className="object-cover pointer-events-none"
                  priority
                />
              </div>
            </motion.div>

            {/* Card 3: Large right (Emerald designer saree) */}
            <motion.div
              className="w-[145px] sm:w-[300px] lg:w-[360px] h-[210px] sm:h-[420px] lg:h-[520px] self-end flex-shrink-0"
              variants={cardVariants3}
              initial="hidden"
              animate="show"
              style={{
                transform: !isMobile ? `translateY(${scrollY * -0.03}px)` : "none"
              }}
            >
              <div className="w-full h-full rounded-[20px] sm:rounded-[32px] overflow-hidden image-card animate-float-slow-3 relative">
                <Image
                  src={swa.src}
                  alt="Beautiful designer saree"
                  fill
                  sizes="(max-width: 768px) 145px, 360px"
                  className="object-cover pointer-events-none"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />
              </div>
            </motion.div>

          </div>
        </div>
      </Container>
    </main>
  );
}
