"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  X,
  ChevronRight,
  Printer,
  Edit2,
  Send,
  Calendar,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { Order, OrderStatus, PaymentStatus } from "@/app/api/orders/route";

export default function OrdersDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [paymentFilter, setPaymentFilter] = useState<string>("All");

  // Selected Order for Details & Tracking Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit / Update Form State for Selected Order
  const [editStatus, setEditStatus] = useState<OrderStatus>("Pending");
  const [editCourier, setEditCourier] = useState("");
  const [editTrackingNumber, setEditTrackingNumber] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>("Pending");
  const [editNotes, setEditNotes] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
        // If an order is currently open in modal, sync it
        if (selectedOrder) {
          const updated = data.orders.find((o: Order) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      showToast("Failed to load orders. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Listen for cross-tab / window order updates
    const handleOrdersUpdated = () => {
      fetchOrders();
    };

    window.addEventListener("thiraala-orders-updated", handleOrdersUpdated);
    return () => {
      window.removeEventListener("thiraala-orders-updated", handleOrdersUpdated);
    };
  }, []);

  // When selected order changes, initialize edit form
  useEffect(() => {
    if (selectedOrder) {
      setEditStatus(selectedOrder.status);
      setEditCourier(selectedOrder.courierName || "");
      setEditTrackingNumber(selectedOrder.trackingNumber || "");
      setEditPaymentStatus(selectedOrder.paymentStatus);
      setEditNotes(selectedOrder.notes || "");
    }
  }, [selectedOrder]);

  // Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "Pending").length;
    const confirmed = orders.filter((o) => o.status === "Confirmed").length;
    const shipped = orders.filter((o) => o.status === "Shipped").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const cancelled = orders.filter((o) => o.status === "Cancelled").length;
    const revenue = orders
      .filter((o) => o.status !== "Cancelled")
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return { total, pending, confirmed, shipped, delivered, cancelled, revenue };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        (o.email && o.email.toLowerCase().includes(q)) ||
        o.items.some((i) => i.name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "All" || o.status === statusFilter;
      const matchesPayment =
        paymentFilter === "All" ||
        (paymentFilter === "COD" && o.paymentMethod === "COD") ||
        (paymentFilter === "UPI" && o.paymentMethod === "UPI") ||
        (paymentFilter === "Paid" && o.paymentStatus === "Paid") ||
        (paymentFilter === "Unpaid" && o.paymentStatus !== "Paid");

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // Save changes to order
  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          courierName: editCourier,
          trackingNumber: editTrackingNumber,
          paymentStatus: editPaymentStatus,
          notes: editNotes,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setSelectedOrder(data.order);
        setOrders((prev) =>
          prev.map((o) => (o.id === data.order.id ? data.order : o))
        );
        showToast(`Order #${selectedOrder.id} status updated to ${editStatus}!`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("thiraala-orders-updated"));
        }
      } else {
        alert(data.error || "Failed to update order");
      }
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Network error while updating order");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Quick Status change from table row
  const handleQuickStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.order : o))
        );
        showToast(`Order #${orderId} moved to ${newStatus}`);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Confirmed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case "Shipped":
        return <Truck className="w-3.5 h-3.5 text-blue-600" />;
      case "Confirmed":
        return <Package className="w-3.5 h-3.5 text-amber-600" />;
      case "Cancelled":
        return <XCircle className="w-3.5 h-3.5 text-red-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-stone-500" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-[#1E3A2C] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-[#DAA87C]/30"
          >
            <CheckCircle2 className="w-4 h-4 text-[#DAA87C]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1E3A2C]/10 select-none">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-[#DAA87C] uppercase tracking-widest bg-[#1E3A2C]/5 px-2.5 py-0.5 rounded-full">
              Fulfillment Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E3A2C] mt-1 tracking-tight flex items-center gap-2.5">
            <span>Orders & Consignment Tracking</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#1E3A2C]/10 text-[#1E3A2C] font-mono font-bold">
              {orders.length}
            </span>
          </h1>
          <p className="text-xs text-[#1E3A2C]/60 mt-1 font-medium">
            Track customer orders from looms to doorstep delivery. Update AWB logistics and manage payment reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchOrders}
            className="px-3.5 py-2 rounded-xl border border-[#1E3A2C]/10 bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#1E3A2C] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#DAA87C]" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/track-order"
            target="_blank"
            className="px-4 py-2 rounded-xl bg-[#1E3A2C] hover:bg-[#0c2b1c] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#DAA87C]" />
            <span>Public Tracking Portal</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#1E3A2C]/10 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#1E3A2C]/50 tracking-wider">Total Orders</span>
          <p className="text-xl font-extrabold text-[#1E3A2C] mt-1 font-mono">{metrics.total}</p>
          <span className="text-[10px] text-[#1E3A2C]/50 mt-0.5 block">Lifetime drapes ordered</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-900 tracking-wider">Pending</span>
            {metrics.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <p className="text-xl font-extrabold text-amber-950 mt-1 font-mono">{metrics.pending}</p>
          <span className="text-[10px] text-amber-800/70 mt-0.5 block">Requires confirmation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 bg-blue-50/20 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-blue-900 tracking-wider">Confirmed / Packing</span>
          <p className="text-xl font-extrabold text-blue-950 mt-1 font-mono">{metrics.confirmed}</p>
          <span className="text-[10px] text-blue-800/70 mt-0.5 block">Ready for courier dispatch</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 bg-indigo-50/20 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-indigo-900 tracking-wider">Shipped In-Transit</span>
          <p className="text-xl font-extrabold text-indigo-950 mt-1 font-mono">{metrics.shipped}</p>
          <span className="text-[10px] text-indigo-800/70 mt-0.5 block">On the road</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider">Delivered</span>
          <p className="text-xl font-extrabold text-emerald-950 mt-1 font-mono">{metrics.delivered}</p>
          <span className="text-[10px] text-emerald-800/70 mt-0.5 block">Successfully completed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#1E3A2C]/10 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-[#1E3A2C]/50 tracking-wider">Gross Value</span>
          <p className="text-xl font-extrabold text-[#1E3A2C] mt-1 font-mono">₹{metrics.revenue.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">Active order book</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#1E3A2C]/10 shadow-2xs flex flex-col md:flex-row gap-3 md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order ID, customer, phone, or saree..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-[#1E3A2C]/15 text-xs font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#DAA87C] focus:ring-1 focus:ring-[#DAA87C] outline-none bg-[#FAF8F5]/60 transition-all"
          />
          <Search className="w-4 h-4 text-[#1E3A2C]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E3A2C]/40 hover:text-[#1E3A2C]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Pill Tabs & Payment Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#1E3A2C]/10 text-xs font-semibold overflow-x-auto">
            {["All", "Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-xs ${
                  statusFilter === status
                    ? "bg-[#1E3A2C] text-white font-bold shadow-2xs"
                    : "text-[#1E3A2C]/70 hover:text-[#1E3A2C] hover:bg-white/60"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="h-9 px-3 bg-white border border-[#1E3A2C]/15 rounded-xl text-xs font-semibold text-[#1E3A2C] outline-none cursor-pointer"
          >
            <option value="All">All Payment Modes</option>
            <option value="COD">Cash on Delivery (COD)</option>
            <option value="UPI">UPI Digital Payment</option>
            <option value="Paid">Paid Only</option>
            <option value="Unpaid">Pending Payment Only</option>
          </select>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-2xl border border-[#1E3A2C]/10 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF8F5] border-b border-[#1E3A2C]/10 text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/50 select-none">
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Items Ordered</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Fulfillment Status</th>
                <th className="p-4">Logistics / AWB</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E3A2C]/5 text-xs">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const firstItem = order.items[0];
                  const extraItems = order.items.length - 1;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#FAF8F5]/50 transition-colors group"
                    >
                      {/* Order ID */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="font-bold text-[#1E3A2C] hover:text-[#DAA87C] font-mono flex items-center gap-1 cursor-pointer"
                          >
                            <span>#{order.id}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.id, order.id)}
                            className="text-[#1E3A2C]/30 hover:text-[#1E3A2C] cursor-pointer"
                            title="Copy Order ID"
                          >
                            {copiedId === order.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-[#1E3A2C]/50 block mt-0.5 font-medium">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="p-4 leading-tight">
                        <p className="font-bold text-[#1E3A2C]">{order.customerName}</p>
                        <p className="text-[11px] text-[#1E3A2C]/60 mt-0.5 font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#DAA87C]" />
                          <span>{order.phone}</span>
                        </p>
                        <p className="text-[10px] text-[#1E3A2C]/40 mt-0.5 truncate max-w-[200px]" title={order.address}>
                          {order.address}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="p-4">
                        {firstItem && (
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-10 h-12 rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#1E3A2C]/10 flex-shrink-0">
                              <img
                                src={firstItem.foldedImg || "/images/folded-gopuram.jpeg"}
                                alt={firstItem.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 max-w-[180px]">
                              <p className="font-bold text-[#1E3A2C] truncate">{firstItem.name}</p>
                              <p className="text-[10px] text-[#1E3A2C]/50 mt-0.5 font-medium">
                                Qty: {firstItem.quantity}
                                {extraItems > 0 ? ` (+${extraItems} more)` : ""}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="p-4">
                        <span className="font-extrabold text-[#1E3A2C] text-sm">
                          ₹{order.total.toLocaleString()}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#FAF8F5] border border-[#1E3A2C]/10 text-[#1E3A2C]">
                            {order.paymentMethod === "COD" ? "Cash on Delivery" : "UPI QR"}
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase ${
                              order.paymentStatus === "Paid"
                                ? "text-emerald-700"
                                : "text-amber-700"
                            }`}
                          >
                            ● {order.paymentStatus}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {getStatusIcon(order.status)}
                            <span>{order.status}</span>
                          </span>

                          {/* Quick advance dropdown */}
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleQuickStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className="text-[9px] font-bold py-0.5 px-1 bg-transparent border-0 hover:bg-[#FAF8F5] rounded text-[#1E3A2C]/60 hover:text-[#1E3A2C] outline-none cursor-pointer"
                            title="Quick change status"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>

                      {/* Tracking / Logistics */}
                      <td className="p-4 text-[11px]">
                        {order.trackingNumber ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-[#1E3A2C]">
                              {order.courierName || "Courier"}
                            </span>
                            <span className="font-mono text-[10px] text-[#1E3A2C]/60">
                              {order.trackingNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#1E3A2C]/40 italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#1E3A2C] text-[#1E3A2C] hover:text-white rounded-xl text-xs font-bold transition-all border border-[#1E3A2C]/10 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Track</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#1E3A2C]/50 select-none">
                    <ShoppingBag className="w-8 h-8 text-[#1E3A2C]/20 mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#1E3A2C]">No matching orders found</p>
                    <p className="text-xs text-[#1E3A2C]/50 mt-1">
                      {searchQuery
                        ? `No orders matching "${searchQuery}". Try clearing search.`
                        : "Orders placed by customers will automatically show up here."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Order Details & Live Tracking Drawer / Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-[#FAF8F5] rounded-3xl border border-[#1E3A2C]/10 shadow-2xl z-10 my-auto max-h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#1E3A2C] text-white p-6 sm:p-7 flex items-start justify-between flex-shrink-0">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg sm:text-2xl font-extrabold font-mono tracking-tight">
                      Order #{selectedOrder.id}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border bg-white/10 text-white border-white/20`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#FAF8F5]/70 mt-1 font-medium">
                    Placed on{" "}
                    {new Date(selectedOrder.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                    title="Print Slip"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
                {/* Visual Tracking Stepper */}
                <div className="bg-white p-6 rounded-2xl border border-[#1E3A2C]/10 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A2C]/70">
                      Consignment Fulfillment Journey
                    </h3>
                    <Link
                      href={`/track-order?id=${selectedOrder.id}`}
                      target="_blank"
                      className="text-xs font-bold text-[#DAA87C] hover:underline flex items-center gap-1"
                    >
                      <span>Public tracking view</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1E3A2C]/10">
                    {selectedOrder.trackingTimeline.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className={`absolute -left-[23px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            step.completed
                              ? "bg-[#1E3A2C] text-white ring-4 ring-[#DAA87C]/20"
                              : "bg-white border-2 border-[#1E3A2C]/20 text-[#1E3A2C]/30"
                          }`}
                        >
                          {step.completed ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A2C]/30" />
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div>
                            <h4
                              className={`text-xs font-bold ${
                                step.completed ? "text-[#1E3A2C]" : "text-[#1E3A2C]/40"
                              }`}
                            >
                              {step.title}
                            </h4>
                            <p
                              className={`text-[11px] mt-0.5 ${
                                step.completed ? "text-[#1E3A2C]/70" : "text-[#1E3A2C]/40"
                              }`}
                            >
                              {step.description}
                            </p>
                          </div>
                          {step.timestamp && (
                            <span className="text-[10px] font-mono font-semibold text-[#1E3A2C]/50 whitespace-nowrap">
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
                    ))}
                  </div>
                </div>

                {/* Status Update Form Card */}
                <form
                  onSubmit={handleUpdateOrder}
                  className="bg-white p-6 rounded-2xl border border-[#1E3A2C]/10 shadow-2xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#1E3A2C]/10 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A2C]">
                      Update Status & Shipping Details
                    </h3>
                    <span className="text-[10px] text-[#1E3A2C]/50 font-semibold">
                      Changes immediately reflect on customer tracking
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Order Status */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/60">
                        Order Status
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                        className="h-10 px-3 bg-[#FAF8F5] border border-[#1E3A2C]/15 rounded-xl text-xs font-bold text-[#1E3A2C] outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed & Packing</option>
                        <option value="Shipped">Shipped / Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Courier Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/60">
                        Courier Partner
                      </label>
                      <input
                        type="text"
                        value={editCourier}
                        onChange={(e) => setEditCourier(e.target.value)}
                        placeholder="DTDC, Delhivery, Speed Post"
                        className="h-10 px-3 bg-[#FAF8F5] border border-[#1E3A2C]/15 rounded-xl text-xs font-semibold text-[#1E3A2C] outline-none"
                      />
                    </div>

                    {/* Tracking / AWB Number */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/60">
                        Tracking / AWB Number
                      </label>
                      <input
                        type="text"
                        value={editTrackingNumber}
                        onChange={(e) => setEditTrackingNumber(e.target.value)}
                        placeholder="e.g. DTDC-884920"
                        className="h-10 px-3 bg-[#FAF8F5] border border-[#1E3A2C]/15 rounded-xl text-xs font-semibold text-[#1E3A2C] outline-none font-mono"
                      />
                    </div>

                    {/* Payment Status */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/60">
                        Payment Status
                      </label>
                      <select
                        value={editPaymentStatus}
                        onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                        className="h-10 px-3 bg-[#FAF8F5] border border-[#1E3A2C]/15 rounded-xl text-xs font-bold text-[#1E3A2C] outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  {/* Merchant Notes */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#1E3A2C]/60">
                      Internal Fulfillment Notes
                    </label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Special instructions, gate delivery note, or packaging details..."
                      className="h-10 px-3 bg-[#FAF8F5] border border-[#1E3A2C]/15 rounded-xl text-xs font-semibold text-[#1E3A2C] outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingStatus}
                      className="px-6 py-2.5 bg-[#1E3A2C] hover:bg-[#0c2b1c] text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingStatus ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Saving Changes...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-[#DAA87C]" />
                          <span>Save & Update Tracking</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Customer Details & Shipping Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="bg-white p-6 rounded-2xl border border-[#1E3A2C]/10 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A2C]/60 pb-2 border-b border-[#1E3A2C]/10">
                      Customer & Shipping Details
                    </h3>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#1E3A2C]/40 block">Name</span>
                      <p className="font-bold text-[#1E3A2C] text-sm mt-0.5">{selectedOrder.customerName}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#1E3A2C]/40 block">Phone</span>
                        <p className="font-semibold text-[#1E3A2C] text-xs mt-0.5">{selectedOrder.phone}</p>
                      </div>

                      <a
                        href={`https://wa.me/91${selectedOrder.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                          `Hello ${selectedOrder.customerName}, regarding your Thiraala order #${selectedOrder.id}:`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>WhatsApp Customer</span>
                      </a>
                    </div>

                    {selectedOrder.email && (
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#1E3A2C]/40 block">Email</span>
                        <p className="font-medium text-[#1E3A2C] text-xs mt-0.5">{selectedOrder.email}</p>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#1E3A2C]/40 block">Delivery Address</span>
                      <p className="font-medium text-[#1E3A2C]/80 text-xs mt-0.5 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#1E3A2C]/5">
                        {selectedOrder.address}
                      </p>
                    </div>
                  </div>

                  {/* Payment & Financials */}
                  <div className="bg-white p-6 rounded-2xl border border-[#1E3A2C]/10 shadow-2xs space-y-3 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A2C]/60 pb-2 border-b border-[#1E3A2C]/10">
                        Payment & Accounting
                      </h3>

                      <div className="space-y-2.5 mt-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[#1E3A2C]/60">Payment Mode:</span>
                          <span className="font-bold text-[#1E3A2C]">
                            {selectedOrder.paymentMethod === "COD" ? "Cash on Delivery" : "UPI QR Payment"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#1E3A2C]/60">Payment Status:</span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                              selectedOrder.paymentStatus === "Paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {selectedOrder.paymentStatus}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-[#1E3A2C]/5">
                          <span className="text-[#1E3A2C]/60">Items Subtotal:</span>
                          <span className="font-semibold text-[#1E3A2C]">₹{selectedOrder.total.toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-[#1E3A2C]/60">Delivery & Handling:</span>
                          <span className="text-emerald-700 font-semibold">Free (Complementary)</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1E3A2C]/10 flex justify-between items-center">
                      <span className="text-xs font-bold text-[#1E3A2C]">Grand Total:</span>
                      <span className="text-lg font-extrabold text-[#1E3A2C]">
                        ₹{selectedOrder.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="bg-white p-6 rounded-2xl border border-[#1E3A2C]/10 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A2C]/60 mb-4 pb-2 border-b border-[#1E3A2C]/10">
                    Ordered Handwoven Drapes ({selectedOrder.items.reduce((s, i) => s + i.quantity, 0)})
                  </h3>

                  <div className="space-y-3.5 divide-y divide-[#1E3A2C]/5">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className={`flex items-center gap-4 ${idx > 0 ? "pt-3.5" : ""}`}>
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
                            SKU: <span className="font-mono font-semibold">{item.sku || "N/A"}</span>
                            {item.selectedColor ? ` · Color: ${item.selectedColor}` : ""}
                          </p>
                          <span className="text-[11px] font-semibold text-[#1E3A2C]/70 mt-1 inline-block">
                            Unit Price: {item.price}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-semibold text-[#1E3A2C]/60 block">
                            Qty: <span className="font-bold text-[#1E3A2C]">{item.quantity}</span>
                          </span>
                          <span className="text-xs font-extrabold text-[#1E3A2C] mt-1 block">
                            ₹{((item.priceValue || 0) * item.quantity).toLocaleString() || item.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
