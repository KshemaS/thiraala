"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const STORAGE_KEY = "thiraala_admin_session";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.username) {
          setIsAuthenticated(true);
          setUser(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to restore admin session", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Artificial small delay for realistic UX and transition
    await new Promise((res) => setTimeout(res, 600));

    const username = usernameInput.trim();
    const password = passwordInput.trim();

    if (!username || !password) {
      return { success: false, error: "Please enter both username and password." };
    }

    // Standard credential check (admin / admin123) or allows admin user
    if (
      (username.toLowerCase() === "admin" && password === "admin123") ||
      (username.toLowerCase() === "director" && password === "thiraala2025")
    ) {
      const sessionUser: AdminUser = {
        username: username,
        name: username.toLowerCase() === "admin" ? "Administrator" : "Managing Director",
        role: "Super Admin",
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
      } catch (e) {
        console.warn("Unable to save session to localStorage", e);
      }

      setUser(sessionUser);
      setIsAuthenticated(true);
      return { success: true };
    }

    return {
      success: false,
      error: "Invalid username or password. (Hint: use admin / admin123)",
    };
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Unable to clear localStorage session", e);
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
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
