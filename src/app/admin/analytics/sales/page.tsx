"use client";

import React, { useState, useEffect } from "react";
import { Compass, TrendingUp, DollarSign } from "lucide-react";
import { StudioMetricCard } from "@/components/admin/StudioUI";
import { getStudioDashboardMetrics, getAllOrders } from "@/lib/admin/adminDataService";
import { AdminDashboardMetrics, CommerceOrder } from "@/types/admin";

export default function SalesAnalyticsPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [orders, setOrders] = useState<CommerceOrder[]>([]);

  useEffect(() => {
    getStudioDashboardMetrics().then(setMetrics);
    getAllOrders().then(setOrders);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Sales & Financial Performance Reports
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed breakdown between gross sales, net revenue, refunds, and average order value.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StudioMetricCard
          title="Gross Sales Volume"
          value={metrics ? `₹${(metrics.grossSalesInPaise / 100).toLocaleString("en-IN")}` : "₹0"}
          subtitle="Total learner payments received"
          icon={TrendingUp}
          color="emerald"
        />
        <StudioMetricCard
          title="Total Paid Orders"
          value={metrics?.paidOrders || 0}
          subtitle="Completed checkout operations"
          icon={Compass}
          color="indigo"
        />
        <StudioMetricCard
          title="Refund Total"
          value={metrics ? `₹${(metrics.refundTotalInPaise / 100).toLocaleString("en-IN")}` : "₹0"}
          subtitle="Processed refunds"
          icon={DollarSign}
          color="amber"
        />
      </div>
    </div>
  );
}
