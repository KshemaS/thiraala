"use client";

import { useState, useMemo } from "react";
import CategoryCard from "@/components/CategoryCard";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import { sareesData } from "@/data/products";

export default function ProductListing() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFabric, setSelectedFabric] = useState("All");

  // Dynamically extract unique categories and fabrics for the filter bar
  const categories = useMemo(() => {
    const list = new Set(sareesData.map((s) => s.category));
    return ["All", ...Array.from(list)];
  }, []);

  const fabrics = useMemo(() => {
    const list = new Set(sareesData.map((s) => s.fabric));
    return ["All", ...Array.from(list)];
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...sareesData];

    if (selectedCategory !== "All") {
      result = result.filter((saree) => saree.category === selectedCategory);
    }

    if (selectedFabric !== "All") {
      result = result.filter((saree) => saree.fabric === selectedFabric);
    }

    return result;
  }, [selectedCategory, selectedFabric]);

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
    <section className="w-full py-12">
      <Container>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.10 }}
          className="flex flex-col lg:flex-row gap-10 items-start w-full"
        >
        
          {/* Left Sidebar: Filters */}
          <motion.aside className="w-full lg:w-[260px] flex-shrink-0 bg-white p-6 rounded-[24px] border border-[#1E3A2C]/5 shadow-[0_10px_30px_rgba(30,58,44,0.02)]" variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 lg:gap-8">
            
            {/* Category Filter */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1E3A2C] uppercase tracking-widest border-b border-[#1E3A2C]/10 pb-2">
                Category
              </h4>
              <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto scrollbar-none">
                {categories.map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#1E3A2C] text-[#fcfbfa] font-bold shadow-sm"
                          : "text-[#1E3A2C]/75 hover:bg-[#1E3A2C]/5 hover:text-[#1E3A2C]"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fabric Filter */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#1E3A2C] uppercase tracking-widest border-b border-[#1E3A2C]/10 pb-2">
                Fabric
              </h4>
              <div className="flex flex-col gap-1">
                {fabrics.map((fabric) => {
                  const isActive = selectedFabric === fabric;
                  return (
                    <button
                      key={fabric}
                      onClick={() => setSelectedFabric(fabric)}
                      className={`w-full text-left text-xs py-1.5 px-3 rounded-lg transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#1E3A2C] text-[#fcfbfa] font-bold shadow-sm"
                          : "text-[#1E3A2C]/75 hover:bg-[#1E3A2C]/5 hover:text-[#1E3A2C]"
                      }`}
                    >
                      {fabric === "All" ? "All Fabrics" : fabric}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Reset Button */}
          {(selectedCategory !== "All" || selectedFabric !== "All") && (
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedFabric("All");
              }}
              className="w-full mt-6 py-2.5 text-center text-xs font-bold text-[#DAA87C] border border-[#DAA87C]/20 hover:border-[#DAA87C] hover:bg-[#DAA87C]/5 rounded-xl transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          )}
          </motion.aside>

          {/* Right Saree Listing Grid */}
          <motion.div className="flex-1 w-full" variants={itemVariants}>
            {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[30px] gap-y-[50px]">
              {filteredProducts.map((saree) => (
                <CategoryCard
                  key={saree.id}
                  product={saree}
                />
              ))}
            </div>
          ) : (
            <div className="w-full text-center py-20 bg-white border border-[#1E3A2C]/5 rounded-[32px] shadow-sm">
              <svg className="w-12 h-12 mx-auto stroke-[#DAA87C] opacity-60 mb-4" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-bold text-[#1E3A2C] mb-2">No weaves found</h3>
              <p className="text-sm text-[#1E3A2C]/60">Try selecting a different filter option or clear categories.</p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedFabric("All");
                }}
                className="mt-6 px-6 py-2.5 text-xs font-bold text-[#fcfbfa] bg-[#1E3A2C] rounded-full hover:scale-102 transition-transform cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          )}
          </motion.div>

        </motion.div>
      </Container>
    </section>
  );
}
