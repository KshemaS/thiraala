"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Container from "@/components/Container";

// Import all saree assets statically to align with workspace practices
import gopura from "@/public/images/gopura.jpeg";
import swa from "@/public/images/swa.jpeg";
import kshe from "@/public/images/kshe.jpeg";
import foldedArayannam from "@/public/images/folded-arayannam.jpeg";
import arayannam from "@/public/images/arayannam.jpeg";

const bestSellers = [
  {
    id: 701,
    name: "Gopuram Kasavu Saree",
    price: "₹2,450",
    wornImg: gopura,
    altWorn: "Model wearing Gopuram Kasavu saree with gold temple borders",
  },
  {
    id: 702,
    name: "Chembaruthy Cotton Saree",
    price: "₹2,250",
    wornImg: kshe,
    altWorn: "Model showing drape of Chembaruthy cotton saree",
  },
  {
    id: 703,
    name: "Arayannam Kasavu Silk",
    price: "₹2,850",
    wornImg: arayannam,
    altWorn: "Model in white and gold Arayannam silk saree",
  },
  {
    id: 703,
    name: "Kalippattam Kasavu",
    price: "₹2,850",
    wornImg: swa,
    altWorn: "Model in white and gold Arayannam silk saree",
  },

];

export default function BestSellers() {
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
    <section className="w-full mb-[140px] select-none">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="space-y-16"
        >
          {/* Centered Heading and Description */}
          <motion.div className="text-center max-w-2xl mx-auto" variants={itemVariants}>
            <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
              Best Sellers
            </h2>
            <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed font-normal">
              The pieces our community loves the most. Hand-selected for their exceptional quality, comfort, and timeless beauty.
            </p>
          </motion.div>

          {/* Grid listing section using unique Arch Card style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bestSellers.map((saree, idx) => {
              const col = idx % 4;
              const cardVariant = col === 0 ? leftVariant : col === 3 ? rightVariant : centerVariant;
              return (
                <motion.div
                  key={saree.id}
                  variants={cardVariant}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
                  className="group flex flex-col items-center bg-transparent overflow-hidden"
                >
                  <Link href={`/products/${saree.id}`} className="w-full h-full flex flex-col items-center bg-transparent">
                    {/* Arch-Shaped Image Container with Shadow */}
                    <div className="relative aspect-[2/3] w-[85%] sm:w-[100%] mx-auto overflow-hidden rounded-t-full shadow-md border border-[#1E3A2C]/5 bg-[#fbfaf8] transition-shadow duration-300 group-hover:shadow-lg">
                      <Image
                        src={saree.wornImg.src}
                        alt={saree.altWorn}
                        fill
                        sizes="(max-width: 768px) 80vw, (max-width: 1024px) 40vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                      />
                    </div>

                    {/* Details Below */}
                    <div className="mt-6 text-center flex flex-col items-center">
                      <span className="text-[10px] font-bold tracking-widest text-[#0c2b1c]/60 uppercase mb-1">
                        Bestseller
                      </span>
                      <h3 className="text-[#1E3A2C] font-bold text-lg tracking-tight group-hover:text-[#0c2b1c] transition-colors duration-200">
                        {saree.name}
                      </h3>
                      <span className="text-base font-bold text-[#0c2b1c] mt-1.5">
                        {saree.price}
                      </span>

                      <span className="text-[11px] font-bold text-[#1E3A2C] group-hover:text-[#0c2b1c] flex items-center gap-1 mt-3 transition-colors border-b border-[#1E3A2C]/20 hover:border-[#0c2b1c] pb-0.5">
                        View Collection
                        <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
