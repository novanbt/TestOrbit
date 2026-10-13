"use client";

import React from "react";
import { CheckCircle2, TrendingUp, BarChart3 } from "lucide-react";
import { StudioEmptyState } from "@/components/admin/StudioUI";

export default function ResultsPerformancePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Exam Results & Difficulty Calibration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Percentile distributions, question discrimination indices, and aggregate test scorecards.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <StudioEmptyState
          icon={BarChart3}
          title="Statistical calibration active"
          description="As exam cohorts complete mock assessments, automated percentile ranking and item-difficulty analysis will populate here."
        />
      </div>
    </div>
  );
}
