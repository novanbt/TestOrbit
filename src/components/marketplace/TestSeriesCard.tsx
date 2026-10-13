import React from "react";
import Link from "next/link";
import { Layers, ArrowUpRight, Users, CheckCircle2 } from "lucide-react";
import { TestBundle } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatPriceInRupees } from "@/lib/utils";

interface TestSeriesCardProps {
  series: TestBundle;
}

export function TestSeriesCard({ series }: TestSeriesCardProps) {
  // Extract clean subject/topic summary from included tests
  const subjectSummary = React.useMemo(() => {
    if (series.includedItems && series.includedItems.length > 0) {
      const names = series.includedItems
        .map((item) => {
          if (item.testTitle) {
            // Clean common prefixes like "Class X ", "Class XII " to get short subject name
            return item.testTitle
              .replace(/Class\s+(X|XI|XII|10|11|12)\s+/i, "")
              .replace(/—.*$/i, "")
              .replace(/\(.*?\)/g, "")
              .trim();
          }
          return item.sectionHeading || "";
        })
        .filter(Boolean);

      const unique = Array.from(new Set(names)).slice(0, 5);
      return unique.join(" · ");
    }
    return series.targetClassOrExam || series.categoryName;
  }, [series]);

  const savingsInPaise =
    series.originalPriceInPaise && series.originalPriceInPaise > series.priceInPaise
      ? series.originalPriceInPaise - series.priceInPaise
      : 0;

  return (
    <article className="group flex flex-col justify-between p-5 bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition-all duration-200">
      <div>
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="accent" size="sm" className="font-semibold">
            <Layers className="w-3.5 h-3.5 mr-1" />
            {series.includedTestsCount} Tests Included
          </Badge>
          {series.discountPercentage && series.discountPercentage > 0 ? (
            <Badge variant="success" size="sm" className="font-semibold">
              Save {series.discountPercentage}%
            </Badge>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1.5 leading-snug">
          <Link
            href={`/series/${series.slug}`}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            {series.title}
          </Link>
        </h3>

        {/* Derived Included Subjects Line */}
        {subjectSummary && (
          <p className="text-[11px] font-semibold text-indigo-700 mb-2.5 truncate">
            {subjectSummary}
          </p>
        )}

        {/* Target Audience */}
        {series.targetAudience && (
          <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed">{series.targetAudience}</span>
          </div>
        )}

        {/* Short description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {series.shortDescription || series.description}
        </p>
      </div>

      {/* Footer / Pricing & CTA */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block font-normal">Bundle Price</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-slate-900">
              {formatPriceInRupees(series.priceInPaise)}
            </span>
            {series.originalPriceInPaise && series.originalPriceInPaise > series.priceInPaise && (
              <span className="text-xs text-slate-400 line-through">
                {formatPriceInRupees(series.originalPriceInPaise)}
              </span>
            )}
          </div>
          {savingsInPaise > 0 && (
            <span className="text-[10px] text-emerald-700 font-semibold block">
              Save {formatPriceInRupees(savingsInPaise)}
            </span>
          )}
        </div>

        <Link
          href={`/series/${series.slug}`}
          className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 rounded-xl transition-all border border-indigo-100 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          View Bundle
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  );
}
