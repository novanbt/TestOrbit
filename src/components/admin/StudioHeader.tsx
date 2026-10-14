"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Plus,
  Bell,
  ExternalLink,
  ChevronDown,
  LogOut,
  Flame,
  Database,
  Layers,
  BookOpen,
} from "lucide-react";
import { useAdminStudio } from "@/context/AdminStudioContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function StudioHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    admin,
    toggleSidebar,
    setMobileSidebarOpen,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    signOut,
  } = useAdminStudio();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/tests?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Generate dynamic breadcrumbs from path
  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbTitle =
    pathParts.length > 1
      ? pathParts[pathParts.length - 1].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Dashboard Overview";

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 px-4 flex items-center justify-between gap-4">
      {/* Left Section: Mobile toggle, Collapse toggle, and Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => {
            if (window.innerWidth < 768) {
              setMobileSidebarOpen(true);
            } else {
              toggleSidebar();
            }
          }}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <span>Studio</span>
            {pathParts.length > 1 && (
              <>
                <span>/</span>
                <span className="capitalize">{pathParts[1]}</span>
              </>
            )}
          </div>
          <h1 className="text-sm font-bold text-slate-900 truncate">
            {breadcrumbTitle}
          </h1>
        </div>
      </div>

      {/* Middle: Studio Global Search */}
      <div className="flex-1 max-w-md hidden md:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tests, series, orders, learners..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs border border-slate-200/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
          />
        </form>
      </div>

      {/* Right Section: Quick Create, Notifications, Preview, User Menu */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Create Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setCreateMenuOpen((prev) => !prev);
              setNotificationsOpen(false);
              setUserMenuOpen(false);
            }}
            className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="w-3 h-3 text-indigo-200" />
          </button>

          {createMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95">
              <span className="block px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Content Creation
              </span>
              <Link
                href="/admin/tests/create"
                onClick={() => setCreateMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>New Mock Test</span>
              </Link>
              <Link
                href="/admin/series"
                onClick={() => setCreateMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>New Test Series Bundle</span>
              </Link>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setCreateMenuOpen(false);
              setUserMenuOpen(false);
            }}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotificationCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-3.5 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {unreadNotificationCount} New
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationAsRead(n.id)}
                    className={cn(
                      "p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer space-y-0.5",
                      !n.read && "bg-indigo-50/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Site Preview Link */}
        <Link
          href="/"
          target="_blank"
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Open live learner storefront"
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          <span>Live Site</span>
        </Link>

        {/* Admin Account Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((prev) => !prev);
              setCreateMenuOpen(false);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-linear-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {admin?.name ? admin.name.charAt(0) : "A"}
            </div>
            <div className="hidden xl:block text-left">
              <span className="block text-xs font-bold text-slate-900 leading-none">
                {admin?.name || "Administrator"}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">
                {admin?.role?.replace(/_/g, " ") || "Super Admin"}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden xl:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40 animate-in fade-in zoom-in-95">
              <div className="px-3.5 py-2 border-b border-slate-100 space-y-1">
                <span className="block text-xs font-bold text-slate-900">
                  {admin?.name || "Administrator"}
                </span>
                <span className="block text-[11px] text-slate-500 truncate">
                  {admin?.email || "testorbit@ellipse.com"}
                </span>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-emerald-700">
                    Firebase Live Engine Connected
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/settings/integrations"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Firebase Status</span>
                </Link>
                <Link
                  href="/admin/settings/data"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <Database className="w-4 h-4 text-indigo-500" />
                  <span>Data Export</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Studio</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
