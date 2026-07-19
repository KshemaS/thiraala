import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import ProductBreadcrumbs from "@/components/ProductBreadcrumbs";
import ProductGallery from "@/components/ProductGallery";
import ProductInfo from "@/components/ProductInfo";
import RelatedProducts from "@/components/RelatedProducts";
import { sareesData } from "@/data/products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const productId = parseInt(id, 10);

  // Find target product
  const product = sareesData.find((item) => item.id === productId) || sareesData[0];

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />
      <div className="w-full border-b border-[#1E3A2C]/10"></div>

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
