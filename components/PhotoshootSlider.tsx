"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Container from "@/components/Container";
import img1 from '@/public/images/shoot.png';
import img2 from '@/public/images/products-bg.png';
import img3 from '@/public/images/about-hero-bg.png';

const slides = [
  { image: img1 },
  { image: img2 },
  { image: img3 },
];

export default function PhotoshootSlider() {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  // Animation variants
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
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  return (
    <section className="w-full mt-[80px] lg:mt-[120px] mb-10 md:mb-4">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="space-y-12"
        >
          {/* Centered Heading and Description (Matching other sections) */}
          <motion.div className="text-center max-w-2xl mx-auto" variants={itemVariants}>
            <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
              Editorial Photoshoots
            </h2>
            <div className="w-12 h-1 bg-[#DAA87C] mx-auto my-4 rounded-full"></div>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
              Glimpses of our sarees in real, everyday settings—capturing the fluid drape, fine textures, and premium comfort of our fabrics.
            </p>
          </motion.div>

          {/* Image Slider Container (400px Height, Rounded Corners) */}
          <motion.div
            className="relative w-full h-[400px] overflow-hidden rounded-[24px] sm:rounded-[32px] select-none shadow-md"
            variants={itemVariants}
          >
            <div className="relative w-full h-full">
              {slides.map((slide, idx) => {
                const isActive = idx === current;
                return (
                  <div
                    key={idx}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                      }`}
                  >
                    {/* Photoshoot Image with Ken Burns effect */}
                    <div className="absolute inset-0 w-full h-full">
                      <Image
                        src={slide.image}
                        alt={`Photoshoot image ${idx + 1}`}
                        fill
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        className={`object-cover transition-transform duration-[6000ms] ease-out ${isActive ? "scale-105" : "scale-100"
                          }`}
                        priority={idx === 0}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
