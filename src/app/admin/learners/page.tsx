"use client";

import React, { useState, useEffect } from "react";
import { Users, Search } from "lucide-react";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { collection, getDocs } from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { getLearnersAction, LearnerRecord } from "@/app/actions/adminStudioActions";

export default function LearnersAdminPage() {
  const [learners, setLearners] = useState<LearnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadLearners() {
      try {
        const res = await getLearnersAction();
        if (res.success && res.data) {
          setLearners(res.data);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Failed to load learners via action, fallback to client:", e);
      }

      const list: LearnerRecord[] = [];
      if (isFirebaseConfigured && db) {
        try {
          const snap = await getDocs(collection(db, "users"));
          snap.forEach((d) => {
            const data = d.data();
            if (
              data.email !== "testorbit@ellipse.com" &&
              data.role !== "admin" &&
              (data.email || data.name)
            ) {
              list.push({
                id: d.id,
                name: data.name || data.displayName || data.email?.split("@")[0] || "Learner",
                email: data.email || "",
                createdAt: data.createdAt || new Date().toISOString(),
                targetExam: data.targetExam || "JEE Main & Advanced 2026",
                totalAttempts: data.totalAttempts || 0,
                avgAccuracy: data.avgAccuracy || 0,
              });
            }
          });
        } catch {}
      }
      setLearners(list);
      setLoading(false);
    }
    loadLearners();
  }, []);

  const filtered = learners.filter((l) =>
    l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.targetExam?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Learner Accounts & Directory ({learners.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered student profiles, exam goals, and attempt activity.
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
            placeholder="Search learner name, email, target exam..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading student directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <StudioEmptyState
            icon={Users}
            title="No learner accounts found"
            description="When students register and take tests on TestOrbit, their profile data and progress appears here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Learner Profile</th>
                  <th className="py-3 px-4">Target Examination Goal</th>
                  <th className="py-3 px-4">Tests Attempted</th>
                  <th className="py-3 px-4">Average Accuracy</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{l.name}</span>
                      <span className="text-[11px] text-slate-400">{l.email}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {l.targetExam}
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-700">
                      {l.totalAttempts || 0}
                    </td>
                    <td className="py-3 px-4">
                      {l.avgAccuracy ? `${l.avgAccuracy}%` : "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <StudioBadge variant="completed" size="sm">
                        Active
                      </StudioBadge>
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
