import React from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Refund Policy — TestOrbit",
  description: "Learn about TestOrbit's 48-hour student satisfaction refund policy.",
};

export default function RefundPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            Clear & Fair Guarantee
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs text-slate-500">
            Last updated: March 2026 • 48-hour student confidence guarantee
          </p>
        </div>

        {/* Core Guarantee Card */}
        <div className="p-8 bg-linear-to-r from-emerald-900 to-teal-900 rounded-2xl text-white space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            48-Hour Full Refund Guarantee
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Not the right test series for your syllabus? We have you covered.
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed max-w-2xl">
            For digital mock tests and bundle series purchases, refund requests submitted within 48 hours of purchase prior to attempting more than 10% of test questions are eligible for full reversals.
          </p>
        </div>

        {/* Content Box */}
        <div className="p-8 sm:p-10 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-8 text-sm text-slate-600 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              1. Eligibility Criteria
            </h2>
            <p>
              Because digital test questions and verified answer keys are unlocked immediately upon enrollment, refunds are evaluated against reasonable fair-use conditions:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-emerald-900 block">Eligible for Full Refund</span>
                <p className="text-xs text-emerald-800">
                  Request made within 48 hours of purchase AND less than 10% of total questions attempted across the series.
                </p>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-xs font-semibold text-slate-900 block">Ineligible Conditions</span>
                <p className="text-xs text-slate-500">
                  Requests submitted after 48 hours, or where more than 10% of test questions and answer keys have been completed and viewed.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              2. How to Request a Refund
            </h2>
            <p>
              Submitting a refund is quick and straightforward. Simply email our academic support team with:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li>Your registered student account email address.</li>
              <li>The title or order ID of the test or test series package.</li>
              <li>A brief note explaining why the test did not suit your syllabus needs.</li>
            </ul>
            <div className="pt-2">
              <Link href="mailto:support@testorbit.in?subject=Refund%20Request">
                <Button variant="outline" size="sm" className="gap-2">
                  Email support@testorbit.in
                </Button>
              </Link>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              3. Processing Timelines
            </h2>
            <p>
              Once approved by our team, reversals are initiated immediately. Credit will reflect in your original payment method (Bank Account, UPI, or Card) within <strong>5 to 7 business days</strong> depending on your issuing bank.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
