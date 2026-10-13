"use client";

import React from "react";
import { UserCheck, Clock, CheckCircle } from "lucide-react";
import { StudioEmptyState } from "@/components/admin/StudioUI";

export default function CreatorApplicationsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Creator & Institution Applications
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review educator credentials, coaching institute affiliations, and sample test materials.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <StudioEmptyState
          icon={UserCheck}
          title="No pending onboarding applications"
          description="Educator applications submitted via the partnership portal will appear here for verification."
        />
      </div>
    </div>
  );
}
