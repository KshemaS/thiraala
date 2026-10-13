"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import RegisterModal from "@/components/RegisterModal";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/app/api/orders/route";
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  ShoppingBag,
  RotateCcw,
  MapPin,
  Calendar,
  CreditCard,
  AlertCircle,
} from "lucide-react";

const STATUS_FILTERS = [
  { label: "All Orders", value: "All" },
  { label: "Order Confirmed", value: "Order Confirmed" },
  { label: "Dispatched", value: "Dispatched" },
  { label: "In Transit", value: "In Transit" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
];

function OrdersContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (selectedStatus !== "All") {
        params.set("status", selectedStatus);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      } else if (user?.email) {
        // Automatically retrieve customer's personal orders
        params.set("email", user.email);
      }

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, searchQuery, user]);

  useEffect(() => {
    fetchOrders();

    const handleUpdate = () => fetchOrders();
    window.addEventListener("thiraala-orders-updated", handleUpdate);
    return () => window.removeEventListener("thiraala-orders-updated", handleUpdate);
  }, [fetchOrders]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "delivered":
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case "in transit":
        return {
          bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
          icon: <Truck className="w-3.5 h-3.5 text-indigo-600" />,
        };
      case "dispatched":
      case "shipped":
        return {
          bg: "bg-blue-50 text-blue-800 border-blue-200",
          icon: <Package className="w-3.5 h-3.5 text-blue-600" />,
        };
      case "order confirmed":
      case "confirmed":
      case "processing":
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
        };
      case "cancelled":
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200",
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-600" />,
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-800 border-slate-200",
          icon: <Clock className="w-3.5 h-3.5 text-slate-600" />,
        };
    }
  };

  return (
    <div className="w-full py-8 md:py-14">
      <Container>
        {/* Breadcrumb Navigation */}
        <nav className="text-xs font-semibold text-[#1E3A2C]/50 uppercase tracking-widest mb-8 flex items-center gap-2 select-none">
          <Link href="/" className="hover:text-[#DAA87C] transition-colors">
            Home
          </Link>
          <span>&gt;</span>
          <span className="text-[#1E3A2C] font-bold">My Orders</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#1E3A2C]/10 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A2C] tracking-tight">
              Order History &amp; Consignments
            </h1>
            <p className="text-sm text-[#1E3A2C]/70 mt-2 max-w-xl">
              Track, inspect, and review your handwoven Kerala cotton and kasavu saree orders.
            </p>
          </div>

          <Link
            href="/track-order"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-[#1E3A2C] bg-[#1E3A2C]/5 hover:bg-[#1E3A2C]/10 border border-[#1E3A2C]/10 transition-all self-start md:self-auto"
          >
            <Truck className="w-4 h-4 text-[#DAA87C]" />
            <span>Track by Order ID</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>

        {/* Guest User Notification Banner */}
        {!user && (
          <div className="mb-8 p-5 bg-gradient-to-r from-[#FAF8F5] to-white border border-[#DAA87C]/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DAA87C]/15 flex items-center justify-center flex-shrink-0 text-[#DAA87C]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1E3A2C]">Looking for your recent purchases?</h4>
                <p className="text-xs text-[#1E3A2C]/70 mt-0.5">
                  Sign in to automatically view all sarees ordered under your account, or search with your Order ID below.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-5 py-2 text-xs font-bold text-[#fcfbfa] bg-[#1E3A2C] hover:bg-[#0c2b1c] rounded-full transition-all cursor-pointer whitespace-nowrap shadow-xs"
            >
              Sign In to Your Account
            </button>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
            {STATUS_FILTERS.map((filter) => {
              const isActive = selectedStatus === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#1E3A2C] text-white shadow-xs"
                      : "bg-white text-[#1E3A2C]/70 hover:bg-[#1E3A2C]/5 border border-[#1E3A2C]/10"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#1E3A2C]/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, phone, saree..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#1E3A2C]/15 rounded-xl text-xs text-[#1E3A2C] placeholder:text-[#1E3A2C]/40 focus:outline-none focus:border-[#DAA87C] focus:ring-1 focus:ring-[#DAA87C]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#1E3A2C]/40 hover:text-[#1E3A2C]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Orders Listing Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((sk) => (
              <div
                key={sk}
                className="w-full bg-white border border-[#1E3A2C]/10 rounded-2xl p-6 animate-pulse space-y-4"
              >
                <div className="h-5 bg-[#1E3A2C]/10 rounded-md w-1/4" />
                <div className="h-16 bg-[#1E3A2C]/5 rounded-md w-full" />
                <div className="h-8 bg-[#1E3A2C]/10 rounded-md w-1/3" />
              </div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const badge = getStatusBadge(order.status);
              const orderDate = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent Order";

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#1E3A2C]/10 rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(30,58,44,0.02)] transition-all hover:border-[#1E3A2C]/20"
                >
                  {/* Order Card Header */}
                  <div className="bg-[#FAF8F5] border-b border-[#1E3A2C]/10 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Order ID */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#1E3A2C]/60 font-semibold">Order ID:</span>
                        <strong className="text-xs font-bold text-[#1E3A2C] font-mono tracking-wider">
                          #{order.id}
                        </strong>
                        <button
                          onClick={() => copyToClipboard(order.id)}
                          className="p-1 text-[#1E3A2C]/40 hover:text-[#1E3A2C] transition-colors rounded cursor-pointer"
                          title="Copy Order ID"
                        >
                          {copiedId === order.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Order Date */}
                      <div className="flex items-center gap-1.5 text-xs text-[#1E3A2C]/60 border-l border-[#1E3A2C]/15 pl-4 hidden sm:flex">
                        <Calendar className="w-3.5 h-3.5 text-[#DAA87C]" />
                        <span>{orderDate}</span>
                      </div>

                      {/* Payment Method */}
                      <div className="flex items-center gap-1.5 text-xs text-[#1E3A2C]/60 border-l border-[#1E3A2C]/15 pl-4 hidden md:flex">
                        <CreditCard className="w-3.5 h-3.5 text-[#DAA87C]" />
                        <span>UPI Payment</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                      >
                        {badge.icon}
                        <span>{order.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Order Items Body */}
                  <div className="p-6 divide-y divide-[#1E3A2C]/5">
                    {order.items.map((item, idx) => {
                      const itemImg = item.wornImg || item.foldedImg || "/images/gopura.jpeg";
                      return (
                        <div
                          key={`${item.id}-${idx}`}
                          className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#1E3A2C]/10 flex-shrink-0">
                              <Image
                                src={itemImg}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <Link
                                href={`/products/${item.productId || item.id}`}
                                className="text-sm sm:text-base font-bold text-[#1E3A2C] hover:text-[#DAA87C] transition-colors line-clamp-1"
                              >
                                {item.name}
                              </Link>
                              <div className="text-xs text-[#1E3A2C]/60 mt-1 flex flex-wrap gap-2">
                                <span>Qty: {item.quantity}</span>
                                {item.selectedColor && (
                                  <>
                                    <span>•</span>
                                    <span>Color: {item.selectedColor}</span>
                                  </>
                                )}
                                {item.category && (
                                  <>
                                    <span>•</span>
                                    <span>{item.category}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-sm sm:text-base font-bold text-[#1E3A2C]">
                              {item.price}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Footer & Actions */}
                  <div className="bg-[#FAF8F5]/50 border-t border-[#1E3A2C]/10 px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Shipping Address snippet */}
                    <div className="flex items-center gap-2 text-xs text-[#1E3A2C]/70">
                      <MapPin className="w-4 h-4 text-[#DAA87C] flex-shrink-0" />
                      <span className="truncate max-w-sm">
                        Delivering to: <strong>{order.customerName}</strong>, {order.city || order.district || "Kerala"} ({order.pincode})
                      </span>
                    </div>

                    {/* Total & Action Buttons */}
                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-[#1E3A2C]/60 block">Total Amount</span>
                        <strong className="text-base font-extrabold text-[#1E3A2C]">
                          ₹{Number(order.total).toLocaleString("en-IN")}
                        </strong>
                      </div>

                      <Link
                        href={`/track-order?id=${order.id}`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-[#1E3A2C] hover:bg-[#0c2b1c] transition-all cursor-pointer shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5 text-[#DAA87C]" />
                        <span>Track Shipment</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty Orders State */
          <div className="text-center py-20 bg-white border border-[#1E3A2C]/10 rounded-[32px] p-8 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#1E3A2C]/5 text-[#DAA87C] flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#1E3A2C] mb-2">
              {searchQuery ? "No matching orders found" : "No orders found"}
            </h3>
            <p className="text-sm text-[#1E3A2C]/60 max-w-md mx-auto mb-6">
              {searchQuery
                ? `We couldn't find any orders matching "${searchQuery}". Please verify your order number or phone number.`
                : "You haven't placed any saree orders yet. Discover our latest collection of handcrafted drapes and Kasavu sets."}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="px-6 py-2.5 text-xs font-bold text-[#1E3A2C] border border-[#1E3A2C]/20 hover:bg-[#1E3A2C]/5 rounded-full transition-all cursor-pointer"
              >
                Clear Search
              </button>
            ) : (
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider text-white bg-[#1E3A2C] hover:bg-[#0c2b1c] transition-all cursor-pointer shadow-md"
              >
                Explore Saree Collections
              </Link>
            )}
          </div>
        )}
      </Container>

      {/* Auth Modal if guest opens login */}
      <RegisterModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Header />
      <main className="flex-1">
        <Suspense
          fallback={
            <div className="w-full py-20 flex justify-center items-center">
              <div className="w-8 h-8 border-2 border-[#DAA87C] border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <OrdersContent />
        </Suspense>
      </main>
      <div className="w-full border-b border-[#1E3A2C]/10"></div>
      <Footer />
    </div>
  );
}
