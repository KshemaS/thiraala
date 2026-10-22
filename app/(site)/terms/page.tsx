import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import Link from "next/link";
import { FileCheck, ShoppingCart, RefreshCw, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read the Terms of Service for purchasing handwoven sarees and using services on thiraala.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />

      <main className="flex-1 py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] text-xs font-semibold uppercase tracking-wider">
                <FileCheck className="w-3.5 h-3.5 text-[#DAA87C]" />
                <span>Terms & Agreement</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight">
                Terms of Service
              </h1>
              <div className="w-12 h-1 bg-[#DAA87C] mx-auto my-3 rounded-full"></div>
              <p className="text-xs sm:text-sm text-[#1E3A2C]/60">
                Last Updated: October 2026 · Please read these terms carefully before placing an order.
              </p>
            </div>

            {/* Content Body */}
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200/60 shadow-sm space-y-8 text-sm text-[#1E3A2C]/80 leading-relaxed font-normal">
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C] flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#DAA87C]" />
                  1. Handloom Product Authenticity & Pricing
                </h2>
                <p>
                  All sarees curated on <strong>thiraala</strong> are genuine handloom and powerloom weaves crafted by traditional weavers across Kerala and South India.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1E3A2C]/75">
                  <li><strong>Natural Variations:</strong> Because handloom sarees involve artisanal human craftsmanship, subtle irregularities in thread weave, motifs, or zari texture are hallmarks of authentic weaving, not manufacturing defects.</li>
                  <li><strong>Color Accuracy:</strong> We photograph sarees in true daylight conditions; however, minor color variations may occur depending on your mobile or desktop monitor calibration.</li>
                  <li><strong>Pricing:</strong> All listed prices are in Indian Rupees (₹) and include applicable GST taxes. Delivery is free across India.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C] flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-[#DAA87C]" />
                  2. Orders, Cancellations & Fulfillment
                </h2>
                <p>
                  Orders placed through our website are subject to stock availability. In the rare event that an ordered drape is unavailable due to artisanal loom scheduling, we will notify you immediately and issue a 100% full refund.
                </p>
                <p>
                  You may cancel your order free of charge before the item has been dispatched from our Kochi fulfillment boutique. Once handed over to courier or India Post logistics, standard return guidelines apply.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#DAA87C]" />
                  3. Intellectual Property
                </h2>
                <p>
                  All editorial photographs, saree photography, brand logos, graphics, and descriptions on thiraala.com are protected under copyright laws. Unauthorized reproduction or commercial use without prior written consent is strictly prohibited.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C]">
                  4. Governing Law & Jurisdiction
                </h2>
                <p>
                  These terms are governed by the laws of India. Any legal disputes arising out of the purchase of sarees or use of this platform shall be subject to the exclusive jurisdiction of the competent courts in Ernakulam/Kochi, Kerala.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C]">
                  5. Customer Support
                </h2>
                <div className="p-4 rounded-2xl bg-[#fcfbfa] border border-[#1E3A2C]/10 text-xs sm:text-sm space-y-1">
                  <p><strong>Email:</strong> <a href="mailto:thiraala@gmail.com" className="text-[#DAA87C] font-semibold hover:underline">thiraala@gmail.com</a></p>
                  <p><strong>Support Line:</strong> +91 8921768742 (Mon–Sat 10:00 AM – 6:00 PM)</p>
                  <p><strong>Boutique Location:</strong> Kakkanad, Kochi, Kerala</p>
                </div>
              </section>
            </div>

            {/* Back CTA */}
            <div className="flex justify-center gap-4 pt-4">
              <Link
                href="/products"
                className="btn-animate-border btn-animate-border-dark px-8 py-3 rounded-full text-xs font-bold text-white shadow-sm"
              >
                Shop Saree Collections
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
