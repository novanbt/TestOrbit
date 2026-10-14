"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  TrendingUp,
  BarChart3,
  Award,
  Clock,
  Search,
  Users,
  Target,
  FileText,
} from "lucide-react";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { StoredAttempt } from "@/lib/firebase/firestoreService";
import { getAdminTestAttemptsAction } from "@/app/actions/adminStudioActions";

export default function ResultsPerformancePage() {
  const [attempts, setAttempts] = useState<StoredAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getAdminTestAttemptsAction();
        if (res.success && res.data) {
          setAttempts(res.data);
        }
      } catch (err) {
        console.error("Failed to load results:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalAttempts = attempts.length;
  const avgAccuracy =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce((acc, cur) => acc + (cur.accuracyPercentage || 0), 0) /
            totalAttempts
        )
      : 0;

  const avgScorePercentage =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce(
            (acc, cur) =>
              acc +
              ((cur.marksScored || 0) / (cur.maxMarks || 1)) * 100,
            0
          ) / totalAttempts
        )
      : 0;

  const totalMinutesSpent = Math.round(
    attempts.reduce((acc, cur) => acc + (cur.timeTakenSeconds || 0), 0) / 60
  );

  const filtered = attempts.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.testTitle?.toLowerCase().includes(q) ||
      a.userName?.toLowerCase().includes(q) ||
      a.userEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Exam Results & Difficulty Calibration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Percentile distributions, question discrimination indices, and aggregate test scorecards.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Evaluated Tests
            </span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalAttempts}</div>
          <p className="text-[11px] text-slate-400">Total completed assessments</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Cohort Accuracy
            </span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{avgAccuracy}%</div>
          <p className="text-[11px] text-slate-400">Average student accuracy</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Score Average
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{avgScorePercentage}%</div>
          <p className="text-[11px] text-slate-400">Mean scaled score achieved</p>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Practice Time
            </span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalMinutesSpent}m</div>
          <p className="text-[11px] text-slate-400">Cumulative test runtime</p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exam results by student name, email, or test title..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Student Scorecards & Outcome Logs ({filtered.length})
            </h2>
          </div>
          <StudioBadge variant="success" size="sm">
            Live Synchronized
          </StudioBadge>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Calculating student result indices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <StudioEmptyState
            icon={BarChart3}
            title="Statistical calibration active"
            description="When exam cohorts complete mock assessments, automated percentile ranking and item-difficulty analysis will populate here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Learner Candidate</th>
                  <th className="py-3 px-4">Examination Title</th>
                  <th className="py-3 px-4">Total Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Item Breakdown</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Completed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">
                        {att.userName || "Student"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {att.userEmail || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {att.testTitle}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {att.categoryName || "Assessment"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-emerald-700 block">
                        {att.marksScored} / {att.maxMarks}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {Math.round(((att.marksScored || 0) / (att.maxMarks || 1)) * 100)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StudioBadge
                        variant={
                          att.accuracyPercentage >= 70
                            ? "success"
                            : att.accuracyPercentage >= 40
                            ? "warning"
                            : "danger"
                        }
                        size="sm"
                      >
                        {att.accuracyPercentage}%
                      </StudioBadge>
                    </td>
                    <td className="py-3 px-4">
                      {att.scorecard ? (
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-emerald-700 font-semibold">
                            {att.scorecard.correctCount} Correct
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-rose-600 font-semibold">
                            {att.scorecard.incorrectCount} Incorrect
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {Math.max(1, Math.round((att.timeTakenSeconds || 0) / 60))} mins
                    </td>
                    <td className="py-3 px-4">
                      <StudioBadge variant="completed" size="sm">
                        Evaluated
                      </StudioBadge>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {att.completedAt
                        ? new Date(att.completedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
