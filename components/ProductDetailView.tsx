"use client";

import { useMemo, useState } from "react";
import ProductGallery from "@/components/ProductGallery";
import ProductInfo from "@/components/ProductInfo";
import type { UnifiedProduct } from "@/lib/products";
import type { ProductVariantItem } from "@/lib/productVariants";
import { ownPhotos } from "@/lib/placeholder";

/**
 * Product photos + details, sharing the selected colour variant so picking a
 * colour swaps the gallery photos, price, stock and SKU together.
 */
export default function ProductDetailView({ product }: { product: UnifiedProduct }) {
  const variants = product.variants || [];
  // Start on the first in-stock colour, else the first colour.
  const [selectedId, setSelectedId] = useState<string | undefined>(
    () => (variants.find((v) => v.stock > 0) || variants[0])?.id
  );
  const selected = variants.find((v) => v.id === selectedId);

  const displayProduct = useMemo(() => withVariant(product, selected), [product, selected]);

  return (
    <>
      <ProductGallery product={displayProduct} />
      <ProductInfo
        product={displayProduct}
        variants={variants}
        selectedVariantId={selected?.id}
        onSelectVariant={setSelectedId}
      />
    </>
  );
}

/** The product as it should look/behave with a given variant selected. */
function withVariant(product: UnifiedProduct, v: ProductVariantItem | undefined) {
  if (!v) return product;
  const priceValue = v.priceValue ?? product.priceValue;
  const mrp = v.mrp ?? product.mrp;
  return {
    ...product,
    // Cart line key: one line per colour. productId/variantId go to the order.
    id: `${product.id}__${v.id}`,
    productId: product.id,
    variantId: v.id,
    selectedColor: v.name,
    sku: v.sku,
    priceValue,
    price: `₹${priceValue.toLocaleString("en-IN")}`,
    mrp,
    discountPercent: mrp && mrp > priceValue ? Math.round(((mrp - priceValue) / mrp) * 100) : undefined,
    stock: v.stock,
    // The colour's own photos when it has any, else the product's.
    ...(v.foldedImg || v.wornImg
      ? ownPhotos(v.foldedImg, v.wornImg)
      : { foldedImg: product.foldedImg, wornImg: product.wornImg }),
    altFolded: `${product.name} in ${v.name}, folded`,
    altWorn: `${product.name} in ${v.name}, draped`,
  };
}
