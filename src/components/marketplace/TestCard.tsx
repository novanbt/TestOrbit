import React from "react";
import Link from "next/link";
import { Clock, HelpCircle, ArrowUpRight } from "lucide-react";
import { MockTest } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatPriceInRupees, formatDuration } from "@/lib/utils";

interface TestCardProps {
  test: MockTest;
}

export function TestCard({ test }: TestCardProps) {
  const getDifficultyVariant = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "success";
      case "advanced":
        return "accent";
      default:
        return "secondary";
    }
  };

  return (
    <article className="group flex flex-col justify-between p-5 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-200">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="default" size="sm" className="truncate max-w-[170px]">
            {test.categoryName}
          </Badge>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {test.language && test.categoryId === "cat-languages" && (
              <Badge variant="accent" size="sm">
                {test.language}
              </Badge>
            )}
            <Badge variant={getDifficultyVariant(test.difficulty)} size="sm">
              {test.difficulty}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-snug">
          <Link href={`/tests/${test.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
            {test.title}
          </Link>
        </h3>

        {/* Short Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
          {test.description}
        </p>

        {/* Tags Row */}
        {test.tags && test.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {test.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-indigo-50/70 text-indigo-700 border border-indigo-100/60"
              >
                #{tag}
              </span>
            ))}
            {test.tags.length > 3 && (
              <span className="text-[10px] text-slate-400">+{test.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Test Metrics Row */}
        <div className="flex items-center gap-4 py-2.5 px-3 bg-slate-50 rounded-lg text-xs text-slate-600 mb-4 border border-slate-100">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>{test.questionCount} Questions</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatDuration(test.durationMinutes)}</span>
          </div>
          {test.maxMarks ? (
            <>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="hidden sm:inline text-slate-500">{test.maxMarks} Marks</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Footer / Price & Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block font-normal">Pricing</span>
          <span className="text-base font-bold text-slate-900">
            {formatPriceInRupees(test.priceInPaise)}
          </span>
        </div>

        <Link
          href={`/tests/${test.slug}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          View Details
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  );
}
