"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Clock,
  CheckCheck,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useAdminStudio } from "@/context/AdminStudioContext";
import { AdminNotification } from "@/types/admin";

export default function AdminNotificationsPage() {
  const {
    notifications,
    unreadNotificationCount,
    markAllNotificationsAsRead,
    toggleNotificationRead,
    dismissNotification,
  } = useAdminStudio();

  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = unreadNotificationCount;

  const markAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  const toggleRead = async (id: string) => {
    await toggleNotificationRead(id);
  };

  const deleteNotification = async (id: string) => {
    await dismissNotification(id);
  };

  const filtered = notifications.filter((n) => (filter === "unread" ? !n.read : true));

  const getTypeIcon = (type: AdminNotification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-rose-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            System notices, publication events, security alerts, and platform operational milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === "all"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            filter === "unread"
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No notifications</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              {filter === "unread" ? "You have caught up with all notifications." : "There are currently no notifications to display."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-4.5 transition-colors flex items-start gap-4 ${
                  !item.read ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-slate-50/70"
                }`}
              >
                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs flex-shrink-0 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className={`text-sm font-semibold ${!item.read ? "text-slate-900 font-bold" : "text-slate-800"}`}>
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleRead(item.id)}
                        title={item.read ? "Mark as unread" : "Mark as read"}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded transition-colors text-xs"
                      >
                        {item.read ? "Mark unread" : "Mark read"}
                      </button>
                      <button
                        onClick={() => deleteNotification(item.id)}
                        title="Dismiss"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {item.link && (
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        <span>View details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
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
