"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Container from "@/components/Container";
import productHero from "@/public/images/products-bg.png";

export default function ProductBanner() {
  return (
    <section className="w-full pt-6">
      <Container>
        <motion.div 
          className="relative w-full h-[350px] overflow-hidden rounded-[24px] sm:rounded-[32px] border border-[#1E3A2C]/5 shadow-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <Image
            src={productHero}
            alt="Product collection header banner showcase"
            fill
            className="object-cover"
            priority
          />
        </motion.div>
      </Container>
    </section>
  );
}
