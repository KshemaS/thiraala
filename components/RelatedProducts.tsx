import CategoryCard from "@/components/CategoryCard";
import { sareesData, SareeProduct } from "@/data/products";

export default function RelatedProducts({ product }: { product: SareeProduct }) {
  // Filter related products (same category, up to 3 items)
  const relatedProducts = sareesData
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 3);

  // Fallback related products if count is low
  if (relatedProducts.length < 3) {
    const additional = sareesData.filter((item) => item.id !== product.id && !relatedProducts.some((p) => p.id === item.id));
    relatedProducts.push(...additional.slice(0, 3 - relatedProducts.length));
  }

  return (
    <div className="border-t border-[#1E3A2C]/10 pt-16 mt-16 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <h2 className="text-[#1E3A2C] font-bold text-3xl tracking-tight select-none">
          Related Products
        </h2>
        <div className="w-12 h-0.5 bg-[#DAA87C] mx-auto rounded-full"></div>
        <p className="text-[#1E3A2C]/70 text-xs sm:text-sm">
          Other handwoven masterpieces from our collections that you may love to explore.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {relatedProducts.map((item) => (
          <CategoryCard key={item.id} product={item} />
        ))}
      </div>
    </div>
  );
}
