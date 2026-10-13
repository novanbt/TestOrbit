"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Users, Award, CheckCircle, Clock } from "lucide-react";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { getAllCreatorProfiles } from "@/lib/admin/adminDataService";
import { CreatorProfile } from "@/types/admin";

export default function CreatorsAdminPage() {
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCreatorProfiles().then((list) => {
      setCreators(list);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Teacher & Creator Marketplace Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Approved educators, coaching institutions, and assessment authors publishing on TestOrbit.
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading creator profiles...</p>
          </div>
        ) : creators.length === 0 ? (
          <StudioEmptyState
            icon={Sparkles}
            title="Creator Marketplace Ready for Onboarding"
            description="Educators and subject matter experts who submit applications to author tests will appear here for identity and quality review."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Creator / Institution</th>
                  <th className="py-3 px-4">Tests Published</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Earnings</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creators.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4">{c.testsPublishedCount}</td>
                    <td className="py-3 px-4">{c.commissionRate}%</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      ₹{(c.totalEarningsInPaise / 100).toFixed(0)}
                    </td>
                    <td className="py-3 px-4">
                      <StudioBadge variant={c.status === "approved" ? "completed" : "pending"} size="sm">
                        {c.status}
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
