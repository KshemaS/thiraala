"use client";

import { useState } from "react";
import Container from "@/components/Container";
import { motion } from "framer-motion";
import CategoryCard, { CategoryProduct } from "@/components/CategoryCard";

// Import all saree assets statically to align with workspace practices
import kshe from "@/public/images/kshe.jpeg";
import honey from "@/public/images/honey.jpeg";
import swa from "@/public/images/swa.jpeg";
import arayannam from "@/public/images/arayannam.jpeg";
import gopura from "@/public/images/gopura.jpeg";
import mambazham from "@/public/images/mambazham.jpeg";
import mulcottom from "@/public/images/mulcottom.jpeg";

import foldedGopuram from "@/public/images/folded-gopuram.jpeg";
import foldedArayannam from "@/public/images/folded-arayannam.jpeg";
import foldedChembaruthy from "@/public/images/folded-chembaruthy.jpeg";
import foldedMambazham from "@/public/images/folded-mambazham.jpeg";
import foldedMulcotton from "@/public/images/folded-mulcotton.jpeg";

const categories = [
  { id: "kalyani", name: "Kalyani Cotton" },
  { id: "khadi", name: "Khadi Cotton" },
  { id: "maheswari", name: "Maheswari Cotton" },
  { id: "tissue", name: "Tissue Silk Saree" },
  { id: "kerala", name: "Kerala Set Saree" },
];

const categoryProducts: Record<string, CategoryProduct[]> = {
  kalyani: [
    {
      id: 101,
      name: "Kalyani Fine Cotton Saree",
      price: "₹1,550",
      foldedImg: foldedMulcotton,
      wornImg: mulcottom,
      altFolded: "Folded Kalyani fine cotton saree border",
      altWorn: "Kalyani fine cotton saree with subtle borders",
    },
    {
      id: 102,
      name: "Kalyani Gold Zari Cotton",
      price: "₹1,690",
      foldedImg: foldedMulcotton,
      wornImg: honey,
      altFolded: "Folded Kalyani gold border cotton saree",
      altWorn: "Kalyani gold border cotton saree",
    },
    {
      id: 103,
      name: "Traditional Kalyani Weave",
      price: "₹1,480",
      foldedImg: foldedChembaruthy,
      wornImg: kshe,
      altFolded: "Folded Traditional Kalyani cotton saree",
      altWorn: "Kalyani weave cotton saree",
    },
  ],
  khadi: [
    {
      id: 201,
      name: "Handloom Khadi Plain Saree",
      price: "₹1,850",
      foldedImg: foldedChembaruthy,
      wornImg: kshe,
      altFolded: "Folded handloom plain Khadi cotton saree",
      altWorn: "Handwoven plain Khadi cotton saree",
    },
    {
      id: 202,
      name: "Premium Khadi Stripe Edit",
      price: "₹2,100",
      foldedImg: foldedMulcotton,
      wornImg: mulcottom,
      altFolded: "Folded striped handloom Khadi cotton saree",
      altWorn: "Striped handloom Khadi cotton saree",
    },
    {
      id: 203,
      name: "Natural Dyed Khadi Saree",
      price: "₹1,950",
      foldedImg: foldedMulcotton,
      wornImg: honey,
      altFolded: "Folded Khadi organic cotton saree",
      altWorn: "Khadi cotton saree dyed with organic colors",
    },
  ],
  maheswari: [
    {
      id: 301,
      name: "Maheswari Classic Zari Saree",
      price: "₹2,550",
      foldedImg: foldedGopuram,
      wornImg: swa,
      altFolded: "Folded Maheswari classic gold border saree",
      altWorn: "Maheswari silk cotton saree with fine border",
    },
    {
      id: 302,
      name: "Maheswari Silk Blend Special",
      price: "₹2,900",
      foldedImg: foldedChembaruthy,
      wornImg: kshe,
      altFolded: "Folded Maheswari silk cotton blend saree",
      altWorn: "Sheer Maheswari silk cotton blend saree",
    },
    {
      id: 303,
      name: "Traditional Maheswari checks",
      price: "₹2,400",
      foldedImg: foldedArayannam,
      wornImg: arayannam,
      altFolded: "Folded checked Maheswari handloom saree",
      altWorn: "Checked Maheswari handloom saree",
    },
  ],
  tissue: [
    {
      id: 401,
      name: "Golden Tissue Silk Saree",
      price: "₹3,850",
      foldedImg: foldedGopuram,
      wornImg: gopura,
      altFolded: "Folded golden tissue silk saree showing gold borders",
      altWorn: "Gold metallic tissue silk designer saree",
    },
    {
      id: 402,
      name: "Silver Tissue Chanderi Saree",
      price: "₹4,200",
      foldedImg: foldedGopuram,
      wornImg: swa,
      altFolded: "Folded silver zari tissue chanderi saree",
      altWorn: "Silver zari tissue chanderi saree",
    },
    {
      id: 403,
      name: "Tissue Brocade Special Saree",
      price: "₹4,950",
      foldedImg: foldedArayannam,
      wornImg: arayannam,
      altFolded: "Folded heavy brocade tissue silk saree",
      altWorn: "Heavy brocade tissue silk bridal saree",
    },
  ],
  kerala: [
    {
      id: 501,
      name: "Traditional Set Mundu",
      price: "₹1,250",
      foldedImg: foldedMulcotton,
      wornImg: honey,
      altFolded: "Folded traditional Kerala set mundu with gold border",
      altWorn: "Classic Kerala set mundu with gold border",
    },
    {
      id: 502,
      name: "Kasavu Kerala Set Saree",
      price: "₹1,650",
      foldedImg: foldedGopuram,
      wornImg: gopura,
      altFolded: "Folded Kerala style set saree gold borders",
      altWorn: "Kerala style set saree with golden zari borders",
    },
    {
      id: 503,
      name: "Kerala Onam Handloom Saree",
      price: "₹1,450",
      foldedImg: foldedMambazham,
      wornImg: mambazham,
      altFolded: "Folded handwoven Kerala set saree gold borders",
      altWorn: "Special handwoven Kerala set saree",
    },
  ],
};

export default function CategoryTabs() {
  const [activeTab, setActiveTab] = useState("kalyani");

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
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
            <div className="relative flex items-center justify-center gap-2 md:gap-6 flex-wrap border-b border-[#1E3A2C]/10 w-full pb-4">
              {categories.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 text-xs md:text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer ${
                    activeTab === tab.id
                      ? "text-[#1E3A2C] font-bold"
                      : "text-[#1E3A2C]/50 hover:text-[#1E3A2C]"
                  }`}
                >
                  {tab.name}
                  
                  {/* Local expanding growing active line underline */}
                  <span
                    className={`absolute bottom-[-17px] left-0 right-0 h-[2px] bg-[#0c2b1c] rounded-full transition-transform duration-300 origin-center ${
                      activeTab === tab.id ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Product Card Grid (Using the CategoryCard component) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-12">
            {categoryProducts[activeTab]?.map((product, idx) => {
              const col = idx % 3;
              const cardVariant = col === 0 ? leftVariant : col === 2 ? rightVariant : centerVariant;
              return (
                <motion.div
                  key={product.id}
                  variants={cardVariant}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, amount: 0.25 }}
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
