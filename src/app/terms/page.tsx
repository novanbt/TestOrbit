import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service — TestOrbit",
  description: "Read the terms governing use of TestOrbit mock assessments and platform services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to homepage
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-500">
            Last updated: March 2026 • Effective for all enrolled students and visitors
          </p>
        </div>

        {/* Content Box */}
        <div className="p-8 sm:p-10 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-8 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              1. Acceptance of Agreement
            </h2>
            <p>
              By accessing, browsing, or registering for an account on TestOrbit (accessible via testorbit.in), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the platform immediately.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              2. Proprietary Educational Content & Intellectual Property
            </h2>
            <p>
              All test items, practice question banks, answer keys, mathematical derivations, rationales, diagrams, software code, and instructional assets available on TestOrbit are the proprietary intellectual property of TestOrbit and its academic contributors.
            </p>
            <p>
              Users are granted a limited, personal, non-exclusive, non-transferable license to access assessment materials solely for individual study and examination preparation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              3. Prohibited Conduct & Scrape Prevention
            </h2>
            <p>Under this agreement, you expressly agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li>Reproduce, redistribute, republish, sell, or broadcast test questions or solutions in any digital or print format.</li>
              <li>Employ automated bots, scrapers, web spiders, or data extraction scripts against the TestOrbit catalogue.</li>
              <li>Share user account credentials with third parties or allow concurrent multi-user access under a single student license.</li>
              <li>Attempt to decompile, reverse engineer, or compromise the platform testing runner and scoring mechanisms.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              4. Account Responsibility & Security
            </h2>
            <p>
              When creating an account, you agree to provide authentic and accurate registration details. You are responsible for preserving the confidentiality of your credentials and for all activities conducted through your student dashboard.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              5. Educational Disclaimer & Exam Outlines
            </h2>
            <p>
              TestOrbit assessments are designed as independent preparation simulations calibrated to authentic syllabus blueprints. While our team takes extreme care in question curation, completion of our practice tests does not guarantee specific percentiles or admissions to external academic institutions.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              6. Contact for Legal Inquiries
            </h2>
            <p>
              Questions or notifications regarding intellectual property or service compliance may be directed to our compliance team at{" "}
              <Link href="mailto:legal@testorbit.in" className="text-indigo-600 font-medium hover:underline">
                legal@testorbit.in
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
