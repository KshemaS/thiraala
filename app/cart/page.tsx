"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);

  // Checkout Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderTotal(cartTotal);
    setIsOrderPlaced(true);
    setIsCheckoutOpen(false);
    clearCart();

    // Reset Form
    setName("");
    setPhone("");
    setAddress("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[#DAA87C]/20 selection:text-[#DAA87C] bg-[#fcfbfa]">
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
              <h2 className="text-2xl font-bold text-[#1E3A2C]">Order Placed Successfully!</h2>
              <p className="text-xs text-[#1E3A2C]/65 mt-3 leading-relaxed font-semibold">
                Thank you for your order. We are preparing your handwoven drapes. A confirmation message will be sent to your number shortly.
              </p>

              {/* UPI Payment QR Code Section */}
              <div className="mt-8 p-6 bg-white border border-[#1E3A2C]/10 rounded-3xl shadow-sm flex flex-col items-center max-w-sm w-full mx-auto">
                <span className="text-[10px] font-bold text-[#DAA87C] uppercase tracking-wider mb-2">Scan to Pay via UPI</span>
                
                {/* QR Image with scanner lines */}
                <div className="relative w-44 h-44 border border-[#1E3A2C]/5 rounded-2xl p-2 bg-[#fcfbfa] flex items-center justify-center overflow-hidden">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `upi://pay?pa=thiraala@okaxis&pn=thiraala&am=${orderTotal}&cu=INR`
                    )}&color=1e3a2c`}
                    alt="UPI QR Code"
                    className="w-40 h-40 object-contain rounded-xl select-none"
                  />
                  {/* Scanner laser line animation */}
                  <div
                    className="absolute left-0 right-0 h-[2.5px] bg-[#DAA87C] opacity-60 shadow-[0_0_8px_#DAA87C]"
                    style={{ animation: 'scan-laser 2.5s ease-in-out infinite' }}
                  />
                  <style>{`
                    @keyframes scan-laser {
                      0%, 100% { transform: translateY(-70px); }
                      50% { transform: translateY(70px); }
                    }
                  `}</style>
                </div>
                
                <span className="text-xs font-extrabold text-[#1E3A2C] mt-4">Amount: Rs. {orderTotal.toLocaleString()}</span>
                <p className="text-[10px] text-[#1E3A2C]/50 mt-1.5 font-semibold text-center leading-relaxed">
                  Scan this QR code using GPAY, PhonePe, Paytm, or any UPI app to complete payment.
                </p>
              </div>

              <Link
                href="/products"
                onClick={() => setIsOrderPlaced(false)}
                className="mt-8 px-8 py-3.5 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-md shadow-[#1E3A2C]/10 transition-all hover:scale-[1.02] inline-flex items-center gap-1.5 group cursor-pointer text-white"
              >
                Continue Shopping
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
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
                                Free Delivery & COD Available
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
                  <div className="flex justify-between">
                    <span className="text-[#1E3A2C]/65">Cash on Delivery</span>
                    <span className="text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="border-t border-[#1E3A2C]/10 pt-3.5 flex justify-between text-sm font-extrabold text-[#0c2b1c]">
                    <span>Total Amount</span>
                    <span>Rs. {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsCheckoutOpen(true)}
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
              className="relative w-full max-w-md bg-[#fcfbfa] p-8 sm:p-10 rounded-3xl border border-[#1E3A2C]/10 shadow-2xl z-10 flex flex-col gap-6 my-auto max-h-[92vh] overflow-y-auto scrollbar-none"
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
                  Complete your purchase via Cash on Delivery
                </p>
                <div className="w-10 h-0.5 bg-[#DAA87C] mx-auto mt-3 rounded-full"></div>
              </div>

              {/* Delivery info form */}
              <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full h-12 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your 10-digit number"
                    className="w-full h-12 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                    Delivery Address
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House/Plot No, Street Name, Pincode, City, State"
                    className="w-full p-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all resize-none"
                  />
                </div>

                {/* Mode description banner */}
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-[11px] font-bold text-emerald-800 select-none">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Paying Cash on Delivery. Zero extra charges.</span>
                </div>

                <button
                  type="submit"
                  className="w-full h-12 mt-2 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-md shadow-[#1E3A2C]/10 transition-all hover:scale-[1.01] flex items-center justify-center gap-1 group cursor-pointer text-white"
                >
                  Place Order (COD)
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
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
