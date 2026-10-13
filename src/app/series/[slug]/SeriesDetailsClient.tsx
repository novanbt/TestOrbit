"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Clock,
  BookOpen,
  Award,
  Lock,
  Unlock,
  PlayCircle,
  ExternalLink,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { TestBundle, MockTest, BundleIncludedTestItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { formatPriceInRupees, formatDuration } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { resolveBundleTests } from "@/lib/data/bundleService";
import {
  isUserEntitledToBundle,
  enrollUserInBundle,
} from "@/lib/data/entitlementService";
import { enrollInBundleServerAction } from "@/app/actions/bundleActions";
import { getUserDashboardData, StoredAttempt } from "@/lib/firebase/firestoreService";

interface SeriesDetailsClientProps {
  series: TestBundle;
}

export default function SeriesDetailsClient({ series }: SeriesDetailsClientProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollSuccessMessage, setEnrollSuccessMessage] = useState<string | null>(null);
  const [userAttempts, setUserAttempts] = useState<StoredAttempt[]>([]);
  const testsSectionRef = useRef<HTMLDivElement>(null);

  // 1. Resolve all mock tests in bundle order
  const { tests: resolvedTests, missingSlugs, combinedReferencePriceInPaise } = useMemo(() => {
    return resolveBundleTests(series);
  }, [series]);

  // 2. Check user's enrollment status & load attempts
  useEffect(() => {
    if (!user?.id) {
      setIsEnrolled(false);
      return;
    }

    let isMounted = true;
    isUserEntitledToBundle(user.id, series.id).then((enrolled) => {
      if (isMounted) setIsEnrolled(enrolled);
    });

    getUserDashboardData(user.id).then((data) => {
      if (isMounted && data.recentAttempts) {
        setUserAttempts(data.recentAttempts);
      }
    });

    const handleUpdate = () => {
      if (!user?.id) return;
      isUserEntitledToBundle(user.id, series.id).then((enrolled) => {
        if (isMounted) setIsEnrolled(enrolled);
      });
    };
    window.addEventListener("testorbit_entitlements_updated", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("testorbit_entitlements_updated", handleUpdate);
    };
  }, [user?.id, series.id]);

  // 3. Group tests by section heading
  const groupedSections = useMemo(() => {
    const groups: { heading: string; items: (MockTest & { bundleItem: BundleIncludedTestItem })[] }[] = [];
    const map = new Map<string, (MockTest & { bundleItem: BundleIncludedTestItem })[]>();

    for (const test of resolvedTests) {
      const heading = test.bundleItem?.sectionHeading || "Included Mock Assessments";
      if (!map.has(heading)) {
        map.set(heading, []);
      }
      map.get(heading)!.push(test);
    }

    map.forEach((items, heading) => {
      groups.push({ heading, items });
    });

    return groups;
  }, [resolvedTests]);

  // Share action
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Single-purchase bundle enrollment
  const handleEnrollNow = async () => {
    if (!user) {
      // Handled by links to login/signup
      return;
    }
    setIsEnrolling(true);
    setEnrollSuccessMessage(null);

    // Call server action + client storage
    const result = await enrollInBundleServerAction(user.id, series.id);
    await enrollUserInBundle(user.id, series);
    setIsEnrolling(false);

    if (result.success) {
      setIsEnrolled(true);
      setEnrollSuccessMessage(
        `Access Unlocked! All ${resolvedTests.length} tests in this bundle are now ready to attempt.`
      );
      setTimeout(() => {
        setEnrollSuccessMessage(null);
      }, 5000);
      testsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const effectiveReferencePrice =
    series.originalPriceInPaise && series.originalPriceInPaise > 0
      ? series.originalPriceInPaise
      : combinedReferencePriceInPaise;

  const actualSavings =
    effectiveReferencePrice > series.priceInPaise
      ? effectiveReferencePrice - series.priceInPaise
      : 0;

  const discountPercent =
    series.discountPercentage && series.discountPercentage > 0
      ? series.discountPercentage
      : effectiveReferencePrice > 0 && actualSavings > 0
      ? Math.round((actualSavings / effectiveReferencePrice) * 100)
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Curated Test Series", href: "/series" },
          { label: series.title },
        ]}
      />

      {enrollSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{enrollSuccessMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Bundle Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent" size="sm" className="font-semibold">
                <Layers className="w-3.5 h-3.5 mr-1" />
                {series.includedTestsCount} Complete Tests Included
              </Badge>
              {discountPercent > 0 && (
                <Badge variant="success" size="sm" className="font-semibold">
                  {discountPercent}% Bundle Savings
                </Badge>
              )}
              {series.targetClassOrExam && (
                <Badge variant="primary" size="sm">
                  {series.targetClassOrExam}
                </Badge>
              )}
              {isEnrolled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Check className="w-3 h-3" />
                  Purchased & Active
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {series.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {series.description}
            </p>

            {/* Target Audience / Exam Notice */}
            {series.targetAudience && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    Target Audience:
                  </span>
                  <span>{series.targetAudience}</span>
                </div>
              </div>
            )}

            {/* Tags Box */}
            {series.tags && series.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-400">Curriculum Tags:</span>
                {series.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Missing Tests Warning */}
          {missingSlugs.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Notice for Learners & Faculty:</span>
                <span>
                  {missingSlugs.length} test(s) in this bundle are undergoing syllabus calibration and will be unlocked automatically upon completion.
                </span>
              </div>
            </div>
          )}

          {/* Core Feature Checklist */}
          <section className="p-5 bg-white border border-slate-200 rounded-2xl space-y-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Single-Purchase Bundle Advantages
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Full Syllabus Coverage:</strong> {series.includedTestsCount} authentic mock papers designed to official examination blueprints.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Single Checkout:</strong> One purchase unlocks all tests. No separate transaction per paper.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant Solutions:</strong> Comprehensive answer keys with step-by-step mathematical & conceptual logic.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Lifetime Analytics:</strong> Accuracy percentages, topic mastery diagnostics, and score benchmarking.
                </span>
              </div>
            </div>
          </section>

          {/* ================= REAL INCLUDED TESTS SECTION ================= */}
          <section ref={testsSectionRef} className="space-y-6 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  Tests Included in This Bundle ({resolvedTests.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every test below is a real full-length assessment included in this package.
                </p>
              </div>

              {isEnrolled && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Full Access Unlocked
                </span>
              )}
            </div>

            {groupedSections.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <span>{group.heading}</span>
                  <span className="h-px bg-slate-200 flex-1" />
                </h3>

                <div className="space-y-3">
                  {group.items.map((test, tIdx) => {
                    const previousAttempt = userAttempts.find(
                      (att) => att.testSlug === test.slug || att.testId === test.id
                    );

                    return (
                      <div
                        key={test.id || tIdx}
                        className={`p-4 sm:p-5 bg-white border rounded-2xl transition-all ${
                          isEnrolled
                            ? "border-indigo-100 hover:border-indigo-300 shadow-2xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                                {test.bundleItem.displayOrder}
                              </span>
                              <Badge variant="default" size="sm">
                                {test.categoryName}
                              </Badge>
                              <Badge variant="secondary" size="sm">
                                {test.difficulty}
                              </Badge>
                              {previousAttempt && (
                                <Badge variant="success" size="sm">
                                  Attempted • {previousAttempt.marksScored}/{previousAttempt.maxMarks} ({previousAttempt.accuracyPercentage}%)
                                </Badge>
                              )}
                            </div>

                            <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                              {test.title}
                            </h4>

                            <p className="text-xs text-slate-500 line-clamp-2">
                              {test.description}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                              <span>
                                <strong>{test.questionCount}</strong> Questions
                              </span>
                              <span>•</span>
                              <span>
                                <strong>{formatDuration(test.durationMinutes)}</strong>
                              </span>
                              <span>•</span>
                              <span>
                                <strong>{test.maxMarks}</strong> Marks
                              </span>
                              {!isEnrolled && test.priceInPaise > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-400">
                                    Individual: {formatPriceInRupees(test.priceInPaise)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {isEnrolled ? (
                              <Link href={`/tests/${test.slug}/take`}>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="gap-1.5 text-xs font-semibold shadow-xs"
                                >
                                  {previousAttempt ? (
                                    <>
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Retake Test
                                    </>
                                  ) : (
                                    <>
                                      <PlayCircle className="w-3.5 h-3.5" />
                                      Start Test
                                    </>
                                  )}
                                </Button>
                              </Link>
                            ) : (
                              <Link href={`/tests/${test.slug}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 text-xs"
                                >
                                  <span>View Details</span>
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Topics Pill List */}
                        {test.topics && test.topics.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                            <span className="text-slate-400 font-medium">Syllabus:</span>
                            {test.topics.slice(0, 4).map((top, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/60"
                              >
                                {top}
                              </span>
                            ))}
                            {test.topics.length > 4 && (
                              <span className="text-slate-400">
                                +{test.topics.length - 4} more topics
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </div>

        {/* Right Sticky Purchase & Pricing Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Complete Bundle Access
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                  {formatPriceInRupees(series.priceInPaise)}
                </span>
                {effectiveReferencePrice > series.priceInPaise && (
                  <span className="text-base text-slate-400 line-through">
                    {formatPriceInRupees(effectiveReferencePrice)}
                  </span>
                )}
              </div>
              {actualSavings > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <span>Save {formatPriceInRupees(actualSavings)}</span>
                  <span>({discountPercent}% OFF)</span>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Single payment unlocks all {resolvedTests.length} tests immediately.
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-3">
              {isEnrolled ? (
                <div className="space-y-2.5">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-xs font-bold text-emerald-800 block">
                      ✓ You own this test bundle
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Access all {resolvedTests.length} tests anytime from your dashboard.
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => testsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="w-full font-bold shadow-xs gap-1.5"
                  >
                    <span>Open My Bundle Tests</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  <Link href="/dashboard" className="block">
                    <Button variant="outline" size="md" className="w-full text-xs">
                      Go to Learner Dashboard
                    </Button>
                  </Link>
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={isEnrolling}
                    onClick={handleEnrollNow}
                    className="w-full font-bold shadow-xs text-sm sm:text-base py-3"
                  >
                    {isEnrolling ? (
                      "Unlocking Full Access..."
                    ) : (
                      `Buy Bundle (${formatPriceInRupees(series.priceInPaise)})`
                    )}
                  </Button>
                  <p className="text-[11px] text-center text-slate-400">
                    One-time payment • All {resolvedTests.length} tests included
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Link
                    href={`/signup?redirect=${encodeURIComponent(`/series/${series.slug}`)}`}
                    className="block"
                  >
                    <Button variant="primary" size="lg" className="w-full font-bold shadow-xs">
                      Sign Up to Buy Bundle
                    </Button>
                  </Link>
                  <p className="text-xs text-center text-slate-500">
                    Already registered?{" "}
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/series/${series.slug}`)}`}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Sign In here
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Bundle Specifications Table */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Included Mock Tests</span>
                <span className="font-bold text-slate-900">{resolvedTests.length} Papers</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Access Duration</span>
                <span className="font-bold text-slate-900">
                  {series.accessDurationDays ? `${series.accessDurationDays} Days` : "365 Days"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Attempt Policy</span>
                <span className="font-bold text-slate-900">
                  {series.attemptLimit && series.attemptLimit > 0
                    ? `${series.attemptLimit} Attempts Per Test`
                    : "Unlimited Practice"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Detailed Solutions</span>
                <span className="font-bold text-slate-900">Included with Marking Keys</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Digital Delivery</span>
                <span className="font-bold text-emerald-700">Instant Unlocked Access</span>
              </div>
            </div>

            {/* Share action */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
              <button
                onClick={handleShare}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Link copied to clipboard!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share bundle details</span>
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
