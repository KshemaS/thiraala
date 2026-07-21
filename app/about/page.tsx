"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AboutHero from "@/components/AboutHero";
import AboutFounder from "@/components/AboutFounder";
import MissionVision from "@/components/MissionVision";
import Craftsmanship from "@/components/Craftsmanship";
import AboutPromise from "@/components/AboutPromise";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C]">
      <Header />

      <main className="flex-1 w-full bg-[#fcfbfa] flex flex-col gap-[60px] md:gap-[80px] lg:gap-[140px]">
        <AboutHero />
        <AboutFounder />
        <MissionVision />
        <Craftsmanship />
        <AboutPromise />
      </main>

      <div className="w-full border-b border-[#1E3A2C]/15"></div>
      <Footer />
    </div>
  );
}
