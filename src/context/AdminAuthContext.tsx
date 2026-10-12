"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AdminAuthContextType {
  isAdmin: boolean;
  adminEmail: string | null;
  loading: boolean;
  loginAdmin: (email: string, pass: string) => { success: boolean; error?: string };
  logoutAdmin: () => void;
}

const ADMIN_CREDENTIALS = {
  email: "testorbit@ellipse.com",
  password: "tdSUi4rqJ_NN3n4",
};

const ADMIN_STORAGE_KEY = "testorbit_admin_auth_token";

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdmin: false,
  adminEmail: null,
  loading: true,
  loginAdmin: () => ({ success: false, error: "Not initialized" }),
  logoutAdmin: () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = sessionStorage.getItem(ADMIN_STORAGE_KEY) || localStorage.getItem(ADMIN_STORAGE_KEY);
      if (token) {
        const parsed = JSON.parse(token);
        if (parsed.email === ADMIN_CREDENTIALS.email && parsed.validUntil > Date.now()) {
          setIsAdmin(true);
          setAdminEmail(parsed.email);
        } else {
          sessionStorage.removeItem(ADMIN_STORAGE_KEY);
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      }
    } catch {
      // Invalid token format
    } finally {
      setLoading(false);
    }
  }, []);

  const loginAdmin = (email: string, pass: string): { success: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = pass.trim();

    if (!trimmedEmail || !trimmedPass) {
      return { success: false, error: "Please enter both administrator email and password." };
    }

    if (trimmedEmail !== ADMIN_CREDENTIALS.email.toLowerCase() || trimmedPass !== ADMIN_CREDENTIALS.password) {
      return { success: false, error: "Invalid administrator credentials. Access denied." };
    }

    const sessionPayload = {
      email: ADMIN_CREDENTIALS.email,
      role: "super_admin",
      createdAt: new Date().toISOString(),
      validUntil: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    try {
      sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(sessionPayload));
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(sessionPayload));
    } catch {}

    setIsAdmin(true);
    setAdminEmail(ADMIN_CREDENTIALS.email);
    return { success: true };
  };

  const logoutAdmin = () => {
    try {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {}
    setIsAdmin(false);
    setAdminEmail(null);
    router.push("/admin/login");
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, adminEmail, loading, loginAdmin, logoutAdmin }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
