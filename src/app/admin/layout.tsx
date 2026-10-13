import React, { Suspense } from "react";
import { AdminStudioClientShell } from "./AdminStudioClientShell";

export const metadata = {
  title: "TestOrbit Studio | Platform Management",
  description: "Administrative console and content publishing studio for TestOrbit CBT platform.",
};

export default function AdminStudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500 space-y-3 font-sans">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wide uppercase">Initializing TestOrbit Studio...</p>
        </div>
      }
    >
      <AdminStudioClientShell>{children}</AdminStudioClientShell>
    </Suspense>
  );
}
