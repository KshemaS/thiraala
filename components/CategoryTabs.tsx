"use client";

import { useState, useEffect, useCallback } from "react";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import CategoryCard, { CategoryProduct } from "@/components/CategoryCard";

import { sareesData } from "@/data/products";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  status?: string;
}

export default function CategoryTabs() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("");

  const fetchCategories = useCallback(async () => {
    try {
      const saved = localStorage.getItem("thiraala_categories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const active = parsed.filter((c: CategoryItem) => c.status !== "inactive");
          setCategories(active);
          if (active.length > 0 && !active.some((c: CategoryItem) => c.slug === activeTab)) {
            setActiveTab(active[0].slug);
          }
        }
      }

      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const active = data.filter((c: CategoryItem) => c.status !== "inactive");
          setCategories(active);
          localStorage.setItem("thiraala_categories", JSON.stringify(data));
          if (active.length > 0 && !active.some((c: CategoryItem) => c.slug === activeTab)) {
            setActiveTab(active[0].slug);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchCategories();

    const handleUpdate = () => fetchCategories();
    window.addEventListener("thiraala-categories-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("thiraala-categories-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchCategories]);

  if (categories.length === 0) {
    return null;
  }

  // Find active category item
  const currentCategory = categories.find((c) => c.slug === activeTab) || categories[0];

  // Match products by category name or fallback to sareesData
  const activeProducts = currentCategory
    ? sareesData.filter(
        (s) =>
          s.category.toLowerCase().trim() === currentCategory.name.toLowerCase().trim() ||
          s.category.toLowerCase().includes(currentCategory.slug.toLowerCase().replace(/-/g, " "))
      )
    : [];

  const displayProducts = activeProducts.length > 0 ? activeProducts : sareesData.slice(0, 3);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    show: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
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
    <section className="w-full mb-[140px] select-none">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="flex flex-col"
        >
          {/* Centered Section Heading */}
          <motion.div className="text-center max-w-2xl mx-auto mb-10" variants={itemVariants}>
            <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
              Top Categories
            </h2>
            <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
            <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
              Explore our curated range of fabrics and designs. From light, breezy handwoven cottons to luxurious tissue silks, discover the perfect drape for your signature look.
            </p>
          </motion.div>

          {/* Category Tabs Header Bar */}
          <motion.div className="flex flex-col items-center mb-12" variants={itemVariants}>
            <div className="relative flex items-center justify-start md:justify-center gap-4 md:gap-6 overflow-x-auto no-scrollbar border-b border-[#1E3A2C]/10 w-full pb-4 whitespace-nowrap select-none px-4 md:px-0">
              {categories.map((tab) => (
                <button
                  key={tab.id || tab.slug}
                  onClick={() => setActiveTab(tab.slug)}
                  className={`relative px-4 py-2 text-xs md:text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer flex-shrink-0 ${
                    activeTab === tab.slug
                      ? "text-[#1E3A2C] font-bold"
                      : "text-[#1E3A2C]/50 hover:text-[#1E3A2C]"
                  }`}
                >
                  {tab.name}
                  
                  {/* Local expanding growing active line underline */}
                  <span
                    className={`absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#0c2b1c] rounded-full transition-transform duration-300 origin-center ${
                      activeTab === tab.slug ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Card Grid (Using the CategoryCard component) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
            {displayProducts.map((product, idx) => {
              const col = idx % 3;
              const cardVariant = col === 0 ? leftVariant : col === 2 ? rightVariant : centerVariant;
              return (
                <motion.div
                  key={product.id}
                  variants={cardVariant}
                >
                  <CategoryCard product={product} />
                </motion.div>
              );
            })}
          </div>

          {/* Centered 'View More' CTA button */}
          <motion.div className="text-center mt-12" variants={itemVariants}>
            <button className="inline-flex items-center justify-center btn-animate-border btn-animate-border-light px-8 py-3 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-sm shadow-[#1E3A2C]/5">
              View More Categories
            </button>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
