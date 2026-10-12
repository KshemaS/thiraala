"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserData } from "@/context/AuthContext";

export type { UserData };

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  onRegisterSuccess?: (user: UserData) => void;
}

export default function RegisterModal({
  isOpen,
  onClose,
  initialMode = "login",
  onRegisterSuccess,
}: RegisterModalProps) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (mode === "login") {
        const res = await login(email, password);
        if (!res.success || !res.user) {
          setErrorMessage(res.error || "Failed to sign in. Please check your credentials.");
          setIsSubmitting(false);
          return;
        }

        if (onRegisterSuccess) {
          onRegisterSuccess(res.user);
        }
      } else {
        const res = await signup({
          firstName,
          lastName,
          email,
          password: password || undefined,
          phone: phone || undefined,
        });

        if (!res.success || !res.user) {
          setErrorMessage(res.error || "Failed to register. Please check your details.");
          setIsSubmitting(false);
          return;
        }

        if (onRegisterSuccess) {
          onRegisterSuccess(res.user);
        }
      }

      // Reset form fields
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setErrorMessage(null);
      onClose();
    } catch (err: any) {
      console.error("Auth submit error:", err);
      setErrorMessage("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
            className="relative w-full max-w-md bg-[#fcfbfa] p-8 sm:p-10 rounded-3xl border border-[#1E3A2C]/10 shadow-2xl z-10 flex flex-col gap-5 max-h-[92vh] overflow-y-auto scrollbar-none"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full text-[#1E3A2C]/60 hover:text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-[#1E3A2C]/5 p-1 rounded-2xl border border-[#1E3A2C]/10 select-none">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-white text-[#1E3A2C] shadow-sm font-extrabold"
                    : "text-[#1E3A2C]/60 hover:text-[#1E3A2C]"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-white text-[#1E3A2C] shadow-sm font-extrabold"
                    : "text-[#1E3A2C]/60 hover:text-[#1E3A2C]"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Header */}
            <div className="text-center select-none">
              <h3 className="text-2xl font-bold text-[#1E3A2C] tracking-tight">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h3>
              <p className="text-xs text-[#1E3A2C]/65 mt-1 font-semibold">
                {mode === "login"
                  ? "Sign in to proceed seamlessly with your order"
                  : "Register to save your drapes and customize collections"}
              </p>
              <div className="w-10 h-0.5 bg-[#DAA87C] mx-auto mt-2.5 rounded-full"></div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#DAA87C]/50 text-xs font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#DAA87C]/50 text-xs font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-xs font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                />
              </div>

              {mode === "register" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-xs font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-[#1E3A2C]/70 uppercase tracking-widest select-none">
                    Password *
                  </label>
                  <span className="text-[10px] text-[#1E3A2C]/40 font-medium">Min 6 characters</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-[#DAA87C]/50 text-xs font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1E3A2C]/40 hover:text-[#1E3A2C] cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 mt-2 text-xs font-bold btn-animate-border btn-animate-border-dark rounded-full shadow-md shadow-[#1E3A2C]/10 transition-all hover:scale-[1.01] flex items-center justify-center gap-1.5 group cursor-pointer text-white disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-[#DAA87C]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{mode === "login" ? "Signing In..." : "Creating Account..."}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === "login" ? "Sign In" : "Register"}</span>
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Toggle Footer */}
            <div className="text-center pt-2 border-t border-[#1E3A2C]/10 text-xs font-semibold text-[#1E3A2C]/60 select-none">
              {mode === "login" ? (
                <p>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setErrorMessage(null);
                    }}
                    className="text-[#DAA87C] font-bold hover:underline cursor-pointer ml-1"
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMessage(null);
                    }}
                    className="text-[#DAA87C] font-bold hover:underline cursor-pointer ml-1"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
