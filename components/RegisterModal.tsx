"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (user: UserData) => void;
}

export default function RegisterModal({ isOpen, onClose, onRegisterSuccess }: RegisterModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData: UserData = { firstName, lastName, email };
    localStorage.setItem("thiraala_user", JSON.stringify(userData));
    onRegisterSuccess(userData);
    onClose();
    
    // Reset form fields
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-[#fcfbfa] p-8 rounded-3xl border border-[#1E3A2C]/10 shadow-2xl z-10 flex flex-col gap-6"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-[#1E3A2C]/60 hover:text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="text-center select-none">
              <h3 className="text-2xl font-bold text-[#1E3A2C] tracking-tight">Create Account</h3>
              <p className="text-xs text-[#1E3A2C]/65 mt-1 font-semibold">
                Register to save your drapes and customize collections
              </p>
              <div className="w-10 h-0.5 bg-[#DAA87C] mx-auto mt-3 rounded-full"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  className="w-full h-12 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  className="w-full h-12 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full h-12 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 mt-2 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-md shadow-[#1E3A2C]/10 transition-all hover:scale-[1.01] flex items-center justify-center gap-1 group cursor-pointer text-white"
              >
                Register
                <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
