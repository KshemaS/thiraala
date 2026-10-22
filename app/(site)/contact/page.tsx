"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { Headset, Locate, Mail, Phone, ShieldCheck, TruckElectric } from "lucide-react";

// Web3Forms Public Access Key
// Get your free key at https://web3forms.com/
const WEB3FORMS_ACCESS_KEY = "YOUR_ACCESS_KEY_HERE";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    query: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Contact Us | thiraala";
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      setValidationError("Please enter a valid email address with a domain (e.g., name@example.com).");
      return;
    }

    // Validate 10-digit Indian mobile if provided
    if (formData.phone && formData.phone.trim()) {
      const phoneDigits = formData.phone.replace(/[\s-]/g, "");
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phoneDigits)) {
        setValidationError("Please enter a valid 10-digit Indian mobile number starting with 6-9.");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    // If key is not configured, show error warning
    if (WEB3FORMS_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
      setSubmitStatus("error");
      setIsSubmitting(false);
      alert("Please configure your Web3Forms Access Key at the top of app/contact/page.tsx");
      return;
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: formData.name,
          email: formData.email,
          phone: formData.phone || "Not Provided",
          message: formData.query,
          subject: `thiraala Contact Form: Message from ${formData.name}`,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSubmitStatus("success");
        setFormData({ name: "", email: "", phone: "", query: "" });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Failed to submit contact form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />

      <main className="flex-1 py-12 sm:py-16 lg:py-20 flex flex-col justify-between gap-16 lg:gap-24">
        {/* Contact Info and Form Grid Container */}
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto">
            {/* Left Side: Contact Information (5 Columns) */}
            <div className="lg:col-span-5 bg-white p-8 rounded-3xl border border-stone-200/60 shadow-md flex flex-col justify-between space-y-8 select-none">
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A2C] tracking-tight">
                  Contact Information
                </h2>

                <div className="space-y-6">
                  {/* Phone Block */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1E3A2C]/5 flex items-center justify-center text-[#DAA87C] flex-shrink-0 mt-0.5 border border-[#1E3A2C]/10">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1E3A2C]/40 uppercase tracking-widest">
                        Phone
                      </h4>
                      <p className="text-sm font-semibold text-[#1E3A2C] mt-0.5">
                        <a href="tel:+918921768742" className="hover:text-[#DAA87C] transition-colors">
                          +91 8921768742
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Email Block */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1E3A2C]/5 flex items-center justify-center text-[#DAA87C] flex-shrink-0 mt-0.5 border border-[#1E3A2C]/10">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1E3A2C]/40 uppercase tracking-widest">
                        Email
                      </h4>
                      <p className="text-sm font-semibold text-[#1E3A2C] mt-0.5">
                        <a href="mailto:thiraala@gmail.com" className="hover:text-[#DAA87C] transition-colors">
                          thiraala@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Location Block */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1E3A2C]/5 flex items-center justify-center text-[#DAA87C] flex-shrink-0 mt-0.5 border border-[#1E3A2C]/10">
                      <Locate className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1E3A2C]/40 uppercase tracking-widest">
                        Location
                      </h4>
                      <p className="text-sm font-semibold text-[#1E3A2C] mt-0.5">
                        Kakkanad, Kochi, Kerala
                      </p>
                    </div>
                  </div>

                  {/* Business Hours Block */}
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#1E3A2C]/5 flex items-center justify-center text-[#DAA87C] flex-shrink-0 mt-0.5 border border-[#1E3A2C]/10">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1E3A2C]/40 uppercase tracking-widest">
                        Business Hours
                      </h4>
                      <div className="text-sm font-semibold text-[#1E3A2C] mt-0.5 space-y-0.5">
                        <p>Monday - Saturday: 10:00 AM - 6:00 PM</p>
                        <p className="text-[#1E3A2C]/50 font-normal">Sunday: Closed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative note */}
              <div className="pt-6 border-t border-[#1E3A2C]/10 text-xs text-[#1E3A2C]/50 leading-relaxed font-normal">
                Discover our signature handloom collections crafted by our master weavers across Kerala. Visit our boutique in Kakkanad, Kochi or connect with us online.
              </div>
            </div>

            {/* Right Side: Message Form (7 Columns) */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-7 bg-white p-8 rounded-3xl border border-stone-200/60 shadow-md flex flex-col justify-between space-y-6"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A2C] tracking-tight select-none">
                Send us a message
              </h2>

              {validationError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold select-none flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{validationError}</span>
                </div>
              )}

              {submitStatus === "success" && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold select-none">
                  Message sent successfully! We will get back to you shortly.
                </div>
              )}
              {submitStatus === "error" && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold select-none">
                  Failed to send message. Please verify your access key configuration or try again.
                </div>
              )}

              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <input
                    type="text"
                    name="name"
                    disabled={isSubmitting}
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-[#daa87c] text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/40 focus:border-[#1e3a2c] focus:ring-1 focus:ring-[#1e3a2c] transition-all bg-[#fcfbfa]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <input
                    type="email"
                    name="email"
                    disabled={isSubmitting}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your Email"
                    required
                    className="w-full h-12 px-4 rounded-xl border border-[#daa87c] text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/40 focus:border-[#1e3a2c] focus:ring-1 focus:ring-[#1e3a2c] transition-all bg-[#fcfbfa]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Phone Input */}
                <div>
                  <input
                    type="tel"
                    name="phone"
                    disabled={isSubmitting}
                    value={formData.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setFormData((prev) => ({ ...prev, phone: digits }));
                      setValidationError(null);
                    }}
                    placeholder="Your Phone (10-digit mobile number)"
                    maxLength={10}
                    className="w-full h-12 px-4 rounded-xl border border-[#daa87c] text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/40 focus:border-[#1e3a2c] focus:ring-1 focus:ring-[#1e3a2c] transition-all bg-[#fcfbfa]/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Query Textarea */}
                <div>
                  <textarea
                    name="query"
                    rows={4}
                    disabled={isSubmitting}
                    value={formData.query}
                    onChange={handleChange}
                    placeholder="Your Query"
                    required
                    className="w-full p-4 rounded-xl border border-[#daa87c] text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/40 focus:border-[#1e3a2c] focus:ring-1 focus:ring-[#1e3a2c] transition-all bg-[#fcfbfa]/50 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full h-12 rounded-xl font-bold text-xs tracking-wider uppercase transition-colors shadow-md shadow-[#1e3a2c]/10 border-[#1e3a2c] flex items-center justify-center gap-2 ${isSubmitting
                    ? "bg-[#1e3a2c]/65 text-white/80 cursor-not-allowed"
                    : "bg-[#1e3a2c] text-white hover:bg-[#0c2b1c] cursor-pointer"
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          </div>
        </Container>

        {/* Bottom Section: Brand Benefits Section */}
        <div className="w-full bg-[#f8f5ee]/40 border-y border-[#1E3A2C]/10 py-12 select-none">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
              <div className="flex flex-col items-center text-center px-4">
                <TruckElectric size={40} className="mb-4" />
                <h3 className="text-[#1E3A2C] font-bold text-xs uppercase tracking-wider">
                  Fast Delivery
                </h3>
                <p className="text-xs text-[#1E3A2C]/65 mt-1 font-semibold">
                  Prompt & secure shipping
                </p>
              </div>
              <div className="flex flex-col items-center text-center px-4">
                <ShieldCheck size={40} className="mb-4" />
                <h3 className="text-[#1E3A2C] font-bold text-xs uppercase tracking-wider">
                  Authentic Quality
                </h3>
                <p className="text-xs text-[#1E3A2C]/65 mt-1 font-semibold">
                  Guaranteed genuine quality
                </p>
              </div>
              <div className="flex flex-col items-center text-center px-4">
                <Headset size={40} className="mb-4" />
                <h3 className="text-[#1E3A2C] font-bold text-xs uppercase tracking-wider">
                  Customer Support
                </h3>
                <p className="text-xs text-[#1E3A2C]/65 mt-1 font-semibold">
                  Mon–Sat 10:00 AM – 6:00 PM
                </p>
              </div>
            </div>
          </Container>
        </div>
      </main>

      <div className="w-full border-b border-[#1E3A2C]/10"></div>
      <Footer />
    </div>
  );
}
