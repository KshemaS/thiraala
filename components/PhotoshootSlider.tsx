"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Container from "@/components/Container";

interface EditorialPhoto {
  id: string;
  url: string;
  title?: string;
}

export default function PhotoshootSlider() {
  const [slides, setSlides] = useState<EditorialPhoto[]>([]);
  const [current, setCurrent] = useState(0);

  const fetchSlides = useCallback(async () => {
    try {
      // 1. Read from client local storage cache if available
      const saved = localStorage.getItem("thiraala_editorial_photos");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
        }
      }

      // 2. Fetch authoritative configuration from API
      const res = await fetch("/api/editorial");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSlides(data);
          localStorage.setItem("thiraala_editorial_photos", JSON.stringify(data));
        }
      }
    } catch (e) {
      console.error("Failed to load editorial photos from dashboard:", e);
    }
  }, []);

  useEffect(() => {
    fetchSlides();

    // Listen for real-time changes saved in dashboard
    const handleUpdate = () => fetchSlides();
    window.addEventListener("thiraala-editorial-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("thiraala-editorial-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchSlides]);

  const nextSlide = useCallback(() => {
    setSlides((currentSlides) => {
      if (currentSlides.length <= 1) return currentSlides;
      setCurrent((prev) => (prev >= currentSlides.length - 1 ? 0 : prev + 1));
      return currentSlides;
    });
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [slides.length, nextSlide]);

  // If no editorial photos have been configured from the dashboard, do not display dummy data
  if (slides.length === 0) {
    return null;
  }

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
          {/* Centered Heading and Description */}
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
                const isActive = idx === (current % slides.length);
                return (
                  <div
                    key={slide.id || idx}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                      isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    {/* Photoshoot Image with Ken Burns effect */}
                    <div className="absolute inset-0 w-full h-full">
                      <Image
                        src={slide.url}
                        alt={slide.title || `Photoshoot image ${idx + 1}`}
                        fill
                        sizes="(max-width: 1280px) 100vw, 1280px"
                        className={`object-cover transition-transform duration-[6000ms] ease-out ${
                          isActive ? "scale-105" : "scale-100"
                        }`}
                        priority={idx === 0}
                        quality={100}
                        unoptimized={slide.url.startsWith("data:")}
                      />
                    </div>

                    {/* Subtle caption overlay if title exists */}
                    {slide.title && (
                      <div className="absolute bottom-6 left-6 sm:left-10 z-20 px-4 py-2 rounded-xl bg-[#1E3A2C]/60 backdrop-blur-md border border-white/10 text-white text-xs sm:text-sm font-medium tracking-wide">
                        {slide.title}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Slider Dots */}
            {slides.length > 1 && (
              <div className="absolute bottom-6 right-6 sm:right-10 z-20 flex items-center gap-2 bg-[#1E3A2C]/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {slides.map((_, idx) => {
                  const isActive = idx === (current % slides.length);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrent(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        isActive ? "w-6 bg-[#DAA87C]" : "w-2 bg-white/40 hover:bg-white/70"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
