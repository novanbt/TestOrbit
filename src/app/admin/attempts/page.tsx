"use client";

import React, { useState, useEffect } from "react";
import { Award, Clock, Search, BookOpen, User, CheckCircle, Eye, X, BarChart3 } from "lucide-react";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { StoredAttempt } from "@/lib/firebase/firestoreService";
import { getAdminTestAttemptsAction } from "@/app/actions/adminStudioActions";

export default function AttemptsAdminPage() {
  const [attempts, setAttempts] = useState<StoredAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttempt, setSelectedAttempt] = useState<StoredAttempt | null>(null);

  useEffect(() => {
    async function loadAttempts() {
      try {
        const res = await getAdminTestAttemptsAction();
        if (res.success && res.data) {
          setAttempts(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch admin attempts:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAttempts();
  }, []);

  const filtered = attempts.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.testTitle?.toLowerCase().includes(q) ||
      a.testSlug?.toLowerCase().includes(q) ||
      a.userName?.toLowerCase().includes(q) ||
      a.userEmail?.toLowerCase().includes(q) ||
      a.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            CBT Examination Attempts ({attempts.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Student exam submissions, timing benchmarks, scorecards, and objective evaluation logs.
          </p>
        </div>
      </div>

      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by learner, email, test title, or attempt ID..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading student attempt records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <StudioEmptyState
            icon={Award}
            title="No student test attempts recorded yet"
            description="When students complete simulated CBT tests, submissions with full answer snapshots and marks will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Learner Student</th>
                  <th className="py-3 px-4">Assessment Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-[11px] text-indigo-700 uppercase">
                          {(att.userName || att.userEmail || "S")[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {att.userName || "Student"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {att.userEmail || att.userId || "—"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {att.testTitle}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {att.id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-700">
                          {att.marksScored} / {att.maxMarks}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({Math.round(((att.marksScored || 0) / (att.maxMarks || 1)) * 100)}%)
                        </span>
                      </div>
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
                    <td className="py-3 px-4 text-slate-500">
                      {Math.max(1, Math.round((att.timeTakenSeconds || 0) / 60))} mins
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {att.completedAt
                        ? new Date(att.completedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedAttempt(att)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Scorecard Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Attempt Summary • {selectedAttempt.id}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {selectedAttempt.userName} ({selectedAttempt.userEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-bold text-slate-900 block text-sm">
                  {selectedAttempt.testTitle}
                </span>
                <span className="text-[11px] text-slate-500">
                  Submitted: {new Date(selectedAttempt.completedAt).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] text-emerald-700 font-semibold uppercase block">Score Earned</span>
                  <span className="text-base font-extrabold text-emerald-800">
                    {selectedAttempt.marksScored} / {selectedAttempt.maxMarks}
                  </span>
                </div>
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase block">Accuracy</span>
                  <span className="text-base font-extrabold text-indigo-800">
                    {selectedAttempt.accuracyPercentage}%
                  </span>
                </div>
                <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-600 font-semibold uppercase block">Time Consumed</span>
                  <span className="text-base font-extrabold text-slate-800">
                    {Math.max(1, Math.round(selectedAttempt.timeTakenSeconds / 60))}m
                  </span>
                </div>
              </div>

              {selectedAttempt.scorecard && (
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-slate-700 text-xs block uppercase tracking-wider">
                    Detailed Breakdown
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 border border-slate-100 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-slate-400 block">Correct</span>
                      <span className="font-bold text-emerald-600">
                        {selectedAttempt.scorecard.correctCount}
                      </span>
                    </div>
                    <div className="p-2 border border-slate-100 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-slate-400 block">Incorrect</span>
                      <span className="font-bold text-rose-600">
                        {selectedAttempt.scorecard.incorrectCount}
                      </span>
                    </div>
                    <div className="p-2 border border-slate-100 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-slate-400 block">Unattempted</span>
                      <span className="font-bold text-slate-600">
                        {selectedAttempt.scorecard.unattemptedCount}
                      </span>
                    </div>
                  </div>

                  {selectedAttempt.scorecard.topicScores && Object.keys(selectedAttempt.scorecard.topicScores).length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-600 block">Topic-wise Performance</span>
                      <div className="space-y-1">
                        {Object.entries(selectedAttempt.scorecard.topicScores).map(([topic, stats]) => (
                          <div
                            key={topic}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100 text-[11px]"
                          >
                            <span className="font-medium text-slate-700">{topic}</span>
                            <span className="font-mono text-slate-600">
                              {stats.correct} / {stats.total} (
                              {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
