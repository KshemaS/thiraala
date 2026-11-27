import Header from "@/components/Header";
import Hero from "@/components/Hero";
import OnamCollection from "@/components/OnamCollection";
import CategoryTabs from "@/components/CategoryTabs";
import NewArrivals from "@/components/NewArrivals";
import BestSellers from "@/components/BestSellers";
import PhotoshootSlider from "@/components/PhotoshootSlider";
import InstagramFeed from "@/components/InstagramFeed";
import Footer from "@/components/Footer";
import { EMPTY_HOME, getHomeData } from "@/lib/homeData";

// Built on the server with real products and served from the cache; rebuilt
// at most once a minute, and straight away when a product is saved in the
// dashboard (revalidatePath in the product API routes).
export const revalidate = 60;

export default async function Home() {
  const home = await getHomeData().catch((err) => {
    console.error("Home page data failed to load:", err);
    return EMPTY_HOME;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C]">
      <Header />
      <Hero />
      <PhotoshootSlider />
      <OnamCollection />
      <CategoryTabs categories={home.categories} productsByCategory={home.categoryProducts} fallback={home.newArrivals} />
      <NewArrivals items={home.newArrivals} />
      <BestSellers items={home.bestSellers} />
      <InstagramFeed />
      <div className="w-full border-b border-[#1E3A2C]/15"></div>
      <Footer />
    </div>
  );
}
