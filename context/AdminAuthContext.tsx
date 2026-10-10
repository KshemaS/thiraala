"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AdminUser {
  username: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// The session lives in an httpOnly cookie set by /api/admin/login; this context
// only mirrors it for the UI. Authorization is enforced server-side.
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setUser(data?.authenticated ? data.user : null);
      })
      .catch((e) => console.error("Failed to load admin session", e))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (usernameInput: string, passwordInput: string): Promise<{ success: boolean; error?: string }> => {
      const username = usernameInput.trim();
      if (!username || !passwordInput) {
        return { success: false, error: "Please enter both username and password." };
      }

      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password: passwordInput }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          return { success: false, error: data?.error || "Invalid username or password." };
        }
        setUser(data.user);
        return { success: true };
      } catch {
        return { success: false, error: "Unable to reach the server. Please try again." };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout request failed", e);
    }
    setUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: user !== null,
        isLoading,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
