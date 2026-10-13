"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  HelpCircle,
  Award,
  Globe,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Share2,
  Check,
  Info,
} from "lucide-react";
import { MockTest } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { EnrollmentModal } from "@/components/ui/EnrollmentModal";
import { formatPriceInRupees, formatDuration } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface TestDetailsClientProps {
  test?: MockTest;
  initialTest?: MockTest;
}

export default function TestDetailsClient({ test: propTest, initialTest }: TestDetailsClientProps) {
  const { user } = useAuth();
  const baseTest = propTest || initialTest!;
  const [test, setTest] = useState<MockTest>(baseTest);
  const [modalOpen, setModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (propTest || initialTest) {
      setTest(propTest || initialTest!);
    }

    const targetSlug = baseTest.slug;

    // 1. Instant zero-latency hydration from local adminStore
    import("@/lib/admin/adminStore").then(({ getAdminTestBySlug }) => {
      const local = getAdminTestBySlug(targetSlug);
      if (local) {
        setTest(local);
      }
    });

    // 2. Fetch fresh canonical test directly from Firestore
    import("@/lib/data/testService").then(({ fetchCanonicalTestBySlug }) => {
      fetchCanonicalTestBySlug(targetSlug).then((fresh) => {
        if (fresh) {
          setTest(fresh);
        }
      });
    });

    // 3. Listen for live updates dispatched when admin saves or toggles tests
    const handleUpdate = () => {
      import("@/lib/admin/adminStore").then(({ getAdminTestBySlug }) => {
        const local = getAdminTestBySlug(targetSlug);
        if (local) {
          setTest(local);
        }
      });
      import("@/lib/data/testService").then(({ fetchCanonicalTestBySlug }) => {
        fetchCanonicalTestBySlug(targetSlug).then((fresh) => {
          if (fresh) {
            setTest(fresh);
          }
        });
      });
    };

    window.addEventListener("testorbit_admin_data_updated", handleUpdate);
    return () => window.removeEventListener("testorbit_admin_data_updated", handleUpdate);
  }, [baseTest.slug, propTest, initialTest]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Explore Tests", href: "/explore" },
          { label: test.categoryName, href: `/explore?category=${test.categoryId}` },
          { label: test.title },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Left / Main Details Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="default" size="sm">
                {test.categoryName}
              </Badge>
              <Badge variant="secondary" size="sm">
                {test.difficulty}
              </Badge>
              <Badge variant="primary" size="sm">
                Official Pattern
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
              {test.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              {test.description}
            </p>

            {/* Tags / Search Discovery Badges */}
            {test.tags && test.tags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs font-semibold text-slate-500 mr-1">Tags:</span>
                {test.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?q=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : test.targetAudience ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-start gap-2 mb-4">
                <span className="font-semibold text-slate-900 flex-shrink-0">
                  Target Audience:
                </span>
                <span>{test.targetAudience}</span>
              </div>
            ) : null}
          </div>

          {/* Key Specifications Grid */}
          <div>
            <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-500 mb-3">
              Test Specifications
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs text-slate-500">Questions</span>
                </div>
                <div className="text-base font-bold text-slate-900">
                  {test.questionCount} Items
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs text-slate-500">Duration</span>
                </div>
                <div className="text-base font-bold text-slate-900">
                  {formatDuration(test.durationMinutes)}
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs text-slate-500">Max Marks</span>
                </div>
                <div className="text-base font-bold text-slate-900">
                  {test.maxMarks} Marks
                </div>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs text-slate-500">Language</span>
                </div>
                <div className="text-base font-bold text-slate-900">
                  {test.language}
                </div>
              </div>
            </div>
          </div>

          {/* Topics Covered */}
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Syllabus & Topics Covered
            </h2>
            <div className="p-4 bg-white border border-slate-200 rounded-xl">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                {test.topics.map((topic, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* What the Learner Can Expect */}
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-3">
              What You Can Expect
            </h2>
            <div className="space-y-2.5">
              {test.expectations.map((exp, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg text-xs text-slate-700"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{exp}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Examination Guidelines */}
          <section className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-indigo-700 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-semibold text-indigo-900">
                  Examination Preparation Guidelines
                </h3>
                <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                  This mock assessment follows standard examination marking schemes and sectional timing. Review the syllabus coverage and question blueprint above to benchmark your exam readiness.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right / Pricing & Purchase Card (Sticky on desktop) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-5">
            <div>
              <span className="text-xs text-slate-400 font-medium block">
                Standard Enrolment
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatPriceInRupees(test.priceInPaise)}
                </span>
                {test.isFree && (
                  <Badge variant="success" size="sm">
                    Free Trial Mock
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Inclusive of all question papers & detailed solutions.
              </p>
            </div>

            {/* Purchase / Start Test CTA */}
            <div className="space-y-2.5">
              {user ? (
                <Link href={`/tests/${test.slug}/take`} className="block">
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full h-11 px-3 text-xs sm:text-sm font-semibold gap-2 whitespace-nowrap shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <BookOpen className="w-4 h-4 flex-shrink-0" />
                    <span>{test.isFree ? "Start Free Mock" : "Start Mock Test"}</span>
                  </Button>
                </Link>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={`/signup?redirect=${encodeURIComponent(`/tests/${test.slug}/take`)}`}
                    className="block"
                  >
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full h-11 px-3 text-xs sm:text-sm font-semibold gap-2 whitespace-nowrap shadow-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <BookOpen className="w-4 h-4 flex-shrink-0" />
                      <span>Sign Up & Start Mock</span>
                    </Button>
                  </Link>
                  <p className="text-[11px] text-center text-slate-500">
                    Already registered?{" "}
                    <Link
                      href={`/login?redirect=${encodeURIComponent(`/tests/${test.slug}/take`)}`}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setModalOpen(true)}
              >
                Enrollment Details & Instructions
              </Button>
              <p className="text-[10px] text-center text-slate-400">
                Instant CBT Simulation • Verified Solutions Included
              </p>
            </div>

            {/* Summary List */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Access Validity</span>
                <span className="font-medium text-slate-900">Unlimited / 1 Year</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Assessment Format</span>
                <span className="font-medium text-slate-900">CBT Simulation</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Detailed Explanations</span>
                <span className="font-medium text-slate-900">Included</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Instant Scorecard</span>
                <span className="font-medium text-slate-900">Yes</span>
              </div>
            </div>

            {/* Share link */}
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
                    <span>Share test details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <EnrollmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={test.title}
        priceInPaise={test.priceInPaise}
        slug={test.slug}
        itemType="test"
      />
    </div>
  );
}
