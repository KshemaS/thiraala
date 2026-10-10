"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { sareesData, SareeProduct } from "@/data/products";

// Interfaces
interface Order {
  id: string;
  customerName: string;
  email: string;
  date: string;
  sku: string;
  productName: string;
  quantity: number;
  total: number;
  status: "Pending" | "Shipped" | "Delivered" | "Cancelled";
}

interface CustomerMessage {
  id: string;
  sender: string;
  email: string;
  date: string;
  subject: string;
  content: string;
  status: "Pending" | "Replied";
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "messages">("overview");

  // State initialized with mock data
  const [products, setProducts] = useState<SareeProduct[]>(sareesData);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "THR-1081",
      customerName: "Ananya Nair",
      email: "ananya.nair@gmail.com",
      date: "2026-08-28",
      sku: "SAR_TIS_01",
      productName: "Thumba Saree",
      quantity: 1,
      total: 1350,
      status: "Delivered",
    },
    {
      id: "THR-1082",
      customerName: "Rahul Krishnan",
      email: "rahul.k@yahoo.com",
      date: "2026-08-29",
      sku: "SAR_COT_002",
      productName: "Puliyilakkara",
      quantity: 1,
      total: 499,
      status: "Shipped",
    },
    {
      id: "THR-1083",
      customerName: "Divya Menon",
      email: "divya.menon@outlook.com",
      date: "2026-08-30",
      sku: "SAR_MUL_003",
      productName: "Mul Cotton White",
      quantity: 2,
      total: 2180,
      status: "Pending",
    },
    {
      id: "THR-1084",
      customerName: "Meera Pillai",
      email: "meera.pillai@gmail.com",
      date: "2026-08-30",
      sku: "SAR_TIS_04",
      productName: "Vaka Saree",
      quantity: 1,
      total: 1250,
      status: "Pending",
    },
    {
      id: "THR-1085",
      customerName: "Vishnu Dev",
      email: "vishnu.dev@hotmail.com",
      date: "2026-08-27",
      sku: "SAR_COT_006",
      productName: "Chemparuthi Saree",
      quantity: 1,
      total: 899,
      status: "Cancelled",
    },
    {
      id: "THR-1086",
      customerName: "Saritha Varma",
      email: "saritha.v@gmail.com",
      date: "2026-08-26",
      sku: "SAR_CHA_005",
      productName: "Chanderi Fire",
      quantity: 1,
      total: 1950,
      status: "Delivered",
    },
  ]);

  // Sync with live orders from API
  useEffect(() => {
    const fetchLiveOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          const mapped: Order[] = data.orders.map((o: any) => ({
            id: o.id,
            customerName: o.customerName,
            email: o.email || o.phone,
            date: new Date(o.createdAt).toISOString().split("T")[0],
            sku: o.items?.[0]?.sku || "SAR_DRP",
            productName: o.items?.[0]?.name || "Handloom Saree",
            quantity: o.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1,
            total: o.total,
            status: (o.status === "Confirmed" ? "Pending" : o.status) as any,
          }));
          setOrders(mapped);
        }
      } catch (err) {
        console.error("Failed to load live orders for overview:", err);
      }
    };

    fetchLiveOrders();
    window.addEventListener("thiraala-orders-updated", fetchLiveOrders);
    return () => {
      window.removeEventListener("thiraala-orders-updated", fetchLiveOrders);
    };
  }, []);

  const [messages, setMessages] = useState<CustomerMessage[]>([
    {
      id: "MSG-001",
      sender: "Priya Nair",
      email: "priya.nair@gmail.com",
      date: "2026-08-29",
      subject: "Custom Saree Blouse Stitching Inquiry",
      content: "Do you offer custom blouse stitching with the Golden Tissue Set saree? If so, what are the measurement details and pricing guidelines?",
      status: "Pending",
    },
    {
      id: "MSG-002",
      sender: "Gautham R.",
      email: "gautham.r@yahoo.com",
      date: "2026-08-30",
      subject: "Bulk Purchase for Wedding Function",
      content: "We are looking to purchase about 15 units of Chemparuthi saree for bridesmaids at an upcoming wedding. Is there any special discount or custom packing available?",
      status: "Pending",
    },
    {
      id: "MSG-003",
      sender: "Sruthi P.",
      email: "sruthi.p@outlook.com",
      date: "2026-08-28",
      subject: "Checking Order Dispatch Timeline",
      content: "Hi, I ordered the Puliyilakkara saree three days ago (Order THR-1082). Just wanted to know if it has been dispatched, as I need it by next Friday.",
      status: "Replied",
    },
  ]);

  // Search & Filter States
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("All");
  const [productStockStatus, setProductStockStatus] = useState("All");

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");

  // Interaction Modal States
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Computed metrics
  const stats = useMemo(() => {
    const activeOrders = orders.filter((o) => o.status !== "Cancelled");
    const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = activeOrders.length ? Math.round(totalRevenue / activeOrders.length) : 0;
    const totalSareesSold = activeOrders.reduce((sum, o) => sum + o.quantity, 0);
    
    // Calculate stock metrics
    const outOfStockCount = products.filter((p) => (p.stock ?? 0) === 0).length;
    const lowStockCount = products.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 2).length;

    return {
      totalRevenue,
      avgOrderValue,
      totalSareesSold,
      orderCount: orders.length,
      outOfStockCount,
      lowStockCount,
      customerCount: 142, // Simulated customer base
    };
  }, [orders, products]);

  // Product Categories
  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(cats)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = productCategory === "All" || p.category === productCategory;
      
      let matchesStock = true;
      if (productStockStatus === "In Stock") {
        matchesStock = (p.stock ?? 0) > 0;
      } else if (productStockStatus === "Out of Stock") {
        matchesStock = (p.stock ?? 0) === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, productSearch, productCategory, productStockStatus]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.sku.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = orderStatusFilter === "All" || o.status === orderStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Handlers
  const handleUpdateStock = (productId: number, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const currentStock = p.stock ?? 0;
          const newStock = Math.max(0, currentStock + delta);
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
  };

  const handleToggleStock = (productId: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const currentStock = p.stock ?? 0;
          return { ...p, stock: currentStock > 0 ? 0 : 5 }; // Toggle between out of stock and fallback stock of 5
        }
        return p;
      })
    );
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleSendMessageReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setIsReplying(true);
    // Simulate API delay
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessage.id ? { ...m, status: "Replied" } : m
        )
      );
      setIsReplying(false);
      setSelectedMessage(null);
      setReplyText("");
    }, 1000);
  };

  const handleDeleteMessage = (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    if (selectedMessage?.id === msgId) {
      setSelectedMessage(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Navigation Tabs */}
      <div className="flex border-b border-[#1E3A2C]/10 gap-2 overflow-x-auto pb-px">
        {[
          { id: "overview", label: "Analytics Overview", icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )},
          { id: "orders", label: "Orders Manager", icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          )},
          { id: "products", label: "Inventory & Products", icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          )},
          { id: "messages", label: "Customer Inquiries", icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )},
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 rounded-t-xl cursor-pointer ${
              activeTab === tab.id
                ? "border-[#DAA87C] text-[#1E3A2C] bg-white shadow-sm"
                : "border-transparent text-[#1E3A2C]/50 hover:text-[#1E3A2C] hover:bg-[#1E3A2C]/5"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === "messages" && messages.filter((m) => m.status === "Pending").length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#DAA87C] text-white text-[9px] rounded-full font-bold">
                {messages.filter((m) => m.status === "Pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    title: "Total Revenue (Active Orders)",
                    value: `₹${stats.totalRevenue.toLocaleString()}`,
                    desc: "+14.2% from last month",
                    bg: "bg-white",
                    iconColor: "text-emerald-700 bg-emerald-50",
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Avg Order Value",
                    value: `₹${stats.avgOrderValue.toLocaleString()}`,
                    desc: "+4.1% from last month",
                    bg: "bg-white",
                    iconColor: "text-blue-700 bg-blue-50",
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Sarees Sold",
                    value: `${stats.totalSareesSold} Units`,
                    desc: "7 active orders total",
                    bg: "bg-white",
                    iconColor: "text-amber-700 bg-amber-50",
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    ),
                  },
                  {
                    title: "Inventory Alert",
                    value: `${stats.outOfStockCount} Out / ${stats.lowStockCount} Low`,
                    desc: "Attention needed on stock levels",
                    bg: stats.outOfStockCount > 0 ? "bg-amber-50/40 border border-amber-200" : "bg-white",
                    iconColor: "text-rose-700 bg-rose-50",
                    icon: (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ),
                  },
                ].map((stat, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl shadow-sm border border-[#1E3A2C]/5 flex items-center justify-between transition-transform hover:scale-[1.01] hover:shadow-md ${stat.bg}`}>
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-[#1E3A2C]/50 uppercase tracking-wider">{stat.title}</p>
                      <h3 className="text-xl font-bold text-[#1E3A2C]">{stat.value}</h3>
                      <p className="text-[10px] font-semibold text-[#1E3A2C]/40">{stat.desc}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.iconColor}`}>
                      {stat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Line Chart */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-[#1E3A2C]/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#1E3A2C]">Weekly Sales Revenue Trend</h4>
                      <p className="text-[11px] text-[#1E3A2C]/50">Simulated revenue tracking for August 2026</p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-[#1E3A2C]/5 text-[#1E3A2C] rounded-full">
                      August 24 - August 30
                    </span>
                  </div>

                  {/* SVG Custom Interactive Line Chart */}
                  <div className="relative h-64 w-full">
                    <svg className="w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1E3A2C" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#1E3A2C" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="40" y1="30" x2="570" y2="30" stroke="#1E3A2C" strokeOpacity="0.05" strokeWidth="1" />
                      <line x1="40" y1="90" x2="570" y2="90" stroke="#1E3A2C" strokeOpacity="0.05" strokeWidth="1" />
                      <line x1="40" y1="150" x2="570" y2="150" stroke="#1E3A2C" strokeOpacity="0.05" strokeWidth="1" />
                      <line x1="40" y1="210" x2="570" y2="210" stroke="#1E3A2C" strokeOpacity="0.1" strokeWidth="1" />

                      {/* Revenue Area (Gradient Fill) */}
                      <path
                        d="M 40 210 Q 120 180, 140 180 T 240 120 T 340 190 T 440 80 T 540 60 L 540 210 Z"
                        fill="url(#areaGradient)"
                      />

                      {/* Revenue Trend Line */}
                      <path
                        d="M 40 210 Q 120 180, 140 180 T 240 120 T 340 190 T 440 80 T 540 60"
                        fill="none"
                        stroke="#1E3A2C"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />

                      {/* Data Points */}
                      <circle cx="140" cy="180" r="5" fill="#DAA87C" stroke="#1E3A2C" strokeWidth="2" />
                      <circle cx="240" cy="120" r="5" fill="#DAA87C" stroke="#1E3A2C" strokeWidth="2" />
                      <circle cx="340" cy="190" r="5" fill="#DAA87C" stroke="#1E3A2C" strokeWidth="2" />
                      <circle cx="440" cy="80" r="5" fill="#DAA87C" stroke="#1E3A2C" strokeWidth="2" />
                      <circle cx="540" cy="60" r="5" fill="#DAA87C" stroke="#1E3A2C" strokeWidth="2" />

                      {/* X Axis Labels */}
                      <text x="40" y="230" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="middle" fontWeight="600">Mon 24</text>
                      <text x="140" y="230" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="middle" fontWeight="600">Tue 25</text>
                      <text x="240" y="230" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="middle" fontWeight="600">Wed 26</text>
                      <text x="340" y="230" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="middle" fontWeight="600">Thu 27</text>
                      <text x="440" y="230" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="middle" fontWeight="600">Fri 28</text>
                      <text x="540" y="230" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="middle" fontWeight="600">Sat 29</text>

                      {/* Y Axis Labels */}
                      <text x="30" y="214" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="end" fontWeight="600">₹0</text>
                      <text x="30" y="154" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="end" fontWeight="600">₹1,000</text>
                      <text x="30" y="94" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="end" fontWeight="600">₹2,000</text>
                      <text x="30" y="34" fill="#1E3A2C" fillOpacity="0.5" fontSize="10" textAnchor="end" fontWeight="600">₹3,000</text>
                    </svg>

                    {/* Chart overlay badges */}
                    <div className="absolute top-24 left-[230px] bg-[#1E3A2C] text-[#FAF8F5] px-2 py-1 rounded text-[9px] font-bold shadow-md opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                      Wed: ₹1,950
                    </div>
                    <div className="absolute top-14 left-[430px] bg-[#1E3A2C] text-[#FAF8F5] px-2 py-1 rounded text-[9px] font-bold shadow-md opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                      Fri: ₹1,350
                    </div>
                    <div className="absolute top-8 left-[530px] bg-[#1E3A2C] text-[#FAF8F5] px-2 py-1 rounded text-[9px] font-bold shadow-md opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                      Sat: ₹2,679
                    </div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#1E3A2C]/5 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#1E3A2C]">Saree Category Shares</h4>
                    <p className="text-[11px] text-[#1E3A2C]/50">Order volume distribution by saree fabric category</p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {[
                      { name: "Tissue Set Saree", percentage: 40, sales: "3 sold", color: "bg-[#1E3A2C]" },
                      { name: "Cotton Set Saree", percentage: 28, sales: "2 sold", color: "bg-[#DAA87C]" },
                      { name: "Mul Mul Cotton", percentage: 18, sales: "1 sold", color: "bg-[#4B6958]" },
                      { name: "Mul Chanderi", percentage: 14, sales: "1 sold", color: "bg-[#CBA386]" },
                    ].map((cat, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-[#1E3A2C]">
                          <span>{cat.name}</span>
                          <span className="text-[#DAA87C]">{cat.percentage}% <span className="font-semibold text-xs text-[#1E3A2C]/40">({cat.sales})</span></span>
                        </div>
                        <div className="w-full h-2 bg-[#1E3A2C]/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.percentage}%` }}
                            transition={{ delay: idx * 0.1, duration: 0.8 }}
                            className={`h-full rounded-full ${cat.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Critical Alert Banner if stock empty */}
              {stats.outOfStockCount > 0 && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 text-red-700">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-red-950">Critical Inventory Alert: Out of Stock Items Detected</h5>
                    <p className="text-[11px] text-red-900 mt-0.5">There are currently {stats.outOfStockCount} sarees flagged with 0 stock. Restock soon to prevent order failures.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("products")}
                    className="ml-auto px-4 py-1.5 bg-red-800 text-white rounded-lg text-xs font-bold hover:bg-red-950 transition-colors cursor-pointer"
                  >
                    Adjust Stock
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#1E3A2C]/5 overflow-hidden">
              {/* Header and filters */}
              <div className="p-5 border-b border-[#1E3A2C]/5 flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1E3A2C]">Order Management</h4>
                  <p className="text-[11px] text-[#1E3A2C]/50">Search, track, and update customer order fulfillment statuses</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href="/dashboard/orders"
                    className="px-3.5 py-1.5 bg-[#1E3A2C] hover:bg-[#0c2b1c] text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <span>Full Orders & Tracking Console</span>
                    <svg className="w-3.5 h-3.5 text-[#DAA87C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                  {/* Search */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5] text-xs">
                    <svg className="w-4 h-4 text-[#1E3A2C]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search ID, customer..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="bg-transparent border-none outline-none w-40 text-[#1E3A2C]"
                    />
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#1E3A2C]/10 rounded-xl text-xs font-bold text-[#1E3A2C] focus:border-[#DAA87C]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#1E3A2C]/5">
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">Order ID</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">Customer</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">Product details</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">Date</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">Total</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">Status</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A2C]/5">
                    {filteredOrders.length > 0 ? (
                      filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-[#FAF8F5]/30 transition-colors">
                          <td className="p-4 text-xs font-bold text-[#1E3A2C]">{order.id}</td>
                          <td className="p-4 text-xs leading-tight">
                            <p className="font-bold text-[#1E3A2C]">{order.customerName}</p>
                            <p className="text-[10px] text-[#1E3A2C]/40 mt-0.5">{order.email}</p>
                          </td>
                          <td className="p-4 text-xs leading-tight">
                            <p className="font-bold text-[#1E3A2C]">{order.productName}</p>
                            <p className="text-[10px] text-[#1E3A2C]/50 mt-0.5">
                              SKU: <span className="font-semibold">{order.sku}</span> · Qty: <span className="font-semibold">{order.quantity}</span>
                            </p>
                          </td>
                          <td className="p-4 text-xs font-semibold text-[#1E3A2C]/60">{order.date}</td>
                          <td className="p-4 text-xs font-bold text-[#1E3A2C]">₹{order.total.toLocaleString()}</td>
                          <td className="p-4">
                            <span
                              className={`inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                                order.status === "Delivered"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : order.status === "Shipped"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : order.status === "Pending"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.status === "Pending" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "Shipped")}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-800 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Ship
                                </button>
                              )}
                              {order.status === "Shipped" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "Delivered")}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-800 text-white rounded text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Deliver
                                </button>
                              )}
                              {order.status !== "Delivered" && order.status !== "Cancelled" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "Cancelled")}
                                  className="px-2.5 py-1 border border-rose-200 hover:bg-rose-50 text-rose-700 rounded text-[10px] font-bold transition-all cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                              {(order.status === "Delivered" || order.status === "Cancelled") && (
                                <span className="text-[10px] font-semibold text-[#1E3A2C]/30 italic px-2">Archived</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs font-semibold text-[#1E3A2C]/40">
                          No orders matched your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#1E3A2C]/5 overflow-hidden">
              {/* Filters */}
              <div className="p-5 border-b border-[#1E3A2C]/5 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#1E3A2C]">Saree Inventory Management</h4>
                  <p className="text-[11px] text-[#1E3A2C]/50">Monitor stock levels, toggle catalog visibility, and adjust saree quantities</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {/* Search */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1E3A2C]/10 bg-[#FAF8F5] text-xs">
                    <svg className="w-4 h-4 text-[#1E3A2C]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search SKU or Name..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="bg-transparent border-none outline-none w-44 text-[#1E3A2C]"
                    />
                  </div>

                  {/* Category Filter */}
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#1E3A2C]/10 rounded-xl text-xs font-bold text-[#1E3A2C] focus:border-[#DAA87C]"
                  >
                    <option value="All">All Fabrics</option>
                    {categories.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Stock Status Filter */}
                  <select
                    value={productStockStatus}
                    onChange={(e) => setProductStockStatus(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#1E3A2C]/10 rounded-xl text-xs font-bold text-[#1E3A2C] focus:border-[#DAA87C]"
                  >
                    <option value="All">All Stocks</option>
                    <option value="In Stock">In Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF8F5] border-b border-[#1E3A2C]/5">
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">SKU & Saree</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">Category</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">Specs (Fabric/Color)</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">Price</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider text-center">Stock Count</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider text-center">Catalog Status</th>
                      <th className="p-4 text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider text-right">Quick Stock Edit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E3A2C]/5">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => {
                        const isOutOfStock = (product.stock ?? 0) === 0;
                        const isLowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 2;
                        
                        return (
                          <tr key={product.id} className="hover:bg-[#FAF8F5]/30 transition-colors">
                            <td className="p-4 text-xs leading-tight">
                              <p className="font-bold text-[#1E3A2C]">{product.name}</p>
                              <p className="text-[10px] text-[#1E3A2C]/40 mt-0.5">SKU: <span className="font-semibold">{product.sku}</span></p>
                            </td>
                            <td className="p-4 text-xs font-semibold text-[#1E3A2C]/70">{product.category}</td>
                            <td className="p-4 text-xs leading-tight">
                              <p className="text-[#1E3A2C]/70">{product.fabric}</p>
                              <p className="text-[10px] text-[#1E3A2C]/40 mt-0.5">{product.color}</p>
                            </td>
                            <td className="p-4 text-xs font-bold text-[#1E3A2C]">{product.price}</td>
                            <td className="p-4 text-center">
                              <span
                                className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                  isOutOfStock
                                    ? "bg-red-50 text-red-700"
                                    : isLowStock
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700"
                                }`}
                              >
                                {product.stock ?? 0}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                  isOutOfStock ? "text-[#1E3A2C]/30" : "text-[#1E3A2C]"
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? "bg-red-400" : "bg-emerald-400 animate-pulse"}`}></span>
                                {isOutOfStock ? "Hidden (No Stock)" : "Active Catalog"}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Decrement */}
                                <button
                                  onClick={() => handleUpdateStock(product.id, -1)}
                                  disabled={isOutOfStock}
                                  className="w-6 h-6 rounded bg-[#1E3A2C]/5 text-[#1E3A2C] font-bold text-xs hover:bg-[#1E3A2C]/10 transition-colors disabled:opacity-40 disabled:hover:bg-[#1E3A2C]/5 flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                                {/* Increment */}
                                <button
                                  onClick={() => handleUpdateStock(product.id, 1)}
                                  className="w-6 h-6 rounded bg-[#1E3A2C]/5 text-[#1E3A2C] font-bold text-xs hover:bg-[#1E3A2C]/10 transition-colors flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                                {/* Out of Stock Toggle */}
                                <button
                                  onClick={() => handleToggleStock(product.id)}
                                  className={`px-2.5 py-1 text-[9px] font-bold rounded transition-colors cursor-pointer ${
                                    isOutOfStock
                                      ? "bg-[#DAA87C]/20 text-[#DAA87C] hover:bg-[#DAA87C]/30"
                                      : "border border-[#1E3A2C]/10 hover:bg-[#1E3A2C]/5 text-[#1E3A2C]"
                                  }`}
                                >
                                  {isOutOfStock ? "Restock" : "Clear"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-xs font-semibold text-[#1E3A2C]/40">
                          No products matched your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Message List */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#1E3A2C]/5 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-[#1E3A2C]/5">
                  <h4 className="text-sm font-bold text-[#1E3A2C]">Customer Queries</h4>
                  <p className="text-[11px] text-[#1E3A2C]/50">Incoming questions from the website Contact page</p>
                </div>

                <div className="divide-y divide-[#1E3A2C]/5 flex-1 overflow-y-auto">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessage(msg);
                          setReplyText("");
                        }}
                        className={`p-4 hover:bg-[#FAF8F5]/30 cursor-pointer transition-colors text-left flex items-start gap-4 ${
                          selectedMessage?.id === msg.id ? "bg-[#FAF8F5]" : ""
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          msg.status === "Pending" ? "bg-[#DAA87C]/15 text-[#DAA87C]" : "bg-[#1E3A2C]/10 text-[#1E3A2C]/50"
                        }`}>
                          {msg.sender.charAt(0)}
                        </div>

                        <div className="flex-1 space-y-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <h5 className={`text-xs font-bold truncate ${msg.status === "Pending" ? "text-[#1E3A2C]" : "text-[#1E3A2C]/65"}`}>
                              {msg.sender}
                            </h5>
                            <span className="text-[9px] text-[#1E3A2C]/40 font-semibold">{msg.date}</span>
                          </div>
                          <p className={`text-xs font-semibold truncate ${msg.status === "Pending" ? "text-[#1E3A2C]" : "text-[#1E3A2C]/60"}`}>
                            {msg.subject}
                          </p>
                          <p className="text-[11px] text-[#1E3A2C]/50 line-clamp-2 mt-0.5">
                            {msg.content}
                          </p>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-1.5">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${
                            msg.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {msg.status}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(msg.id);
                            }}
                            className="p-1 rounded hover:bg-rose-50 text-[#1E3A2C]/30 hover:text-rose-600 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs font-semibold text-[#1E3A2C]/40">
                      No incoming queries.
                    </div>
                  )}
                </div>
              </div>

              {/* Message Reader / Reply Pane */}
              <div className="bg-white rounded-2xl border border-[#1E3A2C]/5 shadow-sm p-5 space-y-4 text-left">
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1E3A2C]/5 pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-[#1E3A2C]">{selectedMessage.sender}</h4>
                        <p className="text-[10px] text-[#1E3A2C]/40 font-semibold">{selectedMessage.email}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#1E3A2C]/40">{selectedMessage.date}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#1E3A2C]">{selectedMessage.subject}</p>
                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] text-xs leading-relaxed text-[#1E3A2C]/80 whitespace-pre-wrap">
                        {selectedMessage.content}
                      </div>
                    </div>

                    {selectedMessage.status === "Pending" ? (
                      <form onSubmit={handleSendMessageReply} className="space-y-3 pt-2">
                        <label className="block text-[10px] font-bold uppercase text-[#1E3A2C]/50 tracking-wider">
                          Reply Message
                        </label>
                        <textarea
                          placeholder="Type your response to email client..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full h-28 p-3 bg-white border border-[#1E3A2C]/10 rounded-xl text-xs text-[#1E3A2C] focus:border-[#DAA87C] resize-none outline-none"
                          required
                        />
                        <button
                          type="submit"
                          disabled={isReplying || !replyText.trim()}
                          className="w-full py-2 bg-[#1E3A2C] text-white hover:bg-[#1E3A2C]/90 disabled:bg-[#1E3A2C]/30 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isReplying ? (
                            <>
                              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Sending Mail...
                            </>
                          ) : (
                            <>
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-4a2 2 0 011.82 0l8 4a2 2 0 01.89 1.664V19a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11l9 6 9-6" />
                              </svg>
                              Send Response
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                        <svg className="w-5 h-5 text-emerald-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs font-bold text-emerald-950">Message Replied</p>
                        <p className="text-[10px] text-emerald-800">You have responded to this inquiry. A copy of the conversation has been dispatched to {selectedMessage.email}.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-[#1E3A2C]/30 space-y-2">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-xs font-semibold">Select a message query to view details and draft replies</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
