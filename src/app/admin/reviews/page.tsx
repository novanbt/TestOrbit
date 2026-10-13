"use client";

import React from "react";
import { MessageSquare, Star, CheckCircle } from "lucide-react";
import { StudioEmptyState } from "@/components/admin/StudioUI";

export default function ReviewsFeedbackPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Learner Feedback & Question Reviews
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Student bug reports on question statements, typographical flags, and test ratings.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <StudioEmptyState
          icon={MessageSquare}
          title="No learner flags or dispute reports pending"
          description="Reports submitted by learners during CBT examinations will be queued here for faculty review."
        />
      </div>
    </div>
  );
}
