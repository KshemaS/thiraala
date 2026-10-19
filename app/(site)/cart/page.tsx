"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import RegisterModal from "@/components/RegisterModal";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  // Checkout Form State - Contact Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Detailed Delivery Address State
  const [houseOrFlat, setHouseOrFlat] = useState("");
  const [street, setStreet] = useState("");
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("Kerala");
  const [isPincodeSearching, setIsPincodeSearching] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isRazorpayReady, setIsRazorpayReady] = useState(false);

  // Sync user info into form state when user logs in
  useEffect(() => {
    if (user) {
      if (!name) setName(`${user.firstName} ${user.lastName || ""}`.trim());
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  // Pincode Search & Auto-fill Handler
  const handleSearchPincode = async (codeToSearch?: string) => {
    const pin = (codeToSearch || pincode).trim();
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setPincodeStatus({
        type: "error",
        message: "Please enter a valid 6-digit Indian postal code.",
      });
      return;
    }

    setIsPincodeSearching(true);
    setPincodeStatus(null);

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();

      if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const offices = data[0].PostOffice;
        const po = offices[0];
        const detectedCity = po.Block && po.Block !== "NA" ? po.Block : po.Name || "";
        const detectedDistrict = po.District || "";
        const detectedState = po.State || "Kerala";

        if (detectedCity) setCity(detectedCity);
        if (detectedDistrict) setDistrict(detectedDistrict);
        if (detectedState) setState(detectedState);

        setPincodeStatus({
          type: "success",
          message: `Location verified: ${[detectedCity, detectedDistrict, detectedState].filter(Boolean).join(", ")}`,
        });
      } else {
        setPincodeStatus({
          type: "error",
          message: "Pincode not found online. You can enter city, district, and state manually.",
        });
      }
    } catch (err) {
      console.warn("Pincode API lookup network notice:", err);
      setPincodeStatus({
        type: "error",
        message: "Unable to verify online. Please enter city, district, and state manually.",
      });
    } finally {
      setIsPincodeSearching(false);
    }
  };

  // Proceed to Checkout button click handler
  const handleProceedToCheckout = () => {
    if (user) {
      // If user is already logged in: no need to show login or reg modal, proceed directly with checkout
      if (!name) setName(`${user.firstName} ${user.lastName || ""}`.trim());
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
      setIsCheckoutOpen(true);
    } else {
      // If user is not logged in: show the login or reg modal
      setIsAuthModalOpen(true);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!houseOrFlat.trim()) {
      alert("Please provide your house name or flat name & number.");
      return;
    }

    if (!pincode.trim() || pincode.trim().length !== 6) {
      alert("Please enter a valid 6-digit delivery pincode.");
      return;
    }

    if (!city.trim()) {
      alert("Please provide the city / town.");
      return;
    }

    if (!district.trim()) {
      alert("Please provide the district.");
      return;
    }

    setIsSubmitting(true);
    const finalTotal = cartTotal;
    setOrderTotal(finalTotal);

    const fullAddress = [
      houseOrFlat.trim(),
      street.trim(),
      city.trim(),
      district.trim(),
      state.trim() ? `${state.trim()} - ${pincode.trim()}` : pincode.trim(),
    ]
      .filter(Boolean)
      .join(", ");

    if (!isRazorpayReady || typeof (window as any).Razorpay === "undefined") {
      alert("Payment is still loading. Please wait a moment and try again.");
      setIsSubmitting(false);
      return;
    }

    const finishUp = () => {
      setIsCheckoutOpen(false);
      clearCart();

      // Notify dashboard / other listeners in case an admin tab is open
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("thiraala-orders-updated"));
      }

      // Reset form
      setName("");
      setPhone("");
      setEmail("");
      setHouseOrFlat("");
      setStreet("");
      setPincode("");
      setCity("");
      setDistrict("");
      setState("Kerala");
      setPincodeStatus(null);
    };

    try {
      // Step 1: create the app order, Pending/Pending — durable even if payment is abandoned.
      const orderResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          phone,
          email,
          address: fullAddress,
          houseOrFlat: houseOrFlat.trim(),
          street: street.trim(),
          pincode: pincode.trim(),
          city: city.trim(),
          district: district.trim(),
          state: state.trim(),
          paymentMethod: "Razorpay",
          total: finalTotal,
          subtotal: finalTotal,
          items: cart,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderData.success || !orderData.order) {
        alert(orderData.error || "Failed to place order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const pendingOrder = orderData.order;

      // Step 2: create a Razorpay order against it.
      const razorpayOrderResponse = await fetch("/api/payments/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: pendingOrder.id }),
      });
      const razorpayOrderData = await razorpayOrderResponse.json();

      if (!razorpayOrderData.success) {
        alert(
          razorpayOrderData.error ||
            "Could not start payment. Your order is saved — please try again or contact us."
        );
        setIsSubmitting(false);
        return;
      }

      // Step 3: open Razorpay Checkout.
      const razorpay = new (window as any).Razorpay({
        key: razorpayOrderData.keyId,
        amount: razorpayOrderData.amount,
        currency: razorpayOrderData.currency,
        order_id: razorpayOrderData.razorpayOrderId,
        name: "thiraala",
        description: `Order ${pendingOrder.id}`,
        prefill: { name, email, contact: phone },
        theme: { color: "#1E3A2C" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyResponse.json();

            if (verifyData.success && verifyData.order) {
              setOrderTotal(finalTotal);
              setCreatedOrder(verifyData.order);
              setIsOrderPlaced(true);
              finishUp();
            } else {
              alert(
                "Payment was received but could not be verified. Please contact us with your order id " +
                  pendingOrder.id +
                  "."
              );
            }
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
          },
        },
      });

      razorpay.open();
    } catch (error) {
      console.error("Order placement error:", error);
      alert("Something went wrong while placing your order. Please check your connection.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsRazorpayReady(true)}
      />
      <Header />

      <main className="flex-1 py-12 sm:py-16 lg:py-20">
        <Container>
          {isOrderPlaced ? (
            /* Order Success Screen */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto text-center py-16 flex flex-col items-center select-none"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-6 shadow-inner animate-bounce">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1E3A2C]/5 border border-[#1E3A2C]/10 text-xs font-bold text-[#1E3A2C] mb-2">
                <span>Order ID:</span>
                <span className="text-[#DAA87C] font-extrabold">{createdOrder?.id || "THR-1087"}</span>
              </div>

              <h2 className="text-2xl font-bold text-[#1E3A2C]">Order Placed Successfully!</h2>
              <p className="text-xs text-[#1E3A2C]/65 mt-2 leading-relaxed font-semibold">
                Thank you for your order. We are preparing your handwoven drapes. You can track its live fulfillment journey right here.
              </p>

              <div className="mt-8 p-4 px-5 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-800 select-none max-w-sm w-full mx-auto">
                <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Payment of Rs. {orderTotal.toLocaleString()} received via Razorpay.</span>
              </div>

              {/* Action Buttons: Track Order & Continue Shopping */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
                <Link
                  href={`/track-order?id=${createdOrder?.id || "THR-1087"}`}
                  className="w-full sm:flex-1 py-3 px-5 text-xs font-bold bg-[#1E3A2C] hover:bg-[#0c2b1c] text-white rounded-full shadow-md transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-[#DAA87C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>Track Live Order</span>
                </Link>

                <Link
                  href="/products"
                  onClick={() => setIsOrderPlaced(false)}
                  className="w-full sm:flex-1 py-3 px-5 text-xs font-bold border border-[#1E3A2C]/20 hover:border-[#1E3A2C] text-[#1E3A2C] rounded-full transition-all hover:bg-[#1E3A2C]/5 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </motion.div>
          ) : cart.length === 0 ? (
            /* Empty Cart Screen */
            <div className="max-w-md mx-auto text-center py-16 flex flex-col items-center select-none">
              <div className="w-20 h-20 rounded-full bg-[#1E3A2C]/5 flex items-center justify-center text-[#1E3A2C]/60 mb-6 border border-[#1E3A2C]/10 shadow-inner">
                <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-[#1E3A2C]">Your shopping bag is empty</h3>
              <p className="text-xs text-[#1E3A2C]/60 mt-2 leading-relaxed font-semibold">
                Explore our collections to add elegant handloom cotton and tissue silk sarees to your bag.
              </p>
              <Link
                href="/products"
                className="mt-8 px-8 py-3.5 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-md shadow-[#1E3A2C]/10 transition-all hover:scale-[1.02] inline-flex items-center gap-1.5 group cursor-pointer text-white"
              >
                Explore Collections
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            /* Cart Grid List & Summary */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start max-w-6xl mx-auto">
              
              {/* Left Side: Items List (8 Columns) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between border-b border-[#1E3A2C]/10 pb-4 select-none">
                  <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight">Shopping Bag</h1>
                  <span className="text-xs font-semibold text-[#1E3A2C]/60">
                    {cart.reduce((total, item) => total + item.quantity, 0)} Items
                  </span>
                </div>

                <div className="space-y-4">
                  {cart.map((item) => {
                    const imgSource = item.foldedImg?.src || item.foldedImg || item.wornImg?.src || item.wornImg;
                    return (
                      <motion.div
                        key={item.id}
                        layout
                        exit={{ opacity: 0, x: -30 }}
                        className="flex gap-4 p-4 bg-white border border-[#1E3A2C]/5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                      >
                        {/* Thumbnail */}
                        <div className="relative w-20 h-24 rounded-lg overflow-hidden bg-[#fcfbfa] flex-shrink-0 border border-[#1E3A2C]/5 select-none">
                          {imgSource && (
                            <Image
                              src={imgSource}
                              alt={item.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <Link href={`/products/${item.id}`} className="text-sm font-bold text-[#1E3A2C] hover:text-[#DAA87C] transition-colors leading-tight">
                                {item.name}
                              </Link>
                              <p className="text-[10px] text-[#1E3A2C]/40 mt-1 font-semibold select-none">
                                Free Express Delivery Across India
                              </p>
                            </div>
                            
                            {/* Remove button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1 text-[#1E3A2C]/40 hover:text-red-500 rounded-full transition-colors cursor-pointer select-none"
                              title="Remove item"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex justify-between items-end gap-2 mt-4 select-none">
                            {/* Price */}
                            <span className="text-sm font-extrabold text-[#0c2b1c]">{item.price}</span>

                            {/* Quantity Controls */}
                            <div className="flex items-center border border-[#1E3A2C]/20 rounded-full p-1 bg-[#fcfbfa]/50">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-[#1E3A2C] hover:bg-[#1E3A2C]/5 cursor-pointer transition-colors"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-xs font-bold text-[#1E3A2C]">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-[#1E3A2C] hover:bg-[#1E3A2C]/5 cursor-pointer transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Summary & Checkout Button (4 Columns) */}
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-[#1E3A2C]/10 shadow-sm flex flex-col gap-6 select-none sticky top-24">
                <h3 className="text-lg font-bold text-[#1E3A2C] border-b border-[#1E3A2C]/10 pb-3">
                  Order Summary
                </h3>

                <div className="space-y-3.5 text-xs font-semibold text-[#1E3A2C]">
                  <div className="flex justify-between">
                    <span className="text-[#1E3A2C]/65">Subtotal</span>
                    <span>Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#1E3A2C]/65">Shipping</span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="border-t border-[#1E3A2C]/10 pt-3.5 flex justify-between text-sm font-extrabold text-[#0c2b1c]">
                    <span>Total Amount</span>
                    <span>Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={handleProceedToCheckout}
                  className="w-full h-12 mt-2 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-md shadow-[#1E3A2C]/10 transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 group cursor-pointer text-white"
                >
                  Proceed to Checkout
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

            </div>
          )}
        </Container>
      </main>

      {/* Login / Registration Modal (Shown only when not logged in) */}
      <RegisterModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
        onRegisterSuccess={(loggedInUser) => {
          setIsAuthModalOpen(false);
          // Auto-fill delivery form and open checkout
          if (!name) setName(`${loggedInUser.firstName} ${loggedInUser.lastName || ""}`.trim());
          if (!email && loggedInUser.email) setEmail(loggedInUser.email);
          if (!phone && loggedInUser.phone) setPhone(loggedInUser.phone);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Drawer / Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm fixed"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg bg-[#fcfbfa] p-7 sm:p-9 rounded-3xl border border-[#1E3A2C]/10 shadow-2xl z-10 flex flex-col gap-5 my-auto max-h-[92vh] overflow-y-auto scrollbar-none"
            >
              {/* Close button */}
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-[#1E3A2C]/60 hover:text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="text-center select-none">
                <h3 className="text-2xl font-bold text-[#1E3A2C] tracking-tight">Checkout</h3>
                <p className="text-xs text-[#1E3A2C]/65 mt-1 font-semibold">
                  Provide your contact & detailed delivery address
                </p>
                <div className="w-10 h-0.5 bg-[#DAA87C] mx-auto mt-2.5 rounded-full"></div>
              </div>

              {/* Delivery info form */}
              <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4">
                
                {/* Contact Information Section */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="For tracking receipt"
                        className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Address Section (Split Fields with Pincode Search) */}
                <div className="flex flex-col gap-3 pt-3 border-t border-[#1E3A2C]/10">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] font-bold text-[#1E3A2C] uppercase tracking-wider">
                      Delivery Address
                    </span>
                    <span className="text-[10px] text-[#DAA87C] font-semibold">
                      Enter Pincode for auto-fill
                    </span>
                  </div>

                  {/* 1. Pincode Search Row */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                      Pincode *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={pincode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setPincode(val);
                            if (val.length === 6) {
                              handleSearchPincode(val);
                            } else {
                              setPincodeStatus(null);
                            }
                          }}
                          placeholder="6-digit Pincode"
                          className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all tracking-wider"
                        />
                        {isPincodeSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-[#DAA87C] border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isPincodeSearching || pincode.length !== 6}
                        onClick={() => handleSearchPincode(pincode)}
                        className="px-4 h-11 rounded-xl bg-[#1E3A2C] hover:bg-[#0c2b1c] disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm select-none"
                      >
                        <svg className="w-3.5 h-3.5 text-[#DAA87C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Search</span>
                      </button>
                    </div>

                    {/* Pincode Search Status Banner */}
                    {pincodeStatus && (
                      <p
                        className={`text-[11px] font-semibold mt-0.5 flex items-center gap-1.5 select-none ${
                          pincodeStatus.type === "success" ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {pincodeStatus.type === "success" ? (
                          <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                        <span>{pincodeStatus.message}</span>
                      </p>
                    )}
                  </div>

                  {/* 2. House Name or Flat Name & Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                      House / Flat Name & Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={houseOrFlat}
                      onChange={(e) => setHouseOrFlat(e.target.value)}
                      placeholder="e.g. Flat 4B, Emerald Heights / Rose Villa"
                      className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                    />
                  </div>

                  {/* 3. Street / Area / Landmark */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                      Street / Area / Landmark
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="e.g. MG Road, Near North Railway Station"
                      className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                    />
                  </div>

                  {/* 4. City & District (2 Columns) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                        City / Town *
                      </label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Kochi"
                        className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                        District *
                      </label>
                      <input
                        type="text"
                        required
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Ernakulam"
                        className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* 5. State */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Kerala"
                      className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Payment Option Selector (Razorpay) */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1E3A2C]/10">
                  <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                    Payment Method
                  </label>
                  <div className="p-3.5 rounded-xl border border-[#1E3A2C] bg-[#1E3A2C] text-white flex items-center justify-between shadow-sm select-none">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">Pay via Razorpay</span>
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#DAA87C] text-[#1E3A2C] rounded-full uppercase tracking-wider">Secure</span>
                      </div>
                      <span className="text-[10px] text-[#DAA87C] font-medium">
                        Cards, UPI, Net Banking, Wallets
                      </span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-emerald-400 text-[#1E3A2C] flex items-center justify-center font-bold text-xs shadow-inner">
                      ✓
                    </div>
                  </div>
                </div>

                {/* Mode description banner */}
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-[11px] font-bold text-emerald-800 select-none">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Pay securely online via Razorpay — a Razorpay window will open after you place your order.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 mt-2 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-md shadow-[#1E3A2C]/10 transition-all hover:scale-[1.01] flex items-center justify-center gap-2 group cursor-pointer text-white disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Place Order · ₹{cartTotal.toLocaleString()}</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
