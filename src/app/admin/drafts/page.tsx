"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Edit2, CheckCircle, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { saveMockTestAction } from "@/app/actions/adminStudioActions";
import { MockTest } from "@/types";

export default function DraftsAdminPage() {
  const [drafts, setDrafts] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const all = await fetchCanonicalTests();
      setDrafts(all.filter((t) => !t.published));
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handlePublish = async (test: MockTest) => {
    const updated = { ...test, published: true, updatedAt: new Date().toISOString() };
    const res = await saveMockTestAction(updated);
    if (res.success) {
      setDrafts((prev) => prev.filter((d) => d.id !== test.id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Draft Content ({drafts.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Assessments staged as drafts and hidden from the public marketplace.
          </p>
        </div>

        <Link href="/admin/tests/create">
          <Button variant="primary" size="sm" className="text-xs">
            Create New Test
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading drafts...</p>
        </div>
      ) : drafts.length === 0 ? (
        <StudioEmptyState
          icon={FileText}
          title="No draft tests currently pending"
          description="All created mock tests are published live to the student storefront."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {drafts.map((test) => (
            <div
              key={test.id}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <StudioBadge variant="draft" size="sm">
                  Draft Stage
                </StudioBadge>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {test.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {test.description}
                </p>
                <div className="text-xs text-slate-400">
                  {test.questionCount} Questions • {test.durationMinutes} mins
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/admin/tests/${test.slug}/edit`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Edit2 className="w-3 h-3 mr-1" />
                    <span>Edit</span>
                  </Button>
                </Link>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handlePublish(test)}
                  className="h-7 text-xs"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>Publish Live</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
