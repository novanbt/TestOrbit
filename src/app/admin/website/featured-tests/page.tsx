"use client";

import React, { useState, useEffect } from "react";
import { Star, CheckCircle, Save, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { saveMockTestAction } from "@/app/actions/adminStudioActions";
import { MockTest } from "@/types";

export default function FeaturedTestsCMSPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCanonicalTests().then((all) => {
      setTests(all);
      setLoading(false);
    });
  }, []);

  const handleToggleFeatured = async (test: MockTest) => {
    setSavingId(test.id);
    const updated = { ...test, isFeatured: !test.isFeatured, updatedAt: new Date().toISOString() };
    const res = await saveMockTestAction(updated);
    if (res.success) {
      setTests((prev) => prev.map((t) => (t.id === test.id ? updated : t)));
    }
    setSavingId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Featured Mock Tests Shelf
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Curate which assessments are highlighted in the prominent &ldquo;Featured Assessments&rdquo; grid on the homepage.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading tests...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Test Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Featured Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{test.title}</td>
                    <td className="py-3 px-4">{test.categoryName}</td>
                    <td className="py-3 px-4">{test.questionCount} Questions</td>
                    <td className="py-3 px-4">
                      {test.isFeatured ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500" /> Featured
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={test.isFeatured ? "outline" : "primary"}
                        size="sm"
                        disabled={savingId === test.id}
                        onClick={() => handleToggleFeatured(test)}
                        className="h-7 text-xs"
                      >
                        {test.isFeatured ? "Remove" : "Feature on Home"}
                      </Button>
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
