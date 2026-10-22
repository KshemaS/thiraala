import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import Link from "next/link";
import { Truck, RotateCcw, Clock, MapPin, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Returns Policy",
  description: "Learn about thiraala shipping timelines, delivery across Kerala and India, free shipping policy, and hassle-free returns.",
};

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />

      <main className="flex-1 py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] text-xs font-semibold uppercase tracking-wider">
                <Truck className="w-3.5 h-3.5 text-[#DAA87C]" />
                <span>Delivery & Exchanges</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight">
                Shipping & Returns
              </h1>
              <div className="w-12 h-1 bg-[#DAA87C] mx-auto my-3 rounded-full"></div>
              <p className="text-xs sm:text-sm text-[#1E3A2C]/60">
                Transparent delivery schedules, authentic packaging, and 7-day hassle-free returns.
              </p>
            </div>

            {/* Quick Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-xs flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] flex items-center justify-center mb-1">
                  <Truck className="w-5 h-5 text-[#DAA87C]" />
                </div>
                <h3 className="font-bold text-sm text-[#1E3A2C]">Free Delivery Across India</h3>
                <p className="text-xs text-[#1E3A2C]/70">No minimum order amount. We deliver free across all Indian states and postal codes via India Post.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-xs flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] flex items-center justify-center mb-1">
                  <Clock className="w-5 h-5 text-[#DAA87C]" />
                </div>
                <h3 className="font-bold text-sm text-[#1E3A2C]">Prompt Delivery</h3>
                <p className="text-xs text-[#1E3A2C]/70">2 to 4 business days in Kerala; 4 to 7 business days across the rest of India via India Post & Speed Post.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-xs flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] flex items-center justify-center mb-1">
                  <RotateCcw className="w-5 h-5 text-[#DAA87C]" />
                </div>
                <h3 className="font-bold text-sm text-[#1E3A2C]">7-Day Return Policy</h3>
                <p className="text-xs text-[#1E3A2C]/70">Hassle-free return or exchange within 7 days of receiving your saree parcel.</p>
              </div>
            </div>

            {/* Detailed Policy Card */}
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200/60 shadow-sm space-y-8 text-sm text-[#1E3A2C]/80 leading-relaxed font-normal">
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#DAA87C]" />
                  1. Shipping Timelines & Tracking
                </h2>
                <p>
                  Every saree is thoroughly inspected, ironed, and packaged securely from our boutique in Kakkanad, Kochi. We partner with India Post (Speed Post) and premium express couriers.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1E3A2C]/75">
                  <li><strong>Kerala Destinations:</strong> 2 – 4 working days from date of dispatch.</li>
                  <li><strong>Rest of India:</strong> 4 – 7 working days from date of dispatch.</li>
                  <li><strong>Tracking:</strong> You will receive a Speed Post tracking code via SMS/email upon parcel dispatch. You can track your shipment live on our <Link href="/track-order" className="text-[#DAA87C] font-semibold hover:underline">Track Order page</Link>.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C] flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#DAA87C]" />
                  2. 7-Day Return & Exchange Policy
                </h2>
                <p>
                  We want you to love your drape. If you are not satisfied with your purchase, you may initiate a return or exchange within <strong>7 days</strong> of parcel delivery.
                </p>
                <p>
                  <strong>Conditions for Return:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1E3A2C]/75">
                  <li>The saree must be unworn, unwashed, and with all original boutique tags and fold packaging intact.</li>
                  <li>Blouse pieces attached with the saree must be unstitched and uncut.</li>
                  <li>Damaged or defective parcels reported with parcel opening video/photos within 48 hours receive immediate priority replacements.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C]">
                  3. How to Initiate a Return
                </h2>
                <p>
                  To request a return or exchange, simply contact our support team with your Order ID:
                </p>
                <div className="p-4 rounded-2xl bg-[#fcfbfa] border border-[#1E3A2C]/10 text-xs sm:text-sm space-y-1">
                  <p><strong>WhatsApp Support:</strong> <a href="https://wa.me/918921768742" target="_blank" rel="noopener noreferrer" className="text-[#DAA87C] font-semibold hover:underline">+91 8921768742</a></p>
                  <p><strong>Email:</strong> <a href="mailto:thiraala@gmail.com" className="text-[#DAA87C] font-semibold hover:underline">thiraala@gmail.com</a></p>
                  <p><strong>Support Hours:</strong> Monday to Saturday: 10:00 AM – 6:00 PM</p>
                </div>
              </section>
            </div>

            {/* Back CTA */}
            <div className="flex justify-center gap-4 pt-4">
              <Link
                href="/products"
                className="btn-animate-border btn-animate-border-dark px-8 py-3 rounded-full text-xs font-bold text-white shadow-sm"
              >
                Browse Our Sarees
              </Link>
            </div>
          </div>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
