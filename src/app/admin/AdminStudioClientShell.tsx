"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminStudioProvider, useAdminStudio } from "@/context/AdminStudioContext";
import { StudioSidebar } from "@/components/admin/StudioSidebar";
import { StudioHeader } from "@/components/admin/StudioHeader";

function StudioProtectedView({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminStudio();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !admin) {
      router.replace(`/admin/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [loading, admin, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500 space-y-3 font-sans">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wide uppercase">Verifying Administrator Access...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500 space-y-3 font-sans">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wide uppercase">Redirecting to Administrator Login...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50/60 font-sans antialiased overflow-hidden text-slate-900">
      <StudioSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <StudioHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AdminStudioClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // The login route renders full-screen without sidebar/header chrome
  if (pathname === "/admin/login") {
    return <AdminStudioProvider>{children}</AdminStudioProvider>;
  }

  return (
    <AdminStudioProvider>
      <StudioProtectedView>{children}</StudioProtectedView>
    </AdminStudioProvider>
  );
}
