"use client";

import React from "react";
import { Navigation, FolderTree, Check } from "lucide-react";
import { CATEGORIES } from "@/data/categories";

export default function NavigationCMSPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Storefront Navigation & Category Ordering
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Controls the primary navbar links and category exploration tabs on the marketplace.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Configured Exploration Categories</h2>
        <div className="divide-y divide-slate-100 text-xs">
          {CATEGORIES.map((cat, idx) => (
            <div key={cat.id} className="py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-800">{cat.name}</span>
                <span className="font-mono text-[10px] text-slate-400">/{cat.slug}</span>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {cat.testCount} Tests Listed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
