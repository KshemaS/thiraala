"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Phone,
} from "lucide-react";
import { Order } from "@/app/api/orders/route";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [orderId, setOrderId] = useState(initialId);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const fetchOrder = async (idToSearch: string) => {
    const cleanId = idToSearch.trim();
    if (!cleanId) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(cleanId)}`);
      const data = await res.json();

      if (data.success && data.order) {
        setOrder(data.order);
      } else {
        setOrder(null);
        setError(`No order found with ID "${cleanId}". Please verify your order confirmation ID.`);
      }
    } catch (err) {
      console.error("Error looking up order:", err);
      setError("Unable to retrieve order details. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchOrder(initialId);
    }
  }, [initialId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrder(orderId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "In Transit":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Dispatched":
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Order Confirmed":
      case "Confirmed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#FAF8F5]">
      <Header />

      <main className="flex-1 py-10 sm:py-16">
        <Container>
          {/* Page Heading */}
          <div className="max-w-2xl mx-auto text-center mb-10 select-none">
            <span className="text-[11px] font-bold tracking-widest text-[#DAA87C] uppercase">
              Live Consignment Status
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A2C] mt-2 tracking-tight">
              Track Your Drape Order
            </h1>
            <p className="text-xs sm:text-sm text-[#1E3A2C]/65 mt-2.5 max-w-md mx-auto">
              Enter your Thiraala Order ID (e.g. THR-1081) to follow your handloom package from our artisan looms to your doorstep.
            </p>

            {/* Order Search Box */}
            <form onSubmit={handleSearchSubmit} className="mt-6 flex items-center max-w-md mx-auto relative">
              <div className="relative w-full">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="Enter Order ID (e.g. THR-1081)"
                  className="w-full h-13 pl-12 pr-28 rounded-full border border-[#1E3A2C]/15 bg-white shadow-sm text-xs sm:text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#DAA87C] focus:ring-2 focus:ring-[#DAA87C]/20 outline-none transition-all"
                />
                <Search className="w-4 h-4 text-[#1E3A2C]/40 absolute left-4.5 top-1/2 -translate-y-1/2" />
                <button
                  type="submit"
                  disabled={isLoading || !orderId.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-5 bg-[#1E3A2C] hover:bg-[#0c2b1c] text-white rounded-full text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Track</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Helper pill */}
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-[#1E3A2C]/50 font-medium">
              <span>Try sample orders:</span>
              <button
                type="button"
                onClick={() => {
                  setOrderId("THR-1081");
                  fetchOrder("THR-1081");
                }}
                className="underline hover:text-[#1E3A2C] font-semibold cursor-pointer"
              >
                THR-1081
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => {
                  setOrderId("THR-1082");
                  fetchOrder("THR-1082");
                }}
                className="underline hover:text-[#1E3A2C] font-semibold cursor-pointer"
              >
                THR-1082
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-xl mx-auto mb-8 p-4 bg-red-50 border border-red-200/80 rounded-2xl flex items-center gap-3 text-red-800 text-xs font-semibold">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Details & Tracking Card */}
          {order && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Order Status Header Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#1E3A2C]/10 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E3A2C]/5">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-[#1E3A2C] tracking-tight">
                        Order #{order.id}
                      </h2>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-[#1E3A2C]/50 mt-1">
                      Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.trackingNumber && (
                      <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#1E3A2C]/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1E3A2C]">
                        <Truck className="w-3.5 h-3.5 text-[#DAA87C]" />
                        <span>{order.courierName || "Courier"}:</span>
                        <span className="font-mono font-bold">{order.trackingNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(order.trackingNumber || "")}
                          className="ml-1 text-[#1E3A2C]/50 hover:text-[#1E3A2C] cursor-pointer"
                          title="Copy tracking number"
                        >
                          {copiedTracking ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Horizontal Visual Progress Bar */}
                {order.status !== "Cancelled" && (
                  <div className="pt-8 pb-4 border-b border-[#1E3A2C]/10 mb-8">
                    <div className="grid grid-cols-4 relative max-w-xl mx-auto">
                      {/* Connected Line Background */}
                      <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-[#1E3A2C]/10 rounded-full -z-0" />

                      {/* Active Connected Line */}
                      {(() => {
                        const stageIndex =
                          order.status === "Delivered"
                            ? 3
                            : order.status === "In Transit"
                            ? 2
                            : order.status === "Dispatched" || order.status === "Shipped"
                            ? 1
                            : order.status === "Order Confirmed" || order.status === "Confirmed"
                            ? 0
                            : -1;
                        const widthPct =
                          stageIndex === 3
                            ? "100%"
                            : stageIndex === 2
                            ? "66%"
                            : stageIndex === 1
                            ? "33%"
                            : stageIndex === 0
                            ? "5%"
                            : "0%";
                        return (
                          <div
                            style={{ width: `calc(${widthPct} * 0.76)` }}
                            className="absolute top-4 left-[12%] h-1 bg-emerald-600 rounded-full transition-all duration-700 -z-0"
                          />
                        );
                      })()}

                      {[
                        {
                          title: "Confirmed",
                          icon: CheckCircle2,
                          statusMatch: [
                            "Order Confirmed",
                            "Confirmed",
                            "Dispatched",
                            "Shipped",
                            "In Transit",
                            "Delivered",
                          ],
                        },
                        {
                          title: "Dispatched",
                          icon: Package,
                          statusMatch: ["Dispatched", "Shipped", "In Transit", "Delivered"],
                        },
                        {
                          title: "In Transit",
                          icon: Truck,
                          statusMatch: ["In Transit", "Delivered"],
                        },
                        {
                          title: "Delivered",
                          icon: Check,
                          statusMatch: ["Delivered"],
                        },
                      ].map((st, i) => {
                        const isReached = st.statusMatch.includes(order.status);
                        const isCurrent =
                          (st.title === "Confirmed" &&
                            (order.status === "Order Confirmed" || order.status === "Confirmed")) ||
                          (st.title === "Dispatched" &&
                            (order.status === "Dispatched" || order.status === "Shipped")) ||
                          (st.title === "In Transit" && order.status === "In Transit") ||
                          (st.title === "Delivered" && order.status === "Delivered");
                        const Icon = st.icon;

                        return (
                          <div key={i} className="flex flex-col items-center text-center z-10">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                isCurrent
                                  ? "bg-[#1E3A2C] text-white ring-4 ring-[#DAA87C]/30 shadow-md"
                                  : isReached
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white border-2 border-[#1E3A2C]/20 text-[#1E3A2C]/40"
                              }`}
                            >
                              <Icon className="w-4 h-4 stroke-[2.5]" />
                            </div>
                            <span
                              className={`text-[11px] font-bold mt-2 ${
                                isReached ? "text-[#1E3A2C]" : "text-[#1E3A2C]/40"
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Progress Stepper Timeline */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A2C]/60 mb-6 select-none">
                    Tracking Timeline
                  </h3>

                  <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1E3A2C]/10">
                    {order.trackingTimeline.map((step, idx) => {
                      const isCompleted = step.completed;
                      const isCurrent =
                        isCompleted &&
                        (idx === order.trackingTimeline.length - 1 ||
                          !order.trackingTimeline[idx + 1]?.completed);

                      return (
                        <div key={idx} className="relative group">
                          {/* Stepper Dot */}
                          <div
                            className={`absolute -left-[23px] sm:-left-[31px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? isCurrent
                                  ? "bg-[#1E3A2C] text-white ring-4 ring-[#DAA87C]/30 shadow-sm"
                                  : "bg-emerald-600 text-white"
                                : "bg-white border-2 border-[#1E3A2C]/20 text-[#1E3A2C]/30"
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A2C]/30" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                            <div>
                              <h4
                                className={`text-xs sm:text-sm font-bold ${
                                  isCompleted ? "text-[#1E3A2C]" : "text-[#1E3A2C]/40"
                                }`}
                              >
                                {step.title}
                              </h4>
                              <p
                                className={`text-[11px] mt-0.5 leading-relaxed ${
                                  isCompleted ? "text-[#1E3A2C]/70" : "text-[#1E3A2C]/40"
                                }`}
                              >
                                {step.description}
                              </p>
                            </div>
                            {step.timestamp && (
                              <span className="text-[10px] font-semibold text-[#1E3A2C]/40 whitespace-nowrap sm:text-right mt-1 sm:mt-0 font-mono">
                                {new Date(step.timestamp).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Order Items & Shipping Address Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Items in Consignment */}
                <div className="bg-white rounded-3xl p-6 border border-[#1E3A2C]/10 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A2C]/60 mb-4 select-none">
                    Items in Package ({order.items.reduce((s, i) => s + i.quantity, 0)})
                  </h3>
                  <div className="space-y-3.5 divide-y divide-[#1E3A2C]/5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-3.5 ${idx > 0 ? "pt-3.5" : ""}`}>
                        <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#1E3A2C]/10 flex-shrink-0">
                          <img
                            src={item.foldedImg || "/images/folded-gopuram.jpeg"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-[#1E3A2C] truncate">{item.name}</h4>
                          <p className="text-[10px] text-[#1E3A2C]/50 mt-0.5">
                            Qty: <span className="font-semibold">{item.quantity}</span>
                            {item.selectedColor ? ` · ${item.selectedColor}` : ""}
                          </p>
                          <span className="text-xs font-extrabold text-[#1E3A2C] mt-1 inline-block">
                            {item.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#1E3A2C]/10 flex items-center justify-between text-xs font-bold text-[#1E3A2C]">
                    <span>Total Amount Paid / Payable:</span>
                    <span className="text-sm font-extrabold text-[#1E3A2C]">
                      ₹{order.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Shipping & Payment Destination */}
                <div className="bg-white rounded-3xl p-6 border border-[#1E3A2C]/10 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A2C]/60 mb-4 select-none">
                      Delivery Address & Contact
                    </h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#1E3A2C]/40 block">Recipient</span>
                        <p className="font-bold text-[#1E3A2C] mt-0.5">{order.customerName}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#1E3A2C]/40 block">Shipping Location</span>
                        <p className="font-medium text-[#1E3A2C]/80 mt-0.5 leading-relaxed">{order.address}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#1E3A2C]/40 block">Contact</span>
                        <p className="font-medium text-[#1E3A2C]/80 mt-0.5">{order.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#1E3A2C]/10 flex items-center justify-between text-xs">
                    <span className="text-[#1E3A2C]/60 font-medium">Payment Mode</span>
                    <span className="font-bold text-[#1E3A2C] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#1E3A2C]/10">
                      {order.paymentMethod === "COD" ? "Cash on Delivery" : "UPI Digital"} ({order.paymentStatus})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
          <div className="w-6 h-6 border-2 border-[#1E3A2C] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
