"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink, ShieldCheck, ChevronRight } from "lucide-react";

interface AdminHeaderProps {
  onOpenMobileMenu: () => void;
}

export function AdminHeader({ onOpenMobileMenu }: AdminHeaderProps) {
  const pathname = usePathname();

  // Generate readable breadcrumb from pathname
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length <= 1) return [{ label: "Dashboard Overview", href: "/admin" }];

    const crumbs = [{ label: "Admin", href: "/admin" }];
    let pathAcc = "/admin";

    for (let i = 1; i < parts.length; i++) {
      pathAcc += `/${parts[i]}`;
      const raw = parts[i];
      let label = raw.charAt(0).toUpperCase() + raw.slice(1);
      if (raw === "tests") label = "Mock Tests";
      if (raw === "create") label = "Create Test";
      if (raw === "series") label = "Test Series";
      if (raw === "categories") label = "Categories";
      if (raw === "questions") label = "Question Bank";
      if (raw === "attempts") label = "Student Attempts";
      crumbs.push({ label, href: pathAcc });
    }
    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const currentTitle = breadcrumbs[breadcrumbs.length - 1]?.label || "Administration";

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-1.5 text-xs text-slate-500">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.href}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-slate-900">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-slate-800 transition-colors">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* System Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Catalog Live</span>
        </div>

        {/* Public Storefront Link */}
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <span>View Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </Link>
      </div>
    </header>
  );
}
