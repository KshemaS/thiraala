"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import RegisterModal from "@/components/RegisterModal";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  
  const { wishlist } = useWishlist();
  const { cartCount } = useCart();

  const lastScrollY = useRef(0);

  useEffect(() => {
    // Load user from localStorage on mount
    const storedUser = localStorage.getItem("thiraala_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }

    const threshold = 10; // Minimum scroll change to trigger a hide/show toggle

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show header at the very top
      if (currentScrollY <= 100) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Calculate difference between last scroll position and current
      const diff = currentScrollY - lastScrollY.current;

      // Filter out micro-scrolls and hand wobbles
      if (Math.abs(diff) < threshold) {
        return;
      }

      if (diff > 0) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);



  const handleLogout = () => {
    localStorage.removeItem("thiraala_user");
    setUser(null);
  };

  return (
    <>
      <header
        className={`sticky top-0 w-full z-50 py-2.5 bg-[#fcfbfa] border-b border-[#1E3A2C]/10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <Container className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 select-none cursor-pointer">
            <div className="relative w-24 h-14">
              <Image
                src="/images/thiraala-logo.svg"
                alt="thiraala logo"
                fill
                className="object-contain object-left pointer-events-none"
                priority
              />
            </div>
          </Link>

          {/* Center Pill Menu Capsule */}
          <nav className="hidden lg:flex items-center gap-2 px-2 py-1.5 rounded-full nav-capsule">
            <Link href="/about" className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors cursor-pointer">
              About
            </Link>
            <Link href="/products" className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors cursor-pointer">
              Products
            </Link>
            <Link href="/contact" className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors cursor-pointer">
              Contact
            </Link>
          </nav>

          {/* Right side CTA & Shopping bag */}
          <div className="flex items-center gap-3">
            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="p-2 rounded-full btn-animate-border-circle text-[#1E3A2C]/80 hover:text-white transition-all relative group cursor-pointer [--btn-bg:#ffffff] [--btn-hover-bg:#1E3A2C] flex items-center justify-center"
            >
              <svg className="w-[18px] h-[18px] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold animate-pulse">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Shopping Bag Icon */}
            <Link
              href="/cart"
              className="p-2 rounded-full btn-animate-border-circle text-[#1E3A2C]/80 hover:text-white transition-all relative group cursor-pointer [--btn-bg:#ffffff] [--btn-hover-bg:#1E3A2C] flex items-center justify-center"
            >
              <svg className="w-[18px] h-[18px] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#DAA87C] text-white text-[9px] rounded-full flex items-center justify-center font-bold animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group">
                <button className="px-5 py-2.5 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-sm shadow-[#1E3A2C]/10 transition-all flex items-center gap-2 cursor-pointer">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Hi, {user.firstName}!
                  <svg className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white border border-[#1E3A2C]/10 rounded-2xl shadow-xl py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                  <div className="px-4 py-2 border-b border-[#1E3A2C]/5 text-left">
                    <p className="text-[10px] font-bold text-[#DAA87C] uppercase tracking-wider">Account Info</p>
                    <p className="text-xs font-bold text-[#1E3A2C] truncate mt-1">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] font-semibold text-[#1E3A2C]/60 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsOpen(true)}
                className="px-5 py-2.5 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-sm shadow-[#1E3A2C]/10 transition-all hover:scale-[1.02] flex items-center gap-1 group cursor-pointer"
              >
                Sign up
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </Container>
      </header>

      {/* Registration/Login Modal */}
      <RegisterModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onRegisterSuccess={(userData) => setUser(userData)}
      />
    </>
  );
}
