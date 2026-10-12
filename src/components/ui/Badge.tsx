import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "accent" | "primary" | "sample";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "default",
  size = "sm",
  children,
  ...props
}: BadgeProps) {
  const baseClasses =
    "inline-flex items-center font-medium rounded-full transition-colors";

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  const variantClasses = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    secondary: "bg-blue-50 text-blue-700 border border-blue-200",
    outline: "border border-slate-300 text-slate-700 bg-transparent",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    accent: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    primary: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    sample: "bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider font-semibold text-[10px]",
  };

  return (
    <span
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
