"use client";

import React, { useState, useEffect } from "react";
import { LineChart, BookOpen, Search } from "lucide-react";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { MockTest } from "@/types";

export default function TestPerformanceAnalyticsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCanonicalTests().then((all) => {
      setTests(all);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Individual Test Performance
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Detailed completion rates, accuracy distributions, and question statistics.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Passing Benchmark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-slate-900">{t.title}</td>
                  <td className="py-3 px-4">{t.categoryName}</td>
                  <td className="py-3 px-4">{t.questionCount} Questions</td>
                  <td className="py-3 px-4">{t.durationMinutes} mins</td>
                  <td className="py-3 px-4 font-semibold text-emerald-700">75% Accuracy Target</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
