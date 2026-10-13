"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminStudioProvider } from "@/context/AdminStudioContext";
import { StudioSidebar } from "@/components/admin/StudioSidebar";
import { StudioHeader } from "@/components/admin/StudioHeader";

export function AdminStudioClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login route renders full-screen without sidebar/header chrome
  if (pathname === "/admin/login") {
    return <AdminStudioProvider>{children}</AdminStudioProvider>;
  }

  return (
    <AdminStudioProvider>
      <div className="flex h-screen bg-slate-50/60 font-sans antialiased overflow-hidden text-slate-900">
        <StudioSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <StudioHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </AdminStudioProvider>
  );
}
