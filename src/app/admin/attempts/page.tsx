"use client";

import React, { useState, useEffect } from "react";
import { Award, Clock, Search, BookOpen, User, CheckCircle } from "lucide-react";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { collectionGroup, getDocs, limit, query } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { StoredAttempt } from "@/lib/firebase/firestoreService";

export default function AttemptsAdminPage() {
  const [attempts, setAttempts] = useState<StoredAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadAttempts() {
      const list: StoredAttempt[] = [];
      if (isFirebaseConfigured && db) {
        try {
          const q = query(collectionGroup(db, "attempts"), limit(50));
          const snap = await getDocs(q);
          snap.forEach((d) => {
            list.push(d.data() as StoredAttempt);
          });
        } catch {
          // Fallback if collectionGroup requires index or empty
        }
      }
      setAttempts(list);
      setLoading(false);
    }
    loadAttempts();
  }, []);

  const filtered = attempts.filter((a) =>
    a.testTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.testSlug?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          CBT Examination Attempts ({attempts.length})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Student exam submissions, timing benchmarks, scorecards, and objective evaluation logs.
        </p>
      </div>

      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by test title..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading attempt records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <StudioEmptyState
            icon={Award}
            title="No student test attempts recorded yet"
            description="When students complete simulated CBT tests, submissions with full answer snapshots will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Attempt ID</th>
                  <th className="py-3 px-4">Assessment Title</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">Time Spent</th>
                  <th className="py-3 px-4">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{att.id}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{att.testTitle}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {att.marksScored} / {att.maxMarks}
                    </td>
                    <td className="py-3 px-4 font-semibold">{att.accuracyPercentage}%</td>
                    <td className="py-3 px-4 text-slate-500">
                      {Math.round(att.timeTakenSeconds / 60)} mins
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(att.completedAt).toLocaleString()}
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
