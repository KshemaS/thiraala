"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle, ArrowLeft, Loader2, Sparkles } from "lucide-react";

interface AdminLoginFormProps {
  onSuccess?: () => void;
}

export default function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const { login } = useAdminAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || "Authentication failed.");
      } else if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setUsername("admin");
    setPassword("admin123");
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#DAA87C]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#1E3A2C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white border border-[#1E3A2C]/10 rounded-3xl shadow-xl shadow-[#1E3A2C]/5 p-8 sm:p-10 relative z-10 backdrop-blur-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-5">
            <div className="inline-block relative w-32 h-10 select-none">
              <Image
                src="/images/thiraala-logo.svg"
                alt="thiraala logo"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#1E3A2C] tracking-tight">
            Login
          </h1>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200/80 flex items-start gap-3 text-xs text-red-700 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label
              htmlFor="admin-username"
              className="block text-xs font-semibold text-[#1E3A2C] mb-1.5 uppercase tracking-wider"
            >
              Username
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#1E3A2C]/40 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. admin)"
                className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-[#1E3A2C]/15 rounded-xl text-sm text-[#1E3A2C] placeholder-[#1E3A2C]/35 outline-none transition-all focus:border-[#1E3A2C] focus:bg-white focus:ring-2 focus:ring-[#1E3A2C]/10"
              />
            </div>
          </div>

          {/* Password Field with Eye Icon */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="admin-password"
                className="block text-xs font-semibold text-[#1E3A2C] uppercase tracking-wider"
              >
                Password
              </label>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-[#1E3A2C]/40 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-12 py-3 bg-[#FAF8F5] border border-[#1E3A2C]/15 rounded-xl text-sm text-[#1E3A2C] placeholder-[#1E3A2C]/35 outline-none transition-all focus:border-[#1E3A2C] focus:bg-white focus:ring-2 focus:ring-[#1E3A2C]/10"
              />
              {/* Eye toggle icon button */}
              <button
                type="button"
                id="toggle-password-visibility"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1.5 rounded-lg text-[#1E3A2C]/50 hover:text-[#1E3A2C] hover:bg-[#1E3A2C]/5 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            id="admin-login-submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 bg-[#1E3A2C] text-[#FAF8F5] font-semibold text-sm rounded-xl shadow-lg shadow-[#1E3A2C]/20 hover:bg-[#15291F] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#DAA87C]" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#DAA87C]" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-[#1E3A2C]/10 text-center">
          <p className="text-[11px] text-[#1E3A2C]/50">
            Authorized personnel only. All access attempts are monitored and logged.
          </p>
        </div>
      </div>
    </div>
  );
}
