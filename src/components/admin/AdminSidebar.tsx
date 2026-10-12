"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Layers,
  Grid,
  GraduationCap,
  ExternalLink,
  LogOut,
  Shield,
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();
  const { adminEmail, logoutAdmin } = useAdminAuth();

  const navItems = [
    {
      label: "Overview",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      label: "Mock Tests",
      href: "/admin/tests",
      icon: BookOpen,
      badge: "Manage",
    },
    {
      label: "Create New Test",
      href: "/admin/tests/create",
      icon: PlusCircle,
    },
    {
      label: "Test Series Bundles",
      href: "/admin/series",
      icon: Layers,
    },
    {
      label: "Curriculum Categories",
      href: "/admin/categories",
      icon: Grid,
    },
    {
      label: "Student Attempts",
      href: "/admin/attempts",
      icon: GraduationCap,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col h-full text-slate-700 shrink-0 select-none">
      {/* Brand Header: Simple TestOrbit text heading, no logo */}
      <div className="h-16 px-5 border-b border-slate-200/80 flex items-center justify-between bg-white">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
            TestOrbit
          </span>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
          Management Console
        </div>
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-50/90 text-indigo-600 font-semibold border border-indigo-100/90 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && !isActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-normal">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-400">
          Quick Navigation
        </div>
        <Link
          href="/"
          target="_blank"
          className="group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            <span>Live Student Website</span>
          </div>
          <span className="text-[10px] text-slate-400">View</span>
        </Link>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100/80 border border-indigo-200/60 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
            <Shield className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">Administrator</p>
            <p className="text-[11px] text-slate-500 truncate">{adminEmail || "testorbit@ellipse.com"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logoutAdmin}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 bg-white transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Admin Portal</span>
        </button>
      </div>
    </aside>
  );
}
