"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Container from "@/components/Container";
import founderImg from "../public/images/founder.png";

const founderSlides = [
  { src: founderImg, alt: "Founder of thiraala" },
  { src: "/images/folded-mulcotton.jpeg", alt: "Premium Mulcotton handwoven saree" },
  { src: "/images/folded-mambazham.jpeg", alt: "Lightweight traditional Mambazham saree" },
  { src: "/images/folded-chembaruthy.jpeg", alt: "Beautifully folded Chembaruthy saree" },
];

export default function AboutFounder() {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % founderSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

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
    hidden: { y: 40, opacity: 0 },
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
    <section className="w-full pb-0 border-t border-[#1E3A2C]/5">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center"
        >
          {/* Left Column: Founder Intro Text */}
          <motion.div className="lg:col-span-7 space-y-6 order-2 lg:order-1" variants={itemVariants}>
            <div className="space-y-2">
              <span className="text-[#DAA87C] font-semibold text-xs tracking-widest uppercase">
                behind the loom
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-[#1E3A2C] tracking-tight">
                A Note from the Founder
              </h2>
            </div>

            <div className="w-12 h-1 bg-[#DAA87C] rounded-full"></div>

            <div className="text-[#1E3A2C]/85 text-sm sm:text-base leading-relaxed space-y-4 font-normal">
              <p className="font-normal text-[#1E3A2C] text-base sm:text-lg">
                &ldquo;A saree is more than just six yards of fabric; it is a fluid rhythm of threads, a container of family memories, and a medium of pure elegance.&rdquo;
              </p>
              <p>
                As an avid saree lover, I always found myself searching for weaves that were lightweight, comfortable to wear for long tropical days, and yet visually elegant. Too often, the market was filled with heavy, restrictive, or over-decorated fabrics.
              </p>
              <p>
                That search is what sparked <strong>thiraala</strong>—named after the gentle Malayalam word for &ldquo;waves.&rdquo; Just like the rhythmic waves of the sea, thiraala represents the fluid, natural drape of our premium lightweight sarees.
              </p>
              <p>
                We partner directly with traditional weaver families, blending age-old handloom techniques with a minimalist aesthetic. Our sarees are made for your everyday comfort and special moments alike, designed to make you feel beautiful, authentic, and completely at ease.
              </p>
            </div>

            <div className="pt-4">
              <h4 className="text-[#1E3A2C] font-semibold text-base">Thiraala</h4>
              <p className="text-[#DAA87C] text-xs uppercase tracking-wider font-semibold">Founder, thiraala</p>
            </div>
          </motion.div>

          {/* Right Column: Interactive Image Slider */}
          <motion.div className="lg:col-span-5 flex flex-col items-center justify-center order-1 lg:order-2" variants={itemVariants}>
            <div
              className="relative w-full max-w-sm sm:max-w-md aspect-[3/4] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-lg border border-[#DAA87C]/15 bg-stone-50 group"
              style={{
                transform: !isMobile ? `translateY(${scrollY * 0.02}px)` : "none"
              }}
            >
              {founderSlides.map((slide, idx) => {
                const isActive = idx === currentSlide;
                return (
                  <div
                    key={idx}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                      }`}
                  >
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 400px"
                      className={`object-cover transition-transform duration-[6000ms] ease-out ${isActive ? "scale-105" : "scale-100"
                        }`}
                      priority={idx === 0}
                    />
                  </div>
                );
              })}

              {/* Slider Indicators (Dots at the bottom) */}
              <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
                {founderSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${idx === currentSlide ? "bg-[#DAA87C] w-5" : "bg-white/50 hover:bg-white"
                      }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
