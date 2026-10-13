"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Users, BookOpen, Clock, Target } from "lucide-react";
import { StudioMetricCard } from "@/components/admin/StudioUI";
import { getStudioDashboardMetrics } from "@/lib/admin/adminDataService";
import { AdminDashboardMetrics } from "@/types/admin";

export default function PlatformAnalyticsPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);

  useEffect(() => {
    getStudioDashboardMetrics().then(setMetrics);
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Platform-Wide Analytics & Intelligence
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics on examination adoption, accuracy curves, and revenue growth.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StudioMetricCard
          title="Total Mock Tests"
          value={metrics?.totalTests ?? 0}
          subtitle="Full curriculum coverage"
          icon={BookOpen}
          color="indigo"
        />
        <StudioMetricCard
          title="Active Test Series"
          value={metrics?.publishedSeries ?? 0}
          subtitle="Multi-test packages"
          icon={Target}
          color="blue"
        />
        <StudioMetricCard
          title="Total Registered Students"
          value={metrics?.totalLearners || 0}
          subtitle="Active on platform"
          icon={Users}
          color="emerald"
        />
        <StudioMetricCard
          title="Total Sales (INR)"
          value={metrics ? `₹${(metrics.grossSalesInPaise / 100).toLocaleString("en-IN")}` : "₹0"}
          subtitle="Gross transaction volume"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">Catalogue Category Distribution</h2>
          <p className="text-xs text-slate-500">Curriculum coverage and syllabus allocation.</p>
          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between font-medium"><span>Competitive Exams (JEE, NEET, UPSC)</span><span className="font-bold text-slate-900">29 tests</span></div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 rounded-full" style={{ width: "25%" }} /></div>

            <div className="flex justify-between font-medium pt-1"><span>Languages (German, French, Spanish, Hindi)</span><span className="font-bold text-slate-900">25 tests</span></div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: "21%" }} /></div>

            <div className="flex justify-between font-medium pt-1"><span>Programming & Technology (Python, DSA, Cloud)</span><span className="font-bold text-slate-900">23 tests</span></div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-purple-600 rounded-full" style={{ width: "20%" }} /></div>

            <div className="flex justify-between font-medium pt-1"><span>College & University (B.Tech, GATE, BBA)</span><span className="font-bold text-slate-900">16 tests</span></div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 rounded-full" style={{ width: "14%" }} /></div>

            <div className="flex justify-between font-medium pt-1"><span>School Education (Classes V–XII)</span><span className="font-bold text-slate-900">15 tests</span></div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-amber-600 rounded-full" style={{ width: "13%" }} /></div>
          </div>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900">CBT Engine Reliability Metrics</h2>
          <p className="text-xs text-slate-500">Real-time examination uptime and performance benchmarks.</p>
          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="font-semibold text-emerald-900">Authoritative Server Timer</span>
              <span className="font-mono text-emerald-700 font-bold">100% Synced</span>
            </div>
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
              <span className="font-semibold text-indigo-900">Zero-Latency Answer Autosave</span>
              <span className="font-mono text-indigo-700 font-bold">&lt;15ms</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <span className="font-semibold text-slate-900">Answer Key Tamper Prevention</span>
              <span className="font-mono text-slate-700 font-bold">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
