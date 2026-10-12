"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
  HelpCircle,
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
      highlight: true,
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-300 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image
            src="/logo-nav.png"
            alt="TestOrbit"
            width={130}
            height={30}
            className="h-7 w-auto object-contain brightness-200 contrast-125"
          />
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Admin
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-500">
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
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && !isActive && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-500">
          Quick Navigation
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-4 h-4 text-slate-400" />
            <span>Live Student Website</span>
          </div>
          <span className="text-[10px] text-slate-500">View</span>
        </Link>
      </div>

      {/* Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-xs">
            <Shield className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">Administrator</p>
            <p className="text-[11px] text-slate-400 truncate">{adminEmail || "testorbit@ellipse.com"}</p>
          </div>
        </div>

        <button
          onClick={logoutAdmin}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Admin Portal</span>
        </button>
      </div>
    </aside>
  );
}
