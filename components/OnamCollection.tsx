"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Container from "@/components/Container";
import { sareesData } from "@/data/products";

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status?: string;
  featured?: boolean;
}

export default function OnamCollection() {
  const [collectionInfo, setCollectionInfo] = useState<CollectionData>({
    id: "col-1",
    name: "Onam Collection",
    slug: "onam-collection",
    description: "Welcome the season of abundance with our signature sarees. From fine golden Kasavu borders to custom floral weaves, celebrate in simple elegance.",
  });
  const [collectionProducts, setCollectionProducts] = useState<any[]>(sareesData.slice(0, 6));

  const loadCollectionAndProducts = useCallback(async () => {
    try {
      // 1. Fetch featured collection from /api/collections
      const colRes = await fetch("/api/collections");
      let activeCollection: CollectionData | null = null;
      if (colRes.ok) {
        const collections: CollectionData[] = await colRes.json();
        if (Array.isArray(collections) && collections.length > 0) {
          activeCollection =
            collections.find((c) => c.featured && c.status !== "inactive") ||
            collections.find((c) => c.status !== "inactive") ||
            collections[0];
          if (activeCollection) {
            setCollectionInfo(activeCollection);
          }
        }
      }

      // 2. Fetch products tagged with this collection from /api/products/filter
      const targetColName = activeCollection?.name || "Onam Collection";
      const prodRes = await fetch(`/api/products/filter?collection=${encodeURIComponent(targetColName)}`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setCollectionProducts(data.products.slice(0, 6));
          return;
        }
      }

      // Fallback to top catalogue items if no products specifically tagged
      const generalRes = await fetch("/api/products/filter?limit=6");
      if (generalRes.ok) {
        const data = await generalRes.json();
        if (data.success && Array.isArray(data.products) && data.products.length > 0) {
          setCollectionProducts(data.products.slice(0, 6));
          return;
        }
      }
    } catch (err) {
      console.error("Failed to load collection products:", err);
    }
  }, []);

  useEffect(() => {
    loadCollectionAndProducts();

    const handleUpdate = () => loadCollectionAndProducts();
    window.addEventListener("thiraala-collections-updated", handleUpdate);
    window.addEventListener("thiraala-products-updated", handleUpdate);

    return () => {
      window.removeEventListener("thiraala-collections-updated", handleUpdate);
      window.removeEventListener("thiraala-products-updated", handleUpdate);
    };
  }, [loadCollectionAndProducts]);

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
    hidden: { x: -30, opacity: 0 },
    show: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const rightVariant = {
    hidden: { x: 30, opacity: 0 },
    show: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    },
  };

  const centerVariant = {
    hidden: { y: 30, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
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
          {/* Centered Heading and Description (Dynamically from Dashboard) */}
          <motion.div className="text-center max-w-2xl mx-auto" variants={itemVariants}>
            <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
              {collectionInfo.name}
            </h2>
            <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
              {collectionInfo.description ||
                "Welcome the season of abundance with our signature sarees. From fine golden Kasavu borders to custom floral weaves, celebrate in simple elegance."}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-20 md:gap-10">
            {collectionProducts.map((saree, idx) => {
              const col = idx % 3;
              const cardVariant = col === 0 ? leftVariant : col === 2 ? rightVariant : centerVariant;
              return (
                <motion.div
                  key={saree.id}
                  variants={cardVariant}
                >
                  <ProductCard
                    saree={{
                      ...saree,
                      priority: idx <= 2,
                    }}
                  />
                </motion.div>
              );
            })}
          </div>

          {/* Explore More Button */}
          <div className="text-center mt-12 select-none">
            <Link
              href={`/products?collection=${encodeURIComponent(collectionInfo.name)}`}
              className="inline-flex items-center justify-center btn-animate-border btn-animate-border-dark px-8 py-3.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-sm text-white group"
            >
              Explore {collectionInfo.name}
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
