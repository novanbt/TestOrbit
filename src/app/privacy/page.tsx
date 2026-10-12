import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, EyeOff, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — TestOrbit",
  description: "Learn how TestOrbit safeguards student privacy and handles personal learner information.",
};

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-medium text-emerald-800">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Student Privacy Commitment
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-500">
            Last updated: March 2026 • We prioritize transparent, student-first privacy standards
          </p>
        </div>

        {/* Core highlight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-2">
            <EyeOff className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Zero Data Brokerage</h3>
            <p className="text-xs text-slate-500">We do not sell student contact lists or profiles to third-party ad networks.</p>
          </div>
          <div className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">Encrypted Storage</h3>
            <p className="text-xs text-slate-500">Account credentials and scores are encrypted using industry-standard protocols.</p>
          </div>
          <div className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Learner Control</h3>
            <p className="text-xs text-slate-500">Request full export or erasure of your practice records anytime.</p>
          </div>
        </div>

        {/* Content Box */}
        <div className="p-8 sm:p-10 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-8 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              1. Information We Collect
            </h2>
            <p>
              We only collect essential data required to provide and improve your learning experience:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li><strong>Account Credentials:</strong> Email address and learner name for authentication and portal access.</li>
              <li><strong>Assessment Analytics:</strong> Mock test submissions, answer choices, sectional completion timings, and question accuracy metrics to calculate your performance summary.</li>
              <li><strong>Technical Logs:</strong> Device type, browser user-agent, and IP address collected strictly for fraud prevention and session security.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              2. How We Use Collected Data
            </h2>
            <p>The information we collect is utilized exclusively for:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li>Operating and maintaining your Student Dashboard.</li>
              <li>Generating test scorecards and syllabus mastery recommendations.</li>
              <li>Sending crucial account updates, security notices, and course enrollment confirmations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              3. Data Retention & Deletion Rights
            </h2>
            <p>
              We retain test performance histories to allow students to compare progress across test series. You may request account deletion or data anonymization at any point by emailing{" "}
              <Link href="mailto:privacy@testorbit.in" className="text-indigo-600 font-medium hover:underline">
                privacy@testorbit.in
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
