"use client";

import React from "react";
import Link from "next/link";
import { Clock, Calendar, PlusCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioEmptyState } from "@/components/admin/StudioUI";

export default function ScheduledPublishingPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Scheduled Publishing Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Timed automated release calendars for competitive exam simulations.
          </p>
        </div>

        <Link href="/admin/tests/create">
          <Button variant="primary" size="sm" className="text-xs">
            Schedule a Test
          </Button>
        </Link>
      </div>

      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <StudioEmptyState
          icon={Clock}
          title="No timed releases currently in schedule queue"
          description="Tests scheduled for future release dates will automatically appear on the storefront when their timer matures."
          action={
            <Link href="/admin/tests">
              <Button variant="outline" size="sm" className="text-xs">
                Inspect All Tests
              </Button>
            </Link>
          }
        />
      </div>
    </div>
  );
}
