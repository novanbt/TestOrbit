"use client";

import React from "react";
import { UserPlus, TrendingUp } from "lucide-react";
import { StudioEmptyState } from "@/components/admin/StudioUI";

export default function LearnerAnalyticsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Learner Growth & Retention Cohorts
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Student registration velocities, repeat attempt rates, and exam completion metrics.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <StudioEmptyState
          icon={UserPlus}
          title="Retention tracking active"
          description="Cohorts are segmented automatically based on registration date and target examination goal."
        />
      </div>
    </div>
  );
}
