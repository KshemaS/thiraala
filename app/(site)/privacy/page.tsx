import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the Privacy Policy of thiraala. Learn how we protect your personal information, handle order data, and safeguard your browsing experience.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />

      <main className="flex-1 py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E3A2C]/5 text-[#1E3A2C] text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#DAA87C]" />
                <span>Legal & Transparency</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A2C] tracking-tight">
                Privacy Policy
              </h1>
              <div className="w-12 h-1 bg-[#DAA87C] mx-auto my-3 rounded-full"></div>
              <p className="text-xs sm:text-sm text-[#1E3A2C]/60">
                Last Updated: October 2026 · Effective Immediately
              </p>
            </div>

            {/* Content Body */}
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-stone-200/60 shadow-sm space-y-8 text-sm text-[#1E3A2C]/80 leading-relaxed font-normal">
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#DAA87C]" />
                  1. Information We Collect
                </h2>
                <p>
                  At <strong>thiraala</strong>, we respect your privacy. When you browse our online boutique, register an account, or order handwoven sarees, we may collect the following information:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1E3A2C]/75">
                  <li><strong>Account Information:</strong> Name, email address, phone number, and encrypted password.</li>
                  <li><strong>Shipping & Delivery Details:</strong> Full delivery address, pincode, city, state, and contact recipient details.</li>
                  <li><strong>Order History:</strong> Order numbers, chosen drapes, payment status, and order fulfillment updates.</li>
                  <li><strong>Device & Browsing Data:</strong> Anonymized analytical data, session cookies, and local preferences (e.g. wishlist and bag items).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C] flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#DAA87C]" />
                  2. How We Use Your Data
                </h2>
                <p>
                  Your information is utilized solely to provide an authentic, seamless shopping experience. Specific purposes include:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-[#1E3A2C]/75">
                  <li>Fulfilling and dispatching your saree orders via trusted postal & express logistics partners.</li>
                  <li>Sending real-time order tracking updates and shipment notifications.</li>
                  <li>Ensuring account security, preventing unauthorized access, and authenticating user sessions.</li>
                  <li>Responding to inquiries submitted via our contact support desk or WhatsApp channel.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#DAA87C]" />
                  3. Payment Security & Third Parties
                </h2>
                <p>
                  <strong>We do not store or process debit/credit card numbers or UPI PINs on our servers.</strong> All payments are processed through PCI-DSS compliant payment gateways with bank-grade encryption. We never sell, rent, or trade your personal data to advertisers or unrelated third parties.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C]">
                  4. Cookies & Local Storage
                </h2>
                <p>
                  We use browser cookies and local storage tokens strictly to maintain your active shopping bag, guest wishlist, and login session. You may disable cookies in your browser settings at any time; however, some shopping features may require active session memory.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-bold text-[#1E3A2C]">
                  5. Contact Our Privacy Officer
                </h2>
                <p>
                  If you have questions about your personal data, wish to request account data deletion, or require privacy assistance, please contact us at:
                </p>
                <div className="p-4 rounded-2xl bg-[#fcfbfa] border border-[#1E3A2C]/10 text-xs sm:text-sm space-y-1">
                  <p><strong>Email:</strong> <a href="mailto:thiraala@gmail.com" className="text-[#DAA87C] font-semibold hover:underline">thiraala@gmail.com</a></p>
                  <p><strong>Phone / WhatsApp:</strong> +91 8921768742</p>
                  <p><strong>Address:</strong> Kakkanad, Kochi, Kerala, India</p>
                </div>
              </section>
            </div>

            {/* Back to Home / Products CTA */}
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
