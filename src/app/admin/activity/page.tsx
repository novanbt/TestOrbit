"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  Clock,
  Shield,
  BookOpen,
  Layers,
  HelpCircle,
  ShoppingCart,
  User,
  Filter,
} from "lucide-react";
import { StudioBadge } from "@/components/admin/StudioUI";
import { AuditLog } from "@/types/admin";

export default function AdminActivityPage() {
  const [activities, setActivities] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/audit-logs");
        if (res.ok) {
          const data = await res.json();
          setActivities(data.logs || []);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case "test":
        return <BookOpen className="w-4 h-4 text-blue-600" />;
      case "series":
        return <Layers className="w-4 h-4 text-indigo-600" />;
      case "question":
        return <HelpCircle className="w-4 h-4 text-emerald-600" />;
      case "order":
        return <ShoppingCart className="w-4 h-4 text-amber-600" />;
      case "user":
        return <User className="w-4 h-4 text-purple-600" />;
      default:
        return <Shield className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Log</h1>
            <StudioBadge variant="info">Live Feed</StudioBadge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time administrative actions, catalog modifications, and security events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/audit-logs"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Shield className="w-3.5 h-3.5" />
            Audit Records
          </Link>
        </div>
      </div>

      {/* Activity Timeline Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Event Stream ({activities.length})</h2>
          </div>
          <span className="text-xs text-slate-500">Auto-synced with Firestore audit collection</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading live activity feed...</div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No activity logged yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Events will automatically appear here as you create tests, approve questions, or process orders.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((act) => (
              <div key={act.id} className="p-4 hover:bg-slate-50/70 transition-colors flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getEntityIcon(act.entityType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">{act.action.replace(/_/g, " ").toUpperCase()}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {act.entityType}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">ID: {act.entityId}</span>
                  </div>

                  <p className="text-sm text-slate-700 mt-1">{act.details}</p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <User className="w-3 h-3 text-slate-400" />
                      {act.actorEmail}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(act.timestamp).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
