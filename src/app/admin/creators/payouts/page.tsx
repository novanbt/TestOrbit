"use client";

import React from "react";
import { DollarSign, AlertCircle, ShieldAlert } from "lucide-react";
import { StudioEmptyState } from "@/components/admin/StudioUI";

export default function CreatorPayoutsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Creator Revenue Splits & Payouts
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Settlement ledgers, commission percentages, and bank disbursement configurations.
        </p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-800">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Trusted Server Processing Notice:</span>
          <span>
            As per architectural requirements, creator payouts require automated server-side bank reconciliation via Razorpay Route or Stripe Connect. No arbitrary client-side writes are allowed for financial disbursements.
          </span>
        </div>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <StudioEmptyState
          icon={DollarSign}
          title="Automated payouts engine ready"
          description="When test authors accrue earned revenue exceeding the minimum threshold (₹1,000), verified batches will queue here."
        />
      </div>
    </div>
  );
}
