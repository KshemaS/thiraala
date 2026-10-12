"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface UserData {
  id?: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string | null;
  role?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: UserData }>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string; user?: UserData }>;
  logout: () => Promise<void>;
  setUser: (user: UserData | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync user state and notify other components
  const setUser = (newUser: UserData | null) => {
    setUserState(newUser);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("thiraala-auth-updated"));
    }
  };

  // Check current session from backend /api/auth/me
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setUserState(data.user);
          return;
        }
      }
      setUserState(null);
    } catch (err) {
      console.error("Failed to check auth session:", err);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();

    const handleAuthUpdate = () => {
      checkSession();
    };

    window.addEventListener("thiraala-auth-updated", handleAuthUpdate);
    return () => {
      window.removeEventListener("thiraala-auth-updated", handleAuthUpdate);
    };
  }, [checkSession]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        return {
          success: false,
          error: data?.error || "Login failed. Please check your credentials.",
        };
      }

      setUserState(data.user);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("thiraala-auth-updated"));
      }

      return { success: true, user: data.user };
    } catch (err) {
      console.error("Login request error:", err);
      return { success: false, error: "Network error occurred. Please try again." };
    }
  };

  const signup = async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone?: string;
  }) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          email: data.email.trim(),
          password: data.password?.trim() || undefined,
          phone: data.phone?.trim() || undefined,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        return {
          success: false,
          error: result?.error || "Registration failed. Please check your details.",
        };
      }

      setUserState(result.user);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("thiraala-auth-updated"));
      }

      return { success: true, user: result.user };
    } catch (err) {
      console.error("Signup request error:", err);
      return { success: false, error: "Network error occurred. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request error:", err);
    }
    setUserState(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("thiraala-auth-updated"));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: Boolean(user),
        login,
        signup,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
