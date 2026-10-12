"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  Clock,
  TrendingUp,
  Search,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { StoredAttempt } from "@/lib/firebase/firestoreService";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/utils";

export default function AdminAttemptsPage() {
  const [attempts, setAttempts] = useState<StoredAttempt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Scan all local storage keys starting with testorbit_attempts_
    const loadedAttempts: StoredAttempt[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("testorbit_attempts_")) {
          const val = localStorage.getItem(key);
          if (val) {
            const list: StoredAttempt[] = JSON.parse(val);
            loadedAttempts.push(...list);
          }
        }
      }
    } catch {}

    // Sort descending by completion date
    loadedAttempts.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    setAttempts(loadedAttempts);
  }, []);

  const filteredAttempts = attempts.filter((att) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      att.testTitle.toLowerCase().includes(q) ||
      att.testSlug.toLowerCase().includes(q) ||
      att.categoryName.toLowerCase().includes(q)
    );
  });

  const avgAccuracy =
    attempts.length > 0
      ? Math.round(attempts.reduce((acc, a) => acc + (a.accuracyPercentage || 0), 0) / attempts.length)
      : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Student Examination Submissions
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor completed mock tests, student scorecards, and topic accuracy analytics.
        </p>
      </div>

      {/* 2. Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Total Submissions</span>
          <div className="mt-2 text-2xl font-bold text-slate-900">{attempts.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Completed CBT simulations</p>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Cohort Average Accuracy</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {attempts.length > 0 ? `${avgAccuracy}%` : "—"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all test submissions</p>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-slate-500">Database Storage</span>
          <div className="mt-2 text-sm font-bold text-slate-900">Firestore User Attempts</div>
          <p className="text-[11px] text-slate-400 mt-1">Path: /users/[userId]/attempts</p>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search completed tests by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* 4. Submissions Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Marks Scored</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Duration Taken</th>
                <th className="py-3 px-4">Completed On</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No test attempts logged yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      As students submit mock tests via the examination simulator, their records will populate here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900">{att.testTitle}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">/{att.testSlug}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{att.categoryName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {att.marksScored} / {att.maxMarks}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        att.accuracyPercentage >= 75
                          ? "bg-emerald-50 text-emerald-700"
                          : att.accuracyPercentage >= 50
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}>
                        {att.accuracyPercentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {formatDuration(Math.round(att.timeTakenSeconds / 60))}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {new Date(att.completedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link href={`/tests/${att.testSlug}/take`} target="_blank">
                        <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1">
                          <span>Inspect Test</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
