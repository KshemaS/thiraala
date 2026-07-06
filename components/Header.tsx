"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full px-6 py-4 lg:px-12 flex items-center justify-between max-w-7xl mx-auto z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 select-none">
        <div className="relative w-30 h-20">
          <Image
            src="/images/thiraala-logo.svg"
            alt="thiraala logo"
            fill
            className="object-contain object-left pointer-events-none"
            priority
          />
        </div>
      </div>

      {/* Center Pill Menu Capsule */}
      <nav className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-full nav-capsule">
        <button className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors flex items-center gap-1 group cursor-pointer">
          Collections
          <svg className="w-3.5 h-3.5 opacity-50 group-hover:text-[#DAA87C] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors flex items-center gap-1 group cursor-pointer">
          Heritage
          <svg className="w-3.5 h-3.5 opacity-50 group-hover:text-[#DAA87C] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors flex items-center gap-1 group cursor-pointer">
          Lookbook
          <svg className="w-3.5 h-3.5 opacity-50 group-hover:text-[#DAA87C] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors cursor-pointer">
          Saree Care
        </button>
        <button className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors flex items-center gap-1 group cursor-pointer">
          Boutiques
          <svg className="w-3.5 h-3.5 opacity-50 group-hover:text-[#DAA87C] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="px-4 py-1.5 text-[13px] font-semibold text-[#1E3A2C]/70 hover:text-[#DAA87C] transition-colors flex items-center gap-1 group cursor-pointer">
          Account
          <svg className="w-3.5 h-3.5 opacity-50 group-hover:text-[#DAA87C] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </nav>

      {/* Right side CTA & Shopping bag */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full btn-animate-border-circle text-[#1E3A2C]/80 hover:text-white transition-all relative group cursor-pointer [--btn-bg:#ffffff] [--btn-hover-bg:#1E3A2C]">
          <svg className="w-[18px] h-[18px] group-hover:scale-105 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#DAA87C] text-white text-[9px] rounded-full flex items-center justify-center font-bold">0</span>
        </button>
        <button className="px-5 py-2.5 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-sm shadow-[#1E3A2C]/10 transition-all hover:scale-[1.02] flex items-center gap-1 group cursor-pointer">
          Sign up 
          <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </header>
  );
}
