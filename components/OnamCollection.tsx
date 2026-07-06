"use client";

import ProductCard from "@/components/ProductCard";

// Import all saree assets statically to match local codebase practices
import foldedGopuram from "@/public/images/folded-gopuram.jpeg";
import gopura from "@/public/images/gopura.jpeg";
import foldedArayannam from "@/public/images/folded-arayannam.jpeg";
import arayannam from "@/public/images/arayannam.jpeg";
import foldedChembaruthy from "@/public/images/folded-chembaruthy.jpeg";
import kshe from "@/public/images/kshe.jpeg";
import foldedMambazham from "@/public/images/folded-mambazham.jpeg";
import mambazham from "@/public/images/mambazham.jpeg";
import foldedMulcotton from "@/public/images/folded-mulcotton.jpeg";
import mulcottom from "@/public/images/mulcottom.jpeg";
import honey from "@/public/images/honey.jpeg";
import kalippattam from "@/public/images/kalippattam.jpeg";

const onamSarees = [
  {
    id: 1,
    name: "Gopuram Kasavu Saree",
    price: "₹2,450",
    category: "Classic Kasavu",
    foldedImg: foldedGopuram,
    wornImg: gopura,
    altFolded: "Folded Gopuram Kasavu saree showcasing gold zari border design",
    altWorn: "Model wearing Gopuram Kasavu saree with gold temple borders",
  },
  {
    id: 2,
    name: "Arayannam Kasavu Silk",
    price: "₹2,850",
    category: "Premium Weave",
    foldedImg: foldedArayannam,
    wornImg: arayannam,
    altFolded: "Folded Arayannam silk saree with gold swan motif border",
    altWorn: "Model in white and gold Arayannam silk saree",
  },
  {
    id: 3,
    name: "Chembaruthy Cotton Saree",
    price: "₹2,250",
    category: "Floral Borders",
    foldedImg: foldedChembaruthy,
    wornImg: kshe,
    altFolded: "Folded Chembaruthy cotton saree with crimson floral print border",
    altWorn: "Model showing drape of Chembaruthy cotton saree",
  },
  {
    id: 4,
    name: "Mambazham Kasavu Border",
    price: "₹1,950",
    category: "Traditional Edit",
    foldedImg: foldedMambazham,
    wornImg: mambazham,
    altFolded: "Folded Mambazham saree showing mango leaf motif gold border",
    altWorn: "Model wearing mango-bordered Kasavu saree",
  },
  {
    id: 5,
    name: "Mul Cotton Kerala Saree",
    price: "₹1,650",
    category: "Everyday Comfort",
    foldedImg: foldedMulcotton,
    wornImg: mulcottom,
    altFolded: "Folded lightweight Mul Cotton saree with minimal gold line borders",
    altWorn: "Model wearing lightweight Mul Cotton saree",
  },
  {
    id: 6,
    name: "Kalippattam Special",
    price: "₹2,150",
    category: "Designer Saree",
    foldedImg: honey,
    wornImg: kalippattam,
    altFolded: "Folded Kalippattam designer cream saree",
    altWorn: "Model showcasing Kalippattam traditional saree drape",
  },
];

export default function OnamCollection() {
  return (
    <section className="w-full mt-[140px] mb-[140px] max-w-7xl mx-auto px-6 lg:px-12 select-none">
      {/* Centered Heading and Description */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
          Onam Collection
        </h2>
        <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
        <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
          Welcome the season of abundance with our signature sarees. From fine golden Kasavu borders to custom floral weaves, celebrate in simple elegance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {onamSarees.map((saree) => (
          <ProductCard
            key={saree.id}
            saree={{
              ...saree,
              priority: saree.id <= 3,
            }}
          />
        ))}
      </div>
    </section>
  );
}
