import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import ProductBreadcrumbs from "@/components/ProductBreadcrumbs";
import ProductDetailView from "@/components/ProductDetailView";
import RelatedProducts from "@/components/RelatedProducts";
import { getProductById, type UnifiedProduct } from "@/lib/products";
import { NO_PHOTO } from "@/lib/placeholder";
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
  const description =
    product.description ||
    `Explore ${product.name} priced at ${product.price}. Handcrafted handloom saree from thiraala.`;
  const photo = product.wornImg && product.wornImg !== NO_PHOTO ? product.wornImg : product.foldedImg;
  return {
    title: product.name,
    description,
    // The same saree is reachable by id, SKU or slug; this is the one address to index.
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: product.name,
      description,
      url: `/products/${product.id}`,
      images: photo && photo !== NO_PHOTO ? [{ url: photo, alt: product.altWorn || product.name }] : undefined,
    },
  };
}

const SITE = "https://www.thiraala.com";
const absolute = (path: string) => (path.startsWith("http") ? path : `${SITE}${path}`);

/** schema.org Product data, so search results can show the price and whether it's in stock. */
function productJsonLd(product: UnifiedProduct) {
  const photos = [product.wornImg, product.foldedImg].filter((p): p is string => !!p && p !== NO_PHOTO);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    sku: product.sku,
    image: [...new Set(photos)].map(absolute),
    brand: { "@type": "Brand", name: "thiraala" },
    category: product.category,
    color: product.color || undefined,
    material: product.sareeFabric || product.fabric || undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE}/products/${product.id}`,
      priceCurrency: "INR",
      price: product.priceValue,
      availability: product.soldOut ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Find the product in the database by id, SKU or slug
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />
      <script
        type="application/ld+json"
        // "<" escaped so text in a product description can't end the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c") }}
      />

      <main className="flex-1 py-8 sm:py-12 md:py-16">
        <Container>
          {/* Breadcrumb Navigation */}
          <ProductBreadcrumbs product={product} />

          {/* Product Detail Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start mb-20">
            {/* Photos + details share the selected colour variant */}
            <ProductDetailView product={product} />
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
