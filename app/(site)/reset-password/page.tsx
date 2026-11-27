"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Container from "@/components/Container";

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-[#DAA87C]/50 text-sm font-semibold text-[#1E3A2C] placeholder-[#1E3A2C]/30 focus:border-[#1E3A2C] focus:ring-1 focus:ring-[#1E3A2C] outline-none bg-white";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("Password must be at least 6 characters long.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(data.error || "Couldn't change the password. Please try again.");
      } else {
        setDone(true);
        window.dispatchEvent(new Event("thiraala-auth-updated")); // now signed in
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <p className="text-sm text-[#1E3A2C]/70 text-center">
        This page needs the link from your reset email. To get one, choose <strong>Sign In</strong> and then{" "}
        <strong>Forgot password?</strong>
      </p>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-emerald-800 font-semibold">Your password has been changed and you&apos;re signed in.</p>
        <Link href="/products" className="inline-block text-sm font-bold text-[#1E3A2C] underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </p>
      )}
      <label className="flex flex-col gap-1.5 text-[11px] font-bold text-[#1E3A2C]/80 uppercase tracking-wider">
        New password
        <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-[11px] font-bold text-[#1E3A2C]/80 uppercase tracking-wider">
        Confirm new password
        <input type="password" required minLength={6} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="w-full h-11 mt-2 text-sm font-bold rounded-full bg-[#1E3A2C] text-white hover:bg-[#0c2b1c] disabled:opacity-70 cursor-pointer"
      >
        {submitting ? "Saving..." : "Save new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />
      <main className="py-20">
        <Container>
          <div className="max-w-md mx-auto bg-[#fcfbfa] p-8 sm:p-10 rounded-3xl border border-[#1E3A2C]/10 shadow-sm">
            <h1 className="text-2xl font-bold text-[#1E3A2C] text-center mb-6">Choose a new password</h1>
            <Suspense fallback={null}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
