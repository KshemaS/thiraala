import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import Link from "next/link";
import { Truck, RotateCcw, Clock, MapPin, CheckCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Shipping & Returns Policy",
  description: "thiraala shipping timelines across Kerala and India, and our returns policy: no cancellation after payment; damaged products only, reported on WhatsApp with a parcel opening video.",
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
                <span>Delivery & Returns</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight">
                Shipping & Returns
              </h1>
              <div className="w-12 h-1 bg-[#DAA87C] mx-auto my-3 rounded-full"></div>
              <p className="text-xs sm:text-sm text-[#1E3A2C]/60">
                Transparent delivery schedules, careful packaging, and a clear damaged-product policy.
              </p>
            </div>

            {/* Quick Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                <h3 className="font-bold text-sm text-[#1E3A2C]">Damaged Product Returns</h3>
                <p className="text-xs text-[#1E3A2C]/70">Only damaged products can be returned, via WhatsApp. A parcel opening video is mandatory.</p>
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
                  2. Cancellations & Returns
                </h2>
                <p>
                  <strong>No cancellations after payment.</strong> Once your payment is confirmed, the order can&apos;t be cancelled.
                </p>
                <p>
                  <strong>No returns or exchanges</strong>, except for products that arrive damaged.
                </p>
                <p>
                  <strong>Conditions for a damaged-product return:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1E3A2C]/75">
                  <li>A <strong>parcel opening video is mandatory</strong>: record one continuous, unedited video from the sealed parcel until the damage is visible. Claims without this video can&apos;t be accepted.</li>
                  <li>Report the damage on <strong>WhatsApp</strong> with the video and your Order ID within <strong>48 hours</strong> of delivery.</li>
                  <li>The saree must be unworn, unwashed, and returned with its original tags and packaging.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C]">
                  3. How to Report a Damaged Product
                </h2>
                <p>
                  Damaged-product returns are handled on WhatsApp. Send your Order ID, the parcel opening video and a short note about the damage to:
                </p>
                <div className="p-4 rounded-2xl bg-[#fcfbfa] border border-[#1E3A2C]/10 text-xs sm:text-sm space-y-1">
                  <p><strong>WhatsApp:</strong> <a href={`https://wa.me/918921768742?text=${encodeURIComponent("Hi, I received a damaged saree. Order ID: ")}`} target="_blank" rel="noopener noreferrer" className="text-[#DAA87C] font-semibold hover:underline">+91 8921768742</a></p>
                  <p>Our team will check the video and reply with the next steps for the return.</p>
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
