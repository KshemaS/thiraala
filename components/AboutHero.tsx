"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import aboutHeroBg from "../public/images/product-bg.png";
import Container from "./Container";

export default function AboutHero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1] as const, // premium custom cubic-bezier
      },
    },
  };

  return (
    <section className="relative w-full min-h-[90vh] lg:min-h-[85vh] 3xl:min-h-screen flex items-center justify-center pt-[100px] pb-[80px] xl:pb-[140px] overflow-hidden">
      {/* Background Texture Image */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none select-none">
        <Image
          src={aboutHeroBg}
          alt="Handwoven fabric texture background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Subtle flowing SVG background representing saree waves */}
      <Container className="relative z-10 text-left w-full">
        <motion.div
          className="py-12 sm:py-10 md:py-20"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.h1
            className="text-4xl lg:text-6xl font-bold text-[#1E3A2C] tracking-tight leading-none mb-6 select-none max-w-[600px]"
            variants={itemVariants}
          >
            Behind the Weaves of thiraala
          </motion.h1>

          <motion.div
            className="w-16 h-1.5 bg-[#DAA87C] mb-8 rounded-full"
            variants={itemVariants}
          />

          <motion.p
            className="max-w-2xl text-[#1E3A2C]/85 text-base sm:text-lg leading-relaxed font-normal"
            variants={itemVariants}
          >
            Welcome to thiraala. Discover our journey in bringing back the simple, lightweight elegance of everyday sarees—crafted with love, comfort, and traditional heritage.
          </motion.p>
        </motion.div>
      </Container>
    </section>
  );
}
