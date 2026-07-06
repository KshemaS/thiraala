"use client";

import { useState } from "react";
import Image from "next/image";

// Import all saree assets statically to align with workspace practices
import kshe from "@/public/images/kshe.jpeg";
import honey from "@/public/images/honey.jpeg";
import swa from "@/public/images/swa.jpeg";
import arayannam from "@/public/images/arayannam.jpeg";
import gopura from "@/public/images/gopura.jpeg";
import mambazham from "@/public/images/mambazham.jpeg";
import mulcottom from "@/public/images/mulcottom.jpeg";

const categories = [
  { id: "kalyani", name: "Kalyani Cotton" },
  { id: "khadi", name: "Khadi Cotton" },
  { id: "maheswari", name: "Maheswari Cotton" },
  { id: "tissue", name: "Tissue Silk Saree" },
  { id: "kerala", name: "Kerala Set Saree" },
];

const categoryProducts: Record<string, Array<{ id: number; name: string; price: string; img: any; alt: string }>> = {
  kalyani: [
    {
      id: 101,
      name: "Kalyani Fine Cotton Saree",
      price: "₹1,550",
      img: mulcottom,
      alt: "Kalyani fine cotton saree with subtle borders",
    },
    {
      id: 102,
      name: "Kalyani Gold Zari Cotton",
      price: "₹1,690",
      img: honey,
      alt: "Kalyani gold border cotton saree",
    },
    {
      id: 103,
      name: "Traditional Kalyani Weave",
      price: "₹1,480",
      img: kshe,
      alt: "Kalyani weave cotton saree",
    },
  ],
  khadi: [
    {
      id: 201,
      name: "Handloom Khadi Plain Saree",
      price: "₹1,850",
      img: kshe,
      alt: "Handwoven plain Khadi cotton saree",
    },
    {
      id: 202,
      name: "Premium Khadi Stripe Edit",
      price: "₹2,100",
      img: mulcottom,
      alt: "Striped handloom Khadi cotton saree",
    },
    {
      id: 203,
      name: "Natural Dyed Khadi Saree",
      price: "₹1,950",
      img: honey,
      alt: "Khadi cotton saree dyed with organic colors",
    },
  ],
  maheswari: [
    {
      id: 301,
      name: "Maheswari Classic Zari Saree",
      price: "₹2,550",
      img: swa,
      alt: "Maheswari silk cotton saree with fine border",
    },
    {
      id: 302,
      name: "Maheswari Silk Blend Special",
      price: "₹2,900",
      img: kshe,
      alt: "Sheer Maheswari silk cotton blend saree",
    },
    {
      id: 303,
      name: "Traditional Maheswari checks",
      price: "₹2,400",
      img: arayannam,
      alt: "Checked Maheswari handloom saree",
    },
  ],
  tissue: [
    {
      id: 401,
      name: "Golden Tissue Silk Saree",
      price: "₹3,850",
      img: gopura,
      alt: "Gold metallic tissue silk designer saree",
    },
    {
      id: 402,
      name: "Silver Tissue Chanderi Saree",
      price: "₹4,200",
      img: swa,
      alt: "Silver zari tissue chanderi saree",
    },
    {
      id: 403,
      name: "Tissue Brocade Special Saree",
      price: "₹4,950",
      img: arayannam,
      alt: "Heavy brocade tissue silk bridal saree",
    },
  ],
  kerala: [
    {
      id: 501,
      name: "Traditional Set Mundu",
      price: "₹1,250",
      img: honey,
      alt: "Classic Kerala set mundu with gold border",
    },
    {
      id: 502,
      name: "Kasavu Kerala Set Saree",
      price: "₹1,650",
      img: gopura,
      alt: "Kerala style set saree with golden zari borders",
    },
    {
      id: 503,
      name: "Kerala Onam Handloom Saree",
      price: "₹1,450",
      img: mambazham,
      alt: "Special handwoven Kerala set saree",
    },
  ],
};

export default function CategoryTabs() {
  const [activeTab, setActiveTab] = useState("kalyani");

  return (
    <section className="w-full mb-[140px] max-w-7xl mx-auto px-6 lg:px-12 select-none">
      {/* Centered Section Heading */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
          Top Categories
        </h2>
        <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
        <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
          Explore our curated range of fabrics and designs. From light, breezy handwoven cottons to luxurious tissue silks, discover the perfect drape for your signature look.
        </p>
      </div>

      {/* Category Tabs Header Bar */}
      <div className="flex flex-col items-center mb-12">
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
      </div>

      {/* Product Card Grid (Different style: Square card with hover scale) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-12">
        {categoryProducts[activeTab]?.map((product) => (
          <div
            key={product.id}
            className="group flex flex-col bg-white rounded-2xl border border-[#1E3A2C]/5 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
          >
            {/* Square Image container with zoom hover */}
            <div className="relative aspect-square w-full overflow-hidden bg-[#fbfaf8]">
              <Image
                src={product.img.src}
                alt={product.alt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
              />
            </div>

            {/* Content info */}
            <div className="p-5 flex flex-col justify-between flex-1 border-t border-[#1E3A2C]/5">
              <div>
                <h3 className="text-[#1E3A2C] font-bold text-base tracking-tight group-hover:text-[#0c2b1c] transition-colors duration-200">
                  {product.name}
                </h3>
                <p className="text-[#1E3A2C]/40 text-xs mt-1">Lightweight, comfortable, and easy to drape</p>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-[#0c2b1c]">{product.price}</span>
                
                <button className="text-[11px] font-bold text-[#1E3A2C] group-hover:text-[#0c2b1c] flex items-center gap-1 transition-colors cursor-pointer">
                  Shop Now
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Centered 'View More' CTA button */}
      <div className="text-center mt-12">
        <button className="inline-flex items-center justify-center btn-animate-border btn-animate-border-light px-8 py-3 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-sm shadow-[#1E3A2C]/5">
          View More Categories
        </button>
      </div>
    </section>
  );
}
