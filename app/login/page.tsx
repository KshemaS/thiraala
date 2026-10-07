"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import AdminLoginForm from "@/components/AdminLoginForm";
import { Loader2 } from "lucide-react";
import Image from "next/image";

function LoginContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#FAF8F5]">
        <div className="relative w-32 h-10 mb-4 animate-pulse">
          <Image
            src="/images/thiraala-logo.svg"
            alt="thiraala logo"
            fill
            className="object-contain"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#1E3A2C]/70">
          <Loader2 className="w-4 h-4 animate-spin text-[#DAA87C]" />
          <span>Loading portal...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <AdminLoginForm onSuccess={() => router.push("/dashboard")} />;
}

export default function LoginPage() {
  return (
    <AdminAuthProvider>
      <LoginContent />
    </AdminAuthProvider>
  );
}
