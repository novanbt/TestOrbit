"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { AdminUser, AdminNotification } from "@/types/admin";
import { getActiveAdminSessionAction, logoutAdminAction } from "@/app/actions/adminStudioActions";

interface AdminStudioContextType {
  admin: AdminUser | null;
  loading: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  notifications: AdminNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AdminStudioContext = createContext<AdminStudioContextType>({
  admin: null,
  loading: true,
  isSidebarCollapsed: false,
  toggleSidebar: () => {},
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: () => {},
  notifications: [],
  unreadNotificationCount: 0,
  markNotificationAsRead: () => {},
  refreshSession: async () => {},
  signOut: async () => {},
});

export function AdminStudioProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Initial simulated notification list for live studio
  const [notifications, setNotifications] = useState<AdminNotification[]>([
    {
      id: "notif-1",
      title: "System Online",
      message: "TestOrbit Studio is connected to authoritative Firebase backend.",
      type: "success",
      read: false,
      timestamp: "2026-10-13T10:00:00.000Z",
    },
    {
      id: "notif-2",
      title: "Catalogue Synced",
      message: "117 curriculum-aligned assessments loaded in canonical registry.",
      type: "info",
      read: false,
      timestamp: "2026-10-13T09:00:00.000Z",
    },
  ]);

  const refreshSession = async () => {
    try {
      const res = await getActiveAdminSessionAction();
      if (res.success && res.data) {
        setAdmin(res.data);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const signOut = async () => {
    try {
      if (auth && isFirebaseConfigured) {
        await firebaseSignOut(auth).catch(() => {});
      }
    } catch {}
    await logoutAdminAction();
    setAdmin(null);
    router.push("/admin/login");
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <AdminStudioContext.Provider
      value={{
        admin,
        loading,
        isSidebarCollapsed,
        toggleSidebar,
        isMobileSidebarOpen,
        setMobileSidebarOpen,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </AdminStudioContext.Provider>
  );
}

export function useAdminStudio() {
  return useContext(AdminStudioContext);
}
