"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut as firebaseSignOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { AdminUser, AdminNotification } from "@/types/admin";
import {
  getActiveAdminSessionAction,
  logoutAdminAction,
  getAdminNotificationsAction,
  markAllNotificationsReadAction,
  toggleNotificationReadAction,
  dismissNotificationAction,
} from "@/app/actions/adminStudioActions";

const NOTIF_STORAGE_KEY = "testorbit_admin_notifications_state_v1";

interface LocalNotificationState {
  readMap: Record<string, boolean>;
  dismissedIds: string[];
}

function loadLocalNotificationState(): LocalNotificationState {
  if (typeof window === "undefined") return { readMap: {}, dismissedIds: [] };
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { readMap: {}, dismissedIds: [] };
}

function saveLocalNotificationState(state: LocalNotificationState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export const DEFAULT_ADMIN_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "notif-1",
    title: "Catalog Synchronization Successful",
    message: "Canonical mock test and question repository synced with Firebase Firestore.",
    type: "success",
    read: true,
    timestamp: "2026-10-18T10:45:00.000Z",
    link: "/admin/tests",
  },
  {
    id: "notif-2",
    title: "New Learner Registration",
    message: "A new learner profile was created with active examination permissions.",
    type: "info",
    read: true,
    timestamp: "2026-10-18T09:00:00.000Z",
    link: "/admin/learners",
  },
  {
    id: "notif-3",
    title: "Security Rule Audit",
    message: "Firestore security rules audit passed: public catalogue and test attempts cleanly sandboxed.",
    type: "info",
    read: true,
    timestamp: "2026-10-17T12:00:00.000Z",
    link: "/admin/settings/integrations",
  },
  {
    id: "notif-4",
    title: "Platform Backup Prepared",
    message: "Automated snapshot of all test series, assignments, and coupons ready for JSON download.",
    type: "info",
    read: true,
    timestamp: "2026-10-16T18:00:00.000Z",
    link: "/admin/settings/data",
  },
];

interface AdminStudioContextType {
  admin: AdminUser | null;
  loading: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  notifications: AdminNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  toggleNotificationRead: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
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
  markNotificationAsRead: async () => {},
  markAllNotificationsAsRead: async () => {},
  toggleNotificationRead: async () => {},
  dismissNotification: async () => {},
  refreshNotifications: async () => {},
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

  // Initialize notifications with local cache or default
  const [notifications, setNotifications] = useState<AdminNotification[]>(() => {
    const local = loadLocalNotificationState();
    const dismissedSet = new Set(local.dismissedIds);
    return DEFAULT_ADMIN_NOTIFICATIONS.filter((n) => !dismissedSet.has(n.id)).map((n) => ({
      ...n,
      read: local.readMap[n.id] !== undefined ? local.readMap[n.id] : true,
    }));
  });

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

  const refreshNotifications = useCallback(async () => {
    try {
      const local = loadLocalNotificationState();
      const dismissedSet = new Set(local.dismissedIds);
      const res = await getAdminNotificationsAction();

      let sourceList: AdminNotification[] =
        res.success && res.data && res.data.length > 0 ? res.data : DEFAULT_ADMIN_NOTIFICATIONS;

      // Filter out locally dismissed
      sourceList = sourceList.filter((n) => !dismissedSet.has(n.id));

      // Apply local read status overrides so instant user actions are never overwritten
      const merged = sourceList.map((n) => ({
        ...n,
        read: local.readMap[n.id] !== undefined ? local.readMap[n.id] : n.read,
      }));

      setNotifications(merged);
    } catch {
      // Graceful fallback
    }
  }, []);

  useEffect(() => {
    refreshSession();
    refreshNotifications();
  }, [refreshNotifications]);

  // Close mobile drawer on route transition
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const local = loadLocalNotificationState();
    local.readMap[id] = true;
    saveLocalNotificationState(local);
    await toggleNotificationReadAction(id, true).catch(() => {});
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const local = loadLocalNotificationState();
    notifications.forEach((n) => {
      local.readMap[n.id] = true;
    });
    saveLocalNotificationState(local);
    await markAllNotificationsReadAction().catch(() => {});
  };

  const toggleNotificationRead = async (id: string) => {
    const target = notifications.find((n) => n.id === id);
    const newRead = !target?.read;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: newRead } : n))
    );
    const local = loadLocalNotificationState();
    local.readMap[id] = newRead;
    saveLocalNotificationState(local);
    await toggleNotificationReadAction(id, newRead).catch(() => {});
  };

  const dismissNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const local = loadLocalNotificationState();
    if (!local.dismissedIds.includes(id)) {
      local.dismissedIds.push(id);
    }
    saveLocalNotificationState(local);
    await dismissNotificationAction(id).catch(() => {});
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
        markAllNotificationsAsRead,
        toggleNotificationRead,
        dismissNotification,
        refreshNotifications,
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

