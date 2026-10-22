"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/Container";
import RegisterModal from "@/components/RegisterModal";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [isVisible, setIsVisible] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const { user, logout } = useAuth();
  const { wishlist } = useWishlist();
  const { cartCount } = useCart();

  const lastScrollY = useRef(0);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Scroll toggle
  useEffect(() => {
    const threshold = 10;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 100) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;
      if (Math.abs(diff) < threshold) return;

      if (diff > 0) {
        setIsVisible(false);
        setIsMobileNavOpen(false);
        setIsAccountMenuOpen(false);
      } else {
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Outside click listener for Account Menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsAccountMenuOpen(false);
    await logout();
  };

  return (
    <>
      <header
        className={`sticky top-0 w-full z-50 py-2 sm:py-2.5 bg-[#fcfbfa] border-b border-[#1E3A2C]/10 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <Container className="flex items-center justify-between">
          {/* Left: Mobile Hamburger & Brand Logo */}
          {/* Logo */}
          <Link href="/" className="flex items-center select-none cursor-pointer">
            <div className="relative w-20 sm:w-24 h-10 sm:h-14">
              <Image
                src="/images/thiraala-logo.svg"
                alt="thiraala logo"
                fill
                className="object-contain object-left pointer-events-none"
                priority
              />
            </div>
          </Link>

          {/* Center Pill Menu Capsule (Desktop) */}
          <nav className="hidden lg:flex items-center gap-2 px-2 py-1.5 rounded-full nav-capsule">
            <Link
              href="/about"
              className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors cursor-pointer"
            >
              About
            </Link>
            <Link
              href="/products"
              className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors cursor-pointer"
            >
              Products
            </Link>
            <Link
              href="/orders"
              className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors cursor-pointer"
            >
              Orders
            </Link>
            <Link
              href="/contact"
              className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors cursor-pointer"
            >
              Contact
            </Link>
          </nav>

          {/* Right side CTA & Shopping bag */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] min-h-[40px] rounded-full btn-animate-border-circle text-[#1E3A2C]/80 hover:text-white transition-all relative group cursor-pointer [--btn-bg:#ffffff] [--btn-hover-bg:#1E3A2C] flex items-center justify-center flex-shrink-0"
              title="Wishlist"
              aria-label="Wishlist"
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
              className="w-10 h-10 sm:w-11 sm:h-11 min-w-[40px] min-h-[40px] rounded-full btn-animate-border-circle text-[#1E3A2C]/80 hover:text-white transition-all relative group cursor-pointer [--btn-bg:#ffffff] [--btn-hover-bg:#1E3A2C] flex items-center justify-center flex-shrink-0"
              title="Shopping Cart"
              aria-label="Shopping Cart"
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

            {/* User Account / Sign In (Desktop only) */}
            {user ? (
              <div className="hidden lg:block relative group" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                  className="px-4 py-2 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  title={`Account: ${user.firstName}`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                  <span className="truncate">Hi, {user.firstName}!</span>
                  <svg
                    className={`w-3 h-3 flex-shrink-0 transition-transform duration-300 ${
                      isAccountMenuOpen ? "rotate-180" : "group-hover:rotate-180"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu (Accessible on both Tap and Mouse Hover) */}
                <div
                  className={`absolute right-0 mt-2 w-52 bg-white border border-[#1E3A2C]/10 rounded-2xl shadow-xl py-2 z-50 transition-all duration-200 ${
                    isAccountMenuOpen
                      ? "block opacity-100 visible"
                      : "invisible group-hover:visible opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <div className="px-4 py-2 border-b border-[#1E3A2C]/5 text-left">
                    <p className="text-[10px] font-bold text-[#DAA87C] uppercase tracking-wider">Account Info</p>
                    <p className="text-xs font-bold text-[#1E3A2C] truncate mt-1">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[10px] font-semibold text-[#1E3A2C]/60 truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/orders"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-colors flex items-center gap-2.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-[#DAA87C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    My Orders
                  </Link>

                  <Link
                    href="/track-order"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-colors flex items-center gap-2.5 cursor-pointer border-b border-[#1E3A2C]/5"
                  >
                    <svg className="w-3.5 h-3.5 text-[#DAA87C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Track Shipment
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer mt-1"
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
                type="button"
                onClick={() => setIsOpen(true)}
                className="hidden lg:flex px-5 py-2.5 text-xs font-bold whitespace-nowrap btn-animate-border btn-animate-border-dark rounded-full shadow-sm transition-all hover:scale-[1.02] items-center gap-1 group cursor-pointer"
              >
                <span>Sign up</span>
                <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Hamburger Button (Tablet & Mobile - Right Side) */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
              className="lg:hidden w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-colors cursor-pointer flex items-center justify-center flex-shrink-0 relative"
              aria-label="Toggle navigation menu"
            >
              {isMobileNavOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
              {user && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </button>
          </div>
        </Container>

        {/* Mobile Navigation Drawer (TH-003) */}
        {isMobileNavOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[56px] sm:top-[68px] bg-[#fcfbfa]/98 backdrop-blur-md border-b border-[#1E3A2C]/15 shadow-xl z-40 p-5 animate-fade-in">
            <nav className="flex flex-col gap-2">
              <Link
                href="/about"
                onClick={() => setIsMobileNavOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-bold text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-colors flex items-center justify-between"
              >
                <span>About Thiraala</span>
                <span className="text-[#DAA87C]">→</span>
              </Link>
              <Link
                href="/products"
                onClick={() => setIsMobileNavOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-bold text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-colors flex items-center justify-between"
              >
                <span>Products & Collections</span>
                <span className="text-[#DAA87C]">→</span>
              </Link>
              <Link
                href="/orders"
                onClick={() => setIsMobileNavOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-bold text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-colors flex items-center justify-between"
              >
                <span>My Orders</span>
                <span className="text-[#DAA87C]">→</span>
              </Link>
              <Link
                href="/track-order"
                onClick={() => setIsMobileNavOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-bold text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-colors flex items-center justify-between"
              >
                <span>Track Shipment</span>
                <span className="text-[#DAA87C]">→</span>
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileNavOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-bold text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-colors flex items-center justify-between"
              >
                <span>Contact Us</span>
                <span className="text-[#DAA87C]">→</span>
              </Link>

              {/* Sign up / User Profile Section inside Hamburger Menu Drawer */}
              <div className="pt-3 mt-1 border-t border-[#1E3A2C]/10 flex flex-col gap-2">
                {user ? (
                  <div className="p-3.5 bg-[#1E3A2C]/5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1E3A2C]">Hi, {user.firstName}!</p>
                      <p className="text-[10px] text-[#1E3A2C]/60 truncate">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        handleLogout();
                      }}
                      className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                    >
                      Log out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setIsOpen(true);
                    }}
                    className="w-full py-3.5 px-5 rounded-full text-xs font-bold btn-animate-border btn-animate-border-dark text-white flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>Sign up / Sign In</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Registration/Login Modal */}
      <RegisterModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
