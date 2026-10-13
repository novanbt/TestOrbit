"use client";

import React from "react";
import { TrendingUp, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PricingOffersPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Pricing Tiers & Catalogue Offers
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Platform-wide assessment pricing thresholds and bundle discount configurations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Starter Tier</span>
          <h2 className="text-2xl font-black text-slate-900">₹0 <span className="text-xs font-medium text-slate-400">/ Free Access</span></h2>
          <p className="text-xs text-slate-500">Unrestricted diagnostic tests and preliminary syllabus mocks.</p>
          <div className="pt-2 text-xs text-slate-600 space-y-1.5 border-t border-slate-100">
            <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Full CBT Runner interface</div>
            <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Instant accuracy scorecard</div>
          </div>
        </div>

        <div className="p-6 bg-white border-2 border-indigo-600 rounded-2xl shadow-sm space-y-4 relative">
          <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-600 text-white">
            Standard Mock
          </span>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">Per-Test Access</span>
          <h2 className="text-2xl font-black text-slate-900">₹99 – ₹299 <span className="text-xs font-medium text-slate-400">/ test</span></h2>
          <p className="text-xs text-slate-500">Full-length standardized national examination mocks with detailed answer explanations.</p>
          <div className="pt-2 text-xs text-slate-600 space-y-1.5 border-t border-slate-100">
            <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Verified question bank explanations</div>
            <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-indigo-600" /> Lifetime attempt history</div>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Curriculum Bundles</span>
          <h2 className="text-2xl font-black text-slate-900">₹499 – ₹999 <span className="text-xs font-medium text-slate-400">/ series</span></h2>
          <p className="text-xs text-slate-500">Multi-test packages unlocking 5 to 15 full syllabus assessments with high discounts.</p>
          <div className="pt-2 text-xs text-slate-600 space-y-1.5 border-t border-slate-100">
            <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Up to 65% reference savings</div>
            <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-emerald-600" /> Automated test unlocking</div>
          </div>
        </div>
      </div>
    </div>
  );
}
