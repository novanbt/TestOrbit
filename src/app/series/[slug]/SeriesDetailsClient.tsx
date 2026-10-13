"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Share2,
  Check,
  Info,
} from "lucide-react";
import { TestSeries } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { formatPriceInRupees } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface SeriesDetailsClientProps {
  series: TestSeries;
}

export default function SeriesDetailsClient({ series }: SeriesDetailsClientProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <Breadcrumbs
        items={[
          { label: "Explore Tests", href: "/explore" },
          { label: "Test Series", href: "/explore?type=series" },
          { label: series.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="accent" size="sm">
                <Layers className="w-3 h-3 mr-1" />
                {series.includedTestsCount} Complete Tests Included
              </Badge>
              {series.discountPercentage && (
                <Badge variant="success" size="sm">
                  {series.discountPercentage}% Bundle Savings
                </Badge>
              )}
              <Badge variant="primary" size="sm">
                Comprehensive Syllabus
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
              {series.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {series.description}
            </p>

            {/* Tags Box */}
            {series.tags && series.tags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-slate-500 mr-1">Tags:</span>
                {series.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?q=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : series.targetAudience ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2 mb-4">
                <Users className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    Who This Series Is For:
                  </span>
                  <span>{series.targetAudience}</span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Bundle Benefits */}
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-3">
              What’s Included in This Bundle
            </h2>
            <div className="space-y-3">
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2.5">
                {[
                  `${series.includedTestsCount} full-length examination simulations calibrated to official difficulty`,
                  "Progressive syllabus coverage: Part-syllabus checkpoints followed by full-course mocks",
                  "Comprehensive video or step-by-step mathematical & conceptual solutions",
                  "Cross-test percentile rankings and weakness diagnostics",
                  "Offline printable answer sheets and question booklets for paper rehearsal",
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Package Overview Guidelines */}
          <section className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-indigo-900">
                  Comprehensive Test Series Bundle
                </h3>
                <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                  This multi-test package is organized into progressive difficulty stages with full syllabus coverage. Review the included mock tests below to plan your study schedule.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Sticky Pricing Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-5">
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                Complete Bundle Access
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatPriceInRupees(series.priceInPaise)}
                </span>
                {series.originalPriceInPaise && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatPriceInRupees(series.originalPriceInPaise)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Single purchase unlocks all {series.includedTestsCount} included tests.
              </p>
            </div>

            {/* Purchase / Get Access */}
            <div className="space-y-2">
              {user ? (
                <Link href={`/explore?category=${series.categoryId || ""}`} className="block">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full font-semibold"
                  >
                    Browse Included Tests
                  </Button>
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={`/signup?redirect=${encodeURIComponent(`/series/${series.slug}`)}`}
                    className="block"
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full font-semibold"
                    >
                      Sign Up to Enroll
                    </Button>
                  </Link>
                  <p className="text-[11px] text-center text-slate-500">
                    Already registered?{" "}
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/series/${series.slug}`)}`}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              )}
              <p className="text-[10px] text-center text-slate-400">
                Instant Digital Access • All {series.includedTestsCount} Tests Included
              </p>
            </div>

            {/* Details */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Total Tests</span>
                <span className="font-semibold text-slate-900">{series.includedTestsCount} Mocks</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Access Duration</span>
                <span className="font-semibold text-slate-900">Full Academic Cycle</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Doubt Clearance</span>
                <span className="font-semibold text-slate-900">Included</span>
              </div>
            </div>

            {/* Share */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
              <button
                onClick={handleShare}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share series details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
