import CategoryCard from "@/components/CategoryCard";
import { getRelatedProducts, type UnifiedProduct } from "@/lib/products";

export default async function RelatedProducts({ product }: { product: Pick<UnifiedProduct, "id" | "category"> }) {
  const relatedProducts = await getRelatedProducts(product, 3);

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
          <CategoryCard
            key={item.id}
            product={{
              id: item.id,
              name: item.name,
              price: item.price,
              foldedImg: item.foldedImg,
              wornImg: item.wornImg,
              img: item.img || item.wornImg,
              altFolded: item.altFolded || item.name,
              altWorn: item.altWorn || item.name,
              soldOut: item.soldOut,
            }}
          />
        ))}
      </div>
    </div>
  );
}
