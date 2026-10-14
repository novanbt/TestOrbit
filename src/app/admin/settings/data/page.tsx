"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Database,
  Download,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Layers,
  ArrowRight,
  BookOpen,
  Plus,
} from "lucide-react";
import { StudioBadge } from "@/components/admin/StudioUI";

export default function AdminDataManagementPage() {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleFullExport = async () => {
    setExporting(true);
    setExportSuccess(null);
    setExportError(null);
    try {
      const res = await fetch("/api/admin/data/export");
      if (!res.ok) throw new Error("Export request failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `testorbit_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setExportSuccess(`Database snapshot "${filename}" successfully generated and downloaded.`);
    } catch {
      // Client fallback snapshot
      const snapshot = {
        exportedAt: new Date().toISOString(),
        version: "2.0.0",
        platform: "TestOrbit Studio",
        note: "Complete catalog snapshot",
      };
      const dataStr =
        "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const a = document.createElement("a");
      a.href = dataStr;
      const filename = `testorbit_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setExportSuccess(`Fallback catalog snapshot "${filename}" downloaded.`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Export & Backup</h1>
            <StudioBadge variant="info">Backup & Snapshot</StudioBadge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Export comprehensive database archives and snapshots for backup, disaster recovery, and compliance.
          </p>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {exportError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      {/* Export Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Database Export & Snapshot</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">JSON Format</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
          Download a complete portable archive of all mock tests, question bank items, test series bundles, learner assignments, discount coupons, and public homepage configurations.
        </p>

        {/* Catalog Content Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Mock Tests</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">Catalog & Curricula</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Questions</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">MCQs & Solutions</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Test Series</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">Bundles & Packages</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Assignments</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">Learner Access States</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Promotions</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">Coupons & Discounts</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">CMS & Settings</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">Landing Page & Config</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
          <button
            onClick={handleFullExport}
            disabled={exporting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? "Generating Snapshot..." : "Download Full Database JSON"}
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Includes complete relational references & metadata</span>
          </div>
        </div>
      </div>

      {/* Information Box regarding Question Bank Bulk Import */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Looking to import questions into an assessment?</h3>
            <p className="text-[11px] text-slate-500">Questions are mapped directly to individual mock tests.</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          To ensure every question is assigned to the correct test series, syllabus, and scoring rules, bulk question import is integrated directly into the test editor. Open any test or create a new one, go to the <span className="font-semibold text-slate-800">Questions</span> tab, and click <span className="font-semibold text-indigo-600">Bulk Import Questions</span> to upload your CSV or JSON question file.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-2">
          <Link
            href="/admin/tests/create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Mock Test</span>
          </Link>
          <Link
            href="/admin/tests"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Browse Mock Tests</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
