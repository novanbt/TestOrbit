import React from "react";
import { cn } from "@/lib/utils";

/**
 * Reusable Studio Status Badge with YouTube Studio typography and soft fills
 */
export function StudioBadge({
  variant = "neutral",
  size = "md",
  className,
  children,
}: {
  variant?:
    | "published"
    | "draft"
    | "archived"
    | "scheduled"
    | "free"
    | "paid"
    | "completed"
    | "refunded"
    | "pending"
    | "neutral"
    | "info"
    | "success"
    | "warning"
    | "danger";
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  const variantStyles = {
    published: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    draft: "bg-amber-50 text-amber-700 border-amber-200/80",
    archived: "bg-slate-100 text-slate-600 border-slate-200",
    scheduled: "bg-blue-50 text-blue-700 border-blue-200/80",
    free: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    paid: "bg-purple-50 text-purple-700 border-purple-200/80",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    refunded: "bg-rose-50 text-rose-700 border-rose-200/80",
    pending: "bg-amber-50 text-amber-700 border-amber-200/80",
    neutral: "bg-slate-100 text-slate-700 border-slate-200/80",
    info: "bg-sky-50 text-sky-700 border-sky-200/80",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold border rounded-full uppercase tracking-wider",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Studio Empty State Box with clean icon, title, copy, and call to action
 */
export function StudioEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-2xl max-w-lg mx-auto my-6">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Studio Metric KPI Card
 */
export function StudioMetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "indigo",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: "indigo" | "emerald" | "amber" | "blue" | "purple";
}) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs transition-shadow hover:shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn("w-8 h-8 rounded-xl border flex items-center justify-center", colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-slate-400 leading-tight">{subtitle}</p>}
    </div>
  );
}
