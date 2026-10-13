"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { loginAdminAction } from "@/app/actions/adminStudioActions";
import { useAdminStudio } from "@/context/AdminStudioContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshSession } = useAdminStudio();

  const [email, setEmail] = useState("testorbit@ellipse.com");
  const [password, setPassword] = useState("tdSUi4rqJ_NN3n4");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both administrator email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await loginAdminAction(email, password);
      if (res.success) {
        await refreshSession();
        router.push("/admin");
      } else {
        setErrorMessage(res.error || "Authentication failed. Please verify credentials.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 shadow-sm space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-block transition-opacity hover:opacity-90">
            <Image
              src="/logo-nav.png"
              alt="TestOrbit"
              width={160}
              height={42}
              className="h-9 w-auto mx-auto object-contain"
              priority
            />
          </div>
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              TestOrbit Studio Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Authoritative platform management & live catalogue studio.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="testorbit@ellipse.com"
                className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Access Secret Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10 pl-9 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full h-10 text-xs font-semibold mt-2"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Authenticating Studio Session...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span>Enter TestOrbit Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            href="/"
            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Return to Public TestOrbit Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
