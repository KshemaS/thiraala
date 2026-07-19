"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@/public/images/thiraala-logo.svg";
import Container from "@/components/Container";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white select-none pt-16 pb-12">
      <Container>
        {/* Footer Top Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 items-center gap-10 md:gap-12 pb-12">
          {/* Brand profile column */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 items-start">
              <Image
                src={logo.src}
                alt="thiraala boutique logo"
                width={120}
                height={40}
                className="object-contain"
              />
            </div>
            <p className="text-[#1E3A2C]/70 text-xs md:text-sm leading-relaxed mt-2">
              A curated boutique brand for simple, handpicked daily wear and festive sarees. Bringing effortless elegance straight to your wardrobe.
            </p>
          </div>

          {/* Quick links column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[#1E3A2C] font-bold text-sm tracking-wide">Shop & Explore</h4>
            <ul className="flex flex-col gap-2.5 text-[#1E3A2C]/70 text-xs md:text-sm">
              <li>
                <a href="#" className="hover:text-[#0c2b1c] transition-colors">Onam Collections</a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0c2b1c] transition-colors">Fabric Categories</a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0c2b1c] transition-colors">New Arrivals</a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0c2b1c] transition-colors">Best Sellers</a>
              </li>
            </ul>
          </div>

          {/* Saree care & policies column */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[#1E3A2C] font-bold text-sm tracking-wide">Customer Support</h4>
            <ul className="flex flex-col gap-2.5 text-[#1E3A2C]/70 text-xs md:text-sm">
              <li>
                <a href="#" className="hover:text-[#0c2b1c] transition-colors">Boutique Heritage</a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0c2b1c] transition-colors">Saree Care Guide</a>
              </li>
              <li>
                <a href="#" className="hover:text-[#0c2b1c] transition-colors">Shipping & Returns</a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#0c2b1c] transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* Contact and Social media links */}
          <div className="flex flex-col gap-4">
            <h4 className="text-[#1E3A2C] font-bold text-sm tracking-wide">Connect With Us</h4>
            <div className="flex flex-col gap-2 text-[#1E3A2C]/70 text-xs md:text-sm">
              <p>Email: <a href="mailto:hello@thiraala.com" className="hover:text-[#0c2b1c] font-semibold transition-colors">hello@thiraala.com</a></p>
              <p>Support: <a href="tel:+919876543210" className="hover:text-[#0c2b1c] font-semibold transition-colors">+91 98765 43210</a></p>
            </div>
            
            {/* Social media icons (Instagram, WhatsApp) */}
            <div className="flex items-center gap-4 mt-2">
              {/* Instagram link */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Profile"
                className="w-10 h-10 rounded-full btn-animate-border-circle flex items-center justify-center text-[#1E3A2C] hover:text-white cursor-pointer shadow-sm [--btn-bg:#ffffff] [--btn-hover-bg:#0c2b1c]"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              {/* WhatsApp link */}
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Support Chat"
                className="w-10 h-10 rounded-full btn-animate-border-circle flex items-center justify-center text-[#1E3A2C] hover:text-white cursor-pointer shadow-sm [--btn-bg:#ffffff] [--btn-hover-bg:#0c2b1c]"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.45 5.489 0 9.953-4.43 9.957-9.884.002-2.643-1.022-5.127-2.883-6.992-1.862-1.864-4.347-2.888-6.99-2.889-5.49 0-9.953 4.43-9.957 9.884-.001 1.748.468 3.456 1.358 4.962L1.83 22.17l4.818-1.743z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-[#1E3A2C]/10 text-[#1E3A2C]/50 text-[11px] md:text-xs">
          <span>© {currentYear} thiraala. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#0c2b1c] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#0c2b1c] transition-colors">Terms of Service</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
