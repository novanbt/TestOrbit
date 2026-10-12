import React from "react";
import { SearchX, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
}

export function EmptyState({
  title = "No mock tests match your criteria",
  description = "Try adjusting your search keywords, clearing selected difficulty or category filters.",
  onResetFilters,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-xl border border-slate-200">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
        <SearchX className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {onResetFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}
