import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import ProductBreadcrumbs from "@/components/ProductBreadcrumbs";
import ProductGallery from "@/components/ProductGallery";
import ProductInfo from "@/components/ProductInfo";
import RelatedProducts from "@/components/RelatedProducts";
import { getProductById, getAllUnifiedProducts } from "@/lib/products";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) {
    return {
      title: "Saree Not Found",
    };
  }
  return {
    title: product.name,
    description:
      product.description ||
      `Explore ${product.name} priced at ${product.price}. Handcrafted handloom saree from thiraala.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Find target product dynamically from DB / products.json / sareesData
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />

      <main className="flex-1 py-8 sm:py-12 md:py-16">
        <Container>
          {/* Breadcrumb Navigation */}
          <ProductBreadcrumbs product={product} />

          {/* Product Detail Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mb-20">
            {/* Left Side: Thumbnail Preview Stack & Main Image */}
            <ProductGallery product={product} />

            {/* Right Side: Product Details & Options */}
            <ProductInfo product={product} />
          </div>

          {/* Bottom Section: Related Weaves */}
          <RelatedProducts product={product} />
        </Container>
      </main>

      <div className="w-full border-b border-[#1E3A2C]/10"></div>
      <Footer />
    </div>
  );
}
