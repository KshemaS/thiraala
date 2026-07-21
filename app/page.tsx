import Header from "@/components/Header";
import Hero from "@/components/Hero";
import OnamCollection from "@/components/OnamCollection";
import CategoryTabs from "@/components/CategoryTabs";
import NewArrivals from "@/components/NewArrivals";
import BestSellers from "@/components/BestSellers";
import PhotoshootSlider from "@/components/PhotoshootSlider";
import InstagramFeed from "@/components/InstagramFeed";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C]">
      <Header />
      <Hero />
      <PhotoshootSlider />
      <OnamCollection />
      <CategoryTabs />
      <NewArrivals />
      <BestSellers />
      <InstagramFeed />
      <div className="w-full border-b border-[#1E3A2C]/15"></div>
      <Footer />
    </div>
  );
}
