import { StaticImageData } from "next/image";

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

export interface SareeProduct {
  id: number;
  name: string;
  price: string;
  priceValue: number; // raw value for numeric filtering and sorting
  category: string;
  foldedImg: StaticImageData;
  wornImg: StaticImageData;
  altFolded: string;
  altWorn: string;
  fabric: string; // Cotton, Silk, Mul Cotton
  color: string; // Gold, White, Crimson, Mango, Green, Cream
}

export const sareesData: SareeProduct[] = [
  {
    id: 1,
    name: "Gopuram Kasavu Saree",
    price: "₹2,450",
    priceValue: 2450,
    category: "Classic Kasavu",
    foldedImg: foldedGopuram,
    wornImg: gopura,
    altFolded: "Folded Gopuram Kasavu saree showcasing gold zari border design",
    altWorn: "Model wearing Gopuram Kasavu saree with gold temple borders",
    fabric: "Cotton",
    color: "Gold",
  },
  {
    id: 2,
    name: "Arayannam Kasavu Silk",
    price: "₹2,850",
    priceValue: 2850,
    category: "Premium Weave",
    foldedImg: foldedArayannam,
    wornImg: arayannam,
    altFolded: "Folded Arayannam silk saree with gold swan motif border",
    altWorn: "Model in white and gold Arayannam silk saree",
    fabric: "Silk",
    color: "White",
  },
  {
    id: 3,
    name: "Chembaruthy Cotton Saree",
    price: "₹2,250",
    priceValue: 2250,
    category: "Floral Borders",
    foldedImg: foldedChembaruthy,
    wornImg: kshe,
    altFolded: "Folded Chembaruthy cotton saree with crimson floral print border",
    altWorn: "Model showing drape of Chembaruthy cotton saree",
    fabric: "Cotton",
    color: "Crimson",
  },
  {
    id: 4,
    name: "Mambazham Kasavu Border",
    price: "₹1,950",
    priceValue: 1950,
    category: "Traditional Edit",
    foldedImg: foldedMambazham,
    wornImg: mambazham,
    altFolded: "Folded Mambazham saree showing mango leaf motif gold border",
    altWorn: "Model wearing mango-bordered Kasavu saree",
    fabric: "Cotton",
    color: "Mango",
  },
  {
    id: 5,
    name: "Mul Cotton Kerala Saree",
    price: "₹1,650",
    priceValue: 1650,
    category: "Everyday Comfort",
    foldedImg: foldedMulcotton,
    wornImg: mulcottom,
    altFolded: "Folded lightweight Mul Cotton saree with minimal gold line borders",
    altWorn: "Model wearing lightweight Mul Cotton saree",
    fabric: "Mul Cotton",
    color: "White",
  },
  {
    id: 6,
    name: "Kalippattam Special",
    price: "₹2,150",
    priceValue: 2150,
    category: "Designer Saree",
    foldedImg: honey,
    wornImg: kalippattam,
    altFolded: "Folded Kalippattam designer cream saree",
    altWorn: "Model showcasing Kalippattam traditional saree drape",
    fabric: "Cotton",
    color: "Cream",
  },
  {
    id: 7,
    name: "Mayilpeeli Kasavu Gold",
    price: "₹3,100",
    priceValue: 3100,
    category: "Premium Weave",
    foldedImg: foldedGopuram,
    wornImg: gopura,
    altFolded: "Mayilpeeli gold Kasavu saree border",
    altWorn: "Model wearing peacock gold Kasavu saree",
    fabric: "Silk",
    color: "Gold",
  },
  {
    id: 8,
    name: "Athira Comfort Mul Cotton",
    price: "₹1,750",
    priceValue: 1750,
    category: "Everyday Comfort",
    foldedImg: foldedMulcotton,
    wornImg: mulcottom,
    altFolded: "Folded Athira Mul Cotton saree",
    altWorn: "Model in lightweight Athira Mul Cotton saree",
    fabric: "Mul Cotton",
    color: "Cream",
  },
  {
    id: 9,
    name: "Vrindavan Floral Border",
    price: "₹2,350",
    priceValue: 2350,
    category: "Floral Borders",
    foldedImg: foldedChembaruthy,
    wornImg: kshe,
    altFolded: "Folded Vrindavan floral border saree",
    altWorn: "Model wearing Vrindavan floral saree drape",
    fabric: "Cotton",
    color: "Crimson",
  },
];
