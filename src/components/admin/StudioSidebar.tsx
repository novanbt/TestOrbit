"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bell,
  BookOpen,
  PlusCircle,
  Layers,
  FolderTree,
  ShoppingCart,
  Receipt,
  Percent,
  Users,
  Award,
  CheckCircle,
  Globe,
  Star,
  Megaphone,
  Flame,
  Database,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import { useAdminStudio } from "@/context/AdminStudioContext";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
    ],
  },
  {
    id: "content",
    title: "Content",
    items: [
      { label: "All Tests", href: "/admin/tests", icon: BookOpen },
      { label: "Create Test", href: "/admin/tests/create", icon: PlusCircle },
      { label: "Test Series", href: "/admin/series", icon: Layers },
      { label: "Categories", href: "/admin/categories", icon: FolderTree },
    ],
  },
  {
    id: "commerce",
    title: "Commerce",
    items: [
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
      { label: "Transactions", href: "/admin/transactions", icon: Receipt },
      { label: "Coupons & Offers", href: "/admin/coupons", icon: Percent },
    ],
  },
  {
    id: "learners",
    title: "Learners & Community",
    items: [
      { label: "All Learners", href: "/admin/learners", icon: Users },
      { label: "Test Attempts", href: "/admin/attempts", icon: Award },
      { label: "Results & Scores", href: "/admin/results", icon: CheckCircle },
    ],
  },
  {
    id: "website",
    title: "Website Management",
    items: [
      { label: "Homepage CMS", href: "/admin/website/homepage", icon: Globe },
      { label: "Featured Tests", href: "/admin/website/featured-tests", icon: Star },
      { label: "Featured Series", href: "/admin/website/featured-series", icon: Layers },
      { label: "Announcements", href: "/admin/website/announcements", icon: Megaphone },
    ],
  },
  {
    id: "administration",
    title: "Administration",
    items: [
      { label: "Firebase Status", href: "/admin/settings/integrations", icon: Flame },
      { label: "Data Export", href: "/admin/settings/data", icon: Database },
    ],
  },
];

export function StudioSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, isMobileSidebarOpen, setMobileSidebarOpen } = useAdminStudio();

  // Keep track of which groups are expanded in sidebar
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 shrink-0">
        <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
          <Image
            src="/logo-nav.png"
            alt="TestOrbit"
            width={120}
            height={32}
            className="h-7 w-auto object-contain"
          />
          {!isSidebarCollapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              Studio
            </span>
          )}
        </Link>
        {isMobileSidebarOpen && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
        {NAV_GROUPS.map((group) => {
          const isGroupCollapsed = collapsedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1">
              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span>{group.title}</span>
                  {isGroupCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {!isGroupCollapsed && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center gap-3 px-2.5 py-2 rounded-lg text-xs font-medium transition-all",
                          isActive
                            ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                            : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                          )}
                        />
                        {!isSidebarCollapsed && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}
                        {!isSidebarCollapsed && item.badge && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Public Site Link Footer */}
      <div className="p-3 border-t border-slate-200/80 shrink-0 bg-slate-50/50">
        <Link
          href="/"
          target="_blank"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all",
            isSidebarCollapsed && "justify-center px-0"
          )}
          title="Open Public Website"
        >
          <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
          {!isSidebarCollapsed && (
            <div className="flex-1 truncate">
              <span className="block truncate font-semibold">TestOrbit Web</span>
              <span className="text-[10px] text-slate-400 block truncate">Open Live Platform</span>
            </div>
          )}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-slate-200/80 h-screen sticky top-0 transition-all duration-200 bg-white z-30 shrink-0",
          isSidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
