import React from "react";
import Link from "next/link";
import { Layers, ArrowUpRight, Users } from "lucide-react";
import { TestSeries } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatPriceInRupees } from "@/lib/utils";

interface TestSeriesCardProps {
  series: TestSeries;
}

export function TestSeriesCard({ series }: TestSeriesCardProps) {
  return (
    <article className="group flex flex-col justify-between p-5 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-200">
      <div>
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge variant="accent" size="sm" className="font-semibold">
            <Layers className="w-3 h-3 mr-1" />
            {series.includedTestsCount} Mocks Bundle
          </Badge>
          <div className="flex items-center gap-1">
            {series.discountPercentage && (
              <Badge variant="success" size="sm">
                Save {series.discountPercentage}%
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2 leading-snug">
          <Link href={`/series/${series.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded">
            {series.title}
          </Link>
        </h3>

        {/* Target Audience */}
        <div className="flex items-start gap-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{series.targetAudience}</span>
        </div>

        {/* Short description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {series.description}
        </p>
      </div>

      {/* Footer / Pricing & CTA */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-400 block font-normal">Bundle Price</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-slate-900">
              {formatPriceInRupees(series.priceInPaise)}
            </span>
            {series.originalPriceInPaise && (
              <span className="text-xs text-slate-400 line-through">
                {formatPriceInRupees(series.originalPriceInPaise)}
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/series/${series.slug}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          View Series
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </article>
  );
}
