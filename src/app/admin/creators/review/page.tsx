"use client";

import React from "react";
import { ClipboardList, CheckCircle } from "lucide-react";
import { StudioEmptyState } from "@/components/admin/StudioUI";

export default function CreatorContentReviewPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Creator Content Quality Review
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Syllabus calibration and peer-review queue for tests authored by external contributors.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <StudioEmptyState
          icon={ClipboardList}
          title="Review queue empty"
          description="All tests submitted by verified authors have been peer-reviewed and published."
        />
      </div>
    </div>
  );
}
