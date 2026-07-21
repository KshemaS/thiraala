"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Container from "@/components/Container";

import { sareesData } from "@/data/products";

const onamSarees = sareesData.slice(0, 6);

export default function OnamCollection() {
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

  const leftVariant = {
    hidden: { x: -60, opacity: 0 },
    show: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const rightVariant = {
    hidden: { x: 60, opacity: 0 },
    show: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 1.8,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const centerVariant = {
    hidden: { y: 60, opacity: 0 },
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
    <section className="w-full mt-[60px] md:mt-[80px] lg:mt-[140px] mb-[80px] lg:mb-[140px] select-none">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.10 }}
          className="space-y-16"
        >
          {/* Centered Heading and Description */}
          <motion.div className="text-center max-w-2xl mx-auto" variants={itemVariants}>
            <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
              Onam Collection
            </h2>
            <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
              Welcome the season of abundance with our signature sarees. From fine golden Kasavu borders to custom floral weaves, celebrate in simple elegance.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-20 md:gap-10">
            {onamSarees.map((saree, idx) => {
              const col = idx % 3;
              const cardVariant = col === 0 ? leftVariant : col === 2 ? rightVariant : centerVariant;
              return (
                <motion.div
                  key={saree.id}
                  variants={cardVariant}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                >
                  <ProductCard
                    saree={{
                      ...saree,
                      priority: saree.id <= 3,
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Explore More Button */}
          <div className="text-center mt-12 select-none">
            <Link
              href="/products"
              className="inline-flex items-center justify-center btn-animate-border btn-animate-border-dark px-8 py-3.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-sm text-white group"
            >
              Explore More
              <svg className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
