"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import {
  LogOut,
  Loader2,
  Home,
  ChevronDown,
  ChevronRight,
  Image as ImageIcon,
  Camera,
  FolderTree,
  Package,
  Plus,
  Layers,
} from "lucide-react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout: endSession, user } = useAdminAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHomeOpen, setIsHomeOpen] = useState(true);
  const [isProductsOpen, setIsProductsOpen] = useState(true);

  const isCategoriesRoute =
    pathname === "/dashboard/categories" ||
    pathname === "/dashboard/home/categories" ||
    pathname.startsWith("/dashboard/products/categories");

  // Auto-expand Home/Products dropdown if user is on those routes
  useEffect(() => {
    if (pathname.startsWith("/dashboard/home") && !pathname.startsWith("/dashboard/home/categories")) {
      setIsHomeOpen(true);
    }
    if (
      pathname.startsWith("/dashboard/products") ||
      pathname.startsWith("/dashboard/collections") ||
      isCategoriesRoute
    ) {
      setIsProductsOpen(true);
    }
  }, [pathname, isCategoriesRoute]);

  // proxy.ts redirects unauthenticated requests; this covers a session that
  // expires or is cleared while the dashboard is already open.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const logout = async () => {
    await endSession();
    router.replace("/login");
  };

  // While checking the server session (or redirecting to /login), render a refined brand loader
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#FAF8F5] select-none">
        <div className="relative w-32 h-10 mb-4 animate-pulse">
          <Image
            src="/images/thiraala-logo.svg"
            alt="thiraala logo"
            fill
            className="object-contain"
          />
        </div>
        <div className="flex items-center gap-2.5 text-xs font-semibold text-[#1E3A2C]/70 bg-white px-4 py-2 rounded-full border border-[#1E3A2C]/10 shadow-sm">
          <Loader2 className="w-4 h-4 animate-spin text-[#DAA87C]" />
          <span>Verifying credentials...</span>
        </div>
      </div>
    );
  }

  // Once authenticated, render full dashboard
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F5] text-[#1E3A2C] font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1E3A2C] text-[#FAF8F5] flex-shrink-0 relative z-20">
        {/* Brand/Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-[#FAF8F5]/10">
          <Link href="/dashboard" className="flex items-center gap-3 select-none">
            <div className="relative w-28 h-12">
              <Image
                src="/images/thiraala-logo.svg"
                alt="thiraala logo"
                fill
                className="object-contain object-left pointer-events-none"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <div className="text-[10px] font-bold text-[#FAF8F5]/40 uppercase tracking-widest px-3 mb-2">
            Workspace
          </div>

          {/* Overview Console Link */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pathname === "/dashboard"
                ? "bg-[#FAF8F5]/15 text-white shadow-xs"
                : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
            }`}
          >
            <svg className="w-5 h-5 text-[#DAA87C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Overview Console
          </Link>

          {/* Products Section with Submenus */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsProductsOpen(!isProductsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                pathname.startsWith("/dashboard/products") ||
                pathname.startsWith("/dashboard/collections") ||
                isCategoriesRoute
                  ? "bg-[#FAF8F5]/10 text-white"
                  : "text-[#FAF8F5]/75 hover:text-white hover:bg-[#FAF8F5]/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-[#DAA87C]" />
                <span>Products</span>
              </div>
              <div className="text-[#FAF8F5]/50">
                {isProductsOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#DAA87C]" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {isProductsOpen && (
              <div className="mt-1 pl-4 space-y-1">
                <Link
                  href="/dashboard/products"
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/dashboard/products"
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>All Products</span>
                  </div>
                </Link>

                <Link
                  href="/dashboard/categories"
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isCategoriesRoute
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderTree className="w-4 h-4 text-[#DAA87C]" />
                    <span>Categories</span>
                  </div>
                </Link>

                <Link
                  href="/dashboard/collections"
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname.startsWith("/dashboard/collections")
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#DAA87C]" />
                    <span>Collections</span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Home Section with Submenus */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsHomeOpen(!isHomeOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                pathname.startsWith("/dashboard/home") && !isCategoriesRoute
                  ? "bg-[#FAF8F5]/10 text-white"
                  : "text-[#FAF8F5]/75 hover:text-white hover:bg-[#FAF8F5]/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-[#DAA87C]" />
                <span>Home</span>
              </div>
              <div className="text-[#FAF8F5]/50">
                {isHomeOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#DAA87C]" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Submenu: Banner & Editorial */}
            {isHomeOpen && (
              <div className="mt-1 pl-4 space-y-1">
                <Link
                  href="/dashboard/home/banner"
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/dashboard/home/banner"
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>Banner</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAF8F5]/10 text-[#FAF8F5]/70 font-mono">
                    3
                  </span>
                </Link>

                <Link
                  href="/dashboard/home/editorial"
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/dashboard/home/editorial"
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4" />
                    <span>Editorial</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer with Logout */}
        <div className="p-4 border-t border-[#FAF8F5]/10 space-y-2">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#FAF8F5]/70 hover:text-white hover:bg-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sign Out</span>
          </button>
          <p className="text-[10px] text-[#FAF8F5]/40 text-center">thiraala Admin Panel v1.0</p>
        </div>
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#1E3A2C]/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#1E3A2C] text-[#FAF8F5] z-40 transition-transform duration-300 transform md:hidden flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-20 flex items-center px-6 border-b border-[#FAF8F5]/10 justify-between">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="relative w-28 h-12">
              <Image
                src="/images/thiraala-logo.svg"
                alt="thiraala logo"
                fill
                className="object-contain object-left pointer-events-none"
                priority
              />
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 rounded-full hover:bg-white/10 text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-[#FAF8F5]/40 uppercase tracking-widest px-3 mb-1">
            Workspace
          </div>
          {/* Overview Console Link */}
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pathname === "/dashboard"
                ? "bg-[#FAF8F5]/15 text-white shadow-xs"
                : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
            }`}
          >
            <svg className="w-5 h-5 text-[#DAA87C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Overview Console
          </Link>

          {/* Mobile Products Section */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsProductsOpen(!isProductsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                pathname.startsWith("/dashboard/products") ||
                pathname.startsWith("/dashboard/collections") ||
                isCategoriesRoute
                  ? "bg-[#FAF8F5]/10 text-white"
                  : "text-[#FAF8F5]/75 hover:text-white hover:bg-[#FAF8F5]/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-[#DAA87C]" />
                <span>Products</span>
              </div>
              <div className="text-[#FAF8F5]/50">
                {isProductsOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#DAA87C]" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {isProductsOpen && (
              <div className="mt-1 pl-4 space-y-1">
                <Link
                  href="/dashboard/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/dashboard/products"
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>All Products</span>
                  </div>
                </Link>

                <Link
                  href="/dashboard/products/create"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/dashboard/products/create"
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Plus className="w-4 h-4 text-[#DAA87C]" />
                    <span>Add Product</span>
                  </div>
                </Link>

                <Link
                  href="/dashboard/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isCategoriesRoute
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderTree className="w-4 h-4 text-[#DAA87C]" />
                    <span>Categories</span>
                  </div>
                </Link>

                <Link
                  href="/dashboard/collections"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname.startsWith("/dashboard/collections")
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-[#DAA87C]" />
                    <span>Collections</span>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Home Section */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsHomeOpen(!isHomeOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                pathname.startsWith("/dashboard/home") && !isCategoriesRoute
                  ? "bg-[#FAF8F5]/10 text-white"
                  : "text-[#FAF8F5]/75 hover:text-white hover:bg-[#FAF8F5]/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-5 h-5 text-[#DAA87C]" />
                <span>Home</span>
              </div>
              <div className="text-[#FAF8F5]/50">
                {isHomeOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#DAA87C]" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Mobile Submenu: Banner & Editorial */}
            {isHomeOpen && (
              <div className="mt-1 pl-4 space-y-1">
                <Link
                  href="/dashboard/home/banner"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/dashboard/home/banner"
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>Banner</span>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FAF8F5]/10 text-[#FAF8F5]/70 font-mono">
                    3
                  </span>
                </Link>

                <Link
                  href="/dashboard/home/editorial"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    pathname === "/dashboard/home/editorial"
                      ? "bg-[#DAA87C]/20 text-[#DAA87C] font-bold border-l-2 border-[#DAA87C]"
                      : "text-[#FAF8F5]/70 hover:text-white hover:bg-[#FAF8F5]/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Camera className="w-4 h-4" />
                    <span>Editorial</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Sign Out Button */}
        <div className="p-4 border-t border-[#FAF8F5]/10">
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-[#1E3A2C]/10 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-all md:hidden"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Mobile Brand Logo */}
            <Link href="/dashboard" className="md:hidden flex items-center select-none">
              <div className="relative w-24 h-10">
                <Image
                  src="/images/thiraala-logo.svg"
                  alt="thiraala logo"
                  fill
                  className="object-contain object-left pointer-events-none"
                  priority
                />
              </div>
            </Link>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[#1E3A2C] tracking-tight">Admin</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search Input Simulation */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1E3A2C]/10 bg-[#FAF8F5] w-64">
              <svg className="w-4 h-4 text-[#1E3A2C]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search analytics, SKUs..."
                className="text-xs bg-transparent border-none outline-none w-full text-[#1E3A2C]"
                disabled
              />
            </div>

            {/* Notification Badge */}
            <button className="p-2.5 rounded-full hover:bg-[#1E3A2C]/5 text-[#1E3A2C] transition-all relative">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DAA87C] rounded-full"></span>
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 border-l border-[#1E3A2C]/10 pl-3 sm:pl-4 select-none">
              <div className="w-8 h-8 rounded-full bg-[#1E3A2C] text-[#DAA87C] font-bold text-xs flex items-center justify-center uppercase border border-[#DAA87C]/30 shadow-inner">
                {user?.username ? user.username.slice(0, 2).toUpperCase() : "AD"}
              </div>
              <div className="hidden xl:block text-left leading-none">
                <p className="text-xs font-bold text-[#1E3A2C]">{user?.name || "Admin Director"}</p>
                <p className="text-[9px] text-[#1E3A2C]/50 mt-0.5">{user?.role || "super_admin"}</p>
              </div>
            </div>

            {/* Sign Out Action Button */}
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5] text-xs font-semibold text-[#1E3A2C] hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page View Wrapper */}
        <main className="flex-1 overflow-y-auto bg-[#FAF8F5]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AdminAuthProvider>
  );
}
