"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Archive, RotateCcw, BookOpen, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioEmptyState } from "@/components/admin/StudioUI";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { saveMockTestAction } from "@/app/actions/adminStudioActions";
import { MockTest } from "@/types";

export default function ArchivedContentPage() {
  const [archivedTests, setArchivedTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Archived Content Records
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived curriculum materials and legacy examination sets preserved for historical audit.
          </p>
        </div>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <StudioEmptyState
          icon={Archive}
          title="No archived tests or series"
          description="Content that you archive from the active catalogue will be preserved here and can be restored at any time."
          action={
            <Link href="/admin/tests">
              <Button variant="outline" size="sm" className="text-xs">
                Back to Mock Tests
              </Button>
            </Link>
          }
        />
      </div>
    </div>
  );
}
