"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  Users,
  Award,
  ShoppingCart,
  TrendingUp,
  PlusCircle,
  HelpCircle,
  FileCheck,
  RotateCcw,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Flame,
} from "lucide-react";
import { StudioMetricCard, StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { Button } from "@/components/ui/Button";
import { getStudioDashboardMetrics, getRecentAuditLogs, getAllOrders } from "@/lib/admin/adminDataService";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { getAllCanonicalBundles } from "@/lib/data/bundleService";
import { AdminDashboardMetrics, AuditLog, CommerceOrder } from "@/types/admin";
import { MockTest, TestBundle } from "@/types";

export default function StudioDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [recentTests, setRecentTests] = useState<MockTest[]>([]);
  const [recentBundles, setRecentBundles] = useState<TestBundle[]>([]);
  const [recentOrders, setRecentOrders] = useState<CommerceOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [m, t, b, o, logs] = await Promise.all([
          getStudioDashboardMetrics(),
          fetchCanonicalTests(),
          Promise.resolve(getAllCanonicalBundles()),
          getAllOrders(),
          getRecentAuditLogs(8),
        ]);

        if (isMounted) {
          setMetrics(m);
          setRecentTests(t.slice(0, 5));
          setRecentBundles(b.slice(0, 5));
          setRecentOrders(o.slice(0, 5));
          setAuditLogs(logs);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load dashboard metrics:", err);
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Channel & Platform Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time analytics and management dashboard for TestOrbit assessments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/tests/create">
            <Button variant="primary" size="sm" className="text-xs">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Create Mock Test</span>
            </Button>
          </Link>
          <Link href="/admin/questions">
            <Button variant="outline" size="sm" className="text-xs">
              <HelpCircle className="w-3.5 h-3.5 mr-1" />
              <span>Question Bank</span>
            </Button>
          </Link>
          <Link href="/admin/series">
            <Button variant="outline" size="sm" className="text-xs">
              <Layers className="w-3.5 h-3.5 mr-1" />
              <span>New Series</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StudioMetricCard
          title="Published Mock Tests"
          value={metrics ? metrics.totalTests - metrics.draftTests : "..."}
          subtitle={metrics ? `Total catalogue count: ${metrics.totalTests}` : "Loading..."}
          icon={BookOpen}
          trend="+100% Verified"
          color="indigo"
        />

        <StudioMetricCard
          title="Draft / Staged Tests"
          value={metrics ? metrics.draftTests : "..."}
          subtitle="Tests pending review or scheduling"
          icon={Clock}
          color="amber"
        />

        <StudioMetricCard
          title="Test Series Bundles"
          value={metrics ? metrics.publishedSeries : "..."}
          subtitle="Curated multi-test curriculum packages"
          icon={Layers}
          color="blue"
        />

        <StudioMetricCard
          title="Registered Learners"
          value={metrics ? metrics.totalLearners : "..."}
          subtitle="Total accounts registered on Firebase"
          icon={Users}
          color="emerald"
        />
      </div>

      {/* Second Row: Revenue & Commerce Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StudioMetricCard
          title="Gross Revenue (INR)"
          value={
            metrics
              ? `₹${(metrics.grossSalesInPaise / 100).toLocaleString("en-IN")}`
              : "..."
          }
          subtitle={`From ${metrics?.paidOrders || 0} completed orders`}
          icon={TrendingUp}
          color="emerald"
        />

        <StudioMetricCard
          title="Completed Paid Orders"
          value={metrics ? metrics.paidOrders : "..."}
          subtitle="Verified purchase entitlements granted"
          icon={ShoppingCart}
          color="purple"
        />

        <StudioMetricCard
          title="Refunds Total (INR)"
          value={
            metrics
              ? `₹${(metrics.refundTotalInPaise / 100).toLocaleString("en-IN")}`
              : "..."
          }
          subtitle="Refunded transactions recorded"
          icon={RotateCcw}
          color="amber"
        />
      </div>

      {/* Main Workspace Split: Content Management & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tests & Test Series */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recently Managed Mock Tests */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Recently Managed Mock Tests
                </h2>
                <p className="text-xs text-slate-400">
                  Latest assessment packages published or updated.
                </p>
              </div>
              <Link
                href="/admin/tests"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View all ({metrics ? metrics.totalTests : 0})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentTests.map((test) => (
                <div
                  key={test.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/70 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {test.title}
                      </span>
                      <StudioBadge variant={test.published ? "published" : "draft"} size="sm">
                        {test.published ? "Published" : "Draft"}
                      </StudioBadge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{test.categoryName}</span>
                      <span>•</span>
                      <span>{test.questionCount} Questions</span>
                      <span>•</span>
                      <span>{test.durationMinutes} mins</span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">
                        {test.isFree || test.priceInPaise === 0
                          ? "Free"
                          : `₹${(test.priceInPaise / 100).toFixed(0)}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/admin/tests/${test.slug}/edit`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/tests/${test.slug}`} target="_blank">
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-slate-400 hover:text-slate-600">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test Series Bundles */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Featured Test Series Bundles
                </h2>
                <p className="text-xs text-slate-400">
                  Multi-test packs unlocking single-purchase access.
                </p>
              </div>
              <Link
                href="/admin/series"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View all series</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentBundles.map((series) => (
                <div
                  key={series.id}
                  className="py-3 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/70 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 truncate">
                        {series.title}
                      </span>
                      <StudioBadge variant={series.published ? "published" : "draft"} size="sm">
                        {series.published ? "Published" : "Draft"}
                      </StudioBadge>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{series.categoryName}</span>
                      <span>•</span>
                      <span>{series.includedTestsCount} Mock Tests Included</span>
                      <span>•</span>
                      <span className="font-semibold text-indigo-600">
                        ₹{(series.priceInPaise / 100).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  <Link href={`/admin/series`}>
                    <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">
                      Configure
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Platform Audit Log & System Status */}
        <div className="space-y-6">
          {/* Audit Logs */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Studio Audit Trail
              </h2>
              <Link
                href="/admin/audit-logs"
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
              >
                All Logs
              </Link>
            </div>

            {auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-indigo-600 uppercase tracking-wider">
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-snug font-medium">{log.details}</p>
                    <span className="text-[10px] text-slate-400 block truncate">
                      by {log.actorEmail}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent administrative actions recorded.
              </div>
            )}
          </div>

          {/* Firebase Infrastructure Health Card */}
          <div className="p-5 bg-linear-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold">Firebase Engine Status</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Cloud Firestore and Firebase Authentication are active on project ID{" "}
              <code className="text-amber-300 font-mono text-[11px]">testorbit-3f21c</code>.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-800 text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Enabled
              </span>
              <Link
                href="/admin/settings/integrations"
                className="text-indigo-300 hover:text-white font-medium transition-colors"
              >
                Inspect Config →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
