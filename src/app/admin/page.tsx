"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  Users,
  ShoppingCart,
  TrendingUp,
  PlusCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Flame,
  Database,
  CheckCircle,
} from "lucide-react";
import { StudioMetricCard, StudioBadge } from "@/components/admin/StudioUI";
import { Button } from "@/components/ui/Button";
import { getStudioDashboardMetrics, getAllOrders } from "@/lib/admin/adminDataService";
import { getStudioDashboardMetricsAction } from "@/app/actions/adminStudioActions";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { fetchCanonicalBundles } from "@/lib/data/bundleService";
import { AdminDashboardMetrics, CommerceOrder } from "@/types/admin";
import { MockTest, TestBundle } from "@/types";

export default function StudioDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [recentTests, setRecentTests] = useState<MockTest[]>([]);
  const [recentBundles, setRecentBundles] = useState<TestBundle[]>([]);
  const [recentOrders, setRecentOrders] = useState<CommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        let m: AdminDashboardMetrics;
        try {
          const actionRes = await getStudioDashboardMetricsAction();
          if (actionRes.success && actionRes.data) {
            m = actionRes.data;
          } else {
            m = await getStudioDashboardMetrics();
          }
        } catch {
          m = await getStudioDashboardMetrics();
        }

        const [t, b, o] = await Promise.all([
          fetchCanonicalTests(),
          fetchCanonicalBundles(),
          getAllOrders(),
        ]);

        if (isMounted) {
          setMetrics(m);
          setRecentTests(t.slice(0, 5));
          setRecentBundles(b.slice(0, 5));
          setRecentOrders(o.slice(0, 5));
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Right Column: Platform Administration & Infrastructure */}
        <div className="space-y-6">
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

          {/* Data Management & Import/Export Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Database className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold">Data Export & Backups</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Download complete portable JSON backups of assessment catalogs, question banks, learner profiles, and platform configuration.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
              <span className="text-[11px] text-slate-400">JSON snapshot utility</span>
              <Link
                href="/admin/settings/data"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Manage Backups →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
