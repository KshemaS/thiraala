import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import Link from "next/link";
import { Sparkles, Sun, Droplets, Wind, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Saree Care Guide",
  description: "Essential care, washing, folding, and storage instructions for Kasavu, handloom cotton, and silk sarees from thiraala.",
};

export default function SareeCareGuidePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />

      <main className="flex-1 py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#DAA87C]" />
                <span>Handloom Maintenance</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight">
                Saree Care Guide
              </h1>
              <div className="w-12 h-1 bg-[#DAA87C] mx-auto my-3 rounded-full"></div>
              <p className="text-xs sm:text-sm text-[#1E3A2C]/60">
                Preserve the golden luster of your Kasavu zari and the pristine softness of your handloom cottons for generations.
              </p>
            </div>

            {/* Quick Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-xs flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] flex items-center justify-center mb-1">
                  <Droplets className="w-5 h-5 text-[#DAA87C]" />
                </div>
                <h3 className="font-bold text-sm text-[#1E3A2C]">First Wash</h3>
                <p className="text-xs text-[#1E3A2C]/70">Always dry clean for the first wash to set the organic handloom dye and zari fibers.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-xs flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] flex items-center justify-center mb-1">
                  <Sun className="w-5 h-5 text-[#DAA87C]" />
                </div>
                <h3 className="font-bold text-sm text-[#1E3A2C]">Drying in Shade</h3>
                <p className="text-xs text-[#1E3A2C]/70">Never dry in direct harsh sunlight. Shade drying prevents fading and protects delicate golden borders.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-xs flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] flex items-center justify-center mb-1">
                  <Wind className="w-5 h-5 text-[#DAA87C]" />
                </div>
                <h3 className="font-bold text-sm text-[#1E3A2C]">Periodic Refolding</h3>
                <p className="text-xs text-[#1E3A2C]/70">Change fold lines every 3 to 6 months to prevent creases from weakening the weave fibers.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-xs flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] flex items-center justify-center mb-1">
                  <ShieldAlert className="w-5 h-5 text-[#DAA87C]" />
                </div>
                <h3 className="font-bold text-sm text-[#1E3A2C]">Storage Tips</h3>
                <p className="text-xs text-[#1E3A2C]/70">Wrap pure Kasavu sarees in breathable muslin or cotton cloth. Avoid plastic bags and mothballs directly touching zari.</p>
              </div>
            </div>

            {/* Detailed Instructions by Fabric */}
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200/60 shadow-sm space-y-8 text-sm text-[#1E3A2C]/80 leading-relaxed font-normal">
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C]">
                  1. Traditional Kasavu & Zari Sarees
                </h2>
                <p>
                  Kasavu sarees feature delicate metallic gold zari motifs. To keep them looking fresh and radiant:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1E3A2C]/75">
                  <li>Dry clean only for the initial wear. For subsequent light refreshes, gentle cold water dip with mild liquid detergent.</li>
                  <li>Never wring, squeeze, or brush the zari border.</li>
                  <li>Iron on the reverse side using medium or warm heat with a protective cotton cloth layered over the zari.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C]">
                  2. Handloom Cotton & Mul-Mul Sarees
                </h2>
                <p>
                  Handcrafted cotton sarees offer airy, breathable comfort for daily wear:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1E3A2C]/75">
                  <li>Gentle hand wash in cold water using a mild eco-friendly detergent.</li>
                  <li>Light starching is recommended if you prefer a crisp, formal drape.</li>
                  <li>Steam iron or medium-hot iron while the saree is slightly damp for effortless wrinkle removal.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C]">
                  3. Tissue Silk & Blended Festive Weaves
                </h2>
                <p>
                  Tissue sarees have fine, reflective metallic yarns that require mindful storage:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1E3A2C]/75">
                  <li>Strictly dry clean only to protect sheen and avoid water marks.</li>
                  <li>Store rolled around cardboard tubes or flat inside breathable cotton bags.</li>
                  <li>Never spray perfumes or deodorants directly onto tissue fabric.</li>
                </ul>
              </section>
            </div>

            {/* Back CTA */}
            <div className="flex justify-center gap-4 pt-4">
              <Link
                href="/products"
                className="btn-animate-border btn-animate-border-dark px-8 py-3 rounded-full text-xs font-bold text-white shadow-sm"
              >
                Explore Saree Collections
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
