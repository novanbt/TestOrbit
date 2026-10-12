import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Target, Award, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "About Us — TestOrbit",
  description: "Learn about TestOrbit's mission to deliver authentic, curriculum-aligned practice mock tests.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Back navigation */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to homepage
          </Link>
        </div>

        {/* Hero Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700">
            About TestOrbit
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Built for learners who take preparation seriously.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            TestOrbit is an online assessment platform dedicated to providing students, exam candidates, and lifelong learners with high-yield mock tests calibrated to authentic examination patterns.
          </p>
        </div>

        {/* Mission Card */}
        <div className="p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Our Mission</h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Examination anxiety often stems from unfamiliarity with real test formats, timing constraints, and deceptive distractor options. We bridge the gap between textbook studying and actual exam performance by designing mock assessments that strictly mirror official syllabus weightage and question complexity.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Curriculum-Aligned</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every mock test is crafted in alignment with recognized examination standards (CBSE, NTA, UPSC, SSC, CEFR, and university boards).
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Verified Solutions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Answer keys include thorough explanations, step-by-step mathematical proofs, and grammatical rationales to reinforce concept retention.
            </p>
          </div>

          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">For Every Stage</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              From Class X board aspirants to competitive engineering test-takers, foreign language learners, and career technologists.
            </p>
          </div>
        </div>

        {/* Coverage Highlights */}
        <div className="p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assessment Coverage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
              <span><strong>School Education:</strong> Classes IX–XII Board simulations (CBSE & ICSE).</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
              <span><strong>Competitive Entrances:</strong> JEE Main, NEET, SSC CGL, and Banking examinations.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
              <span><strong>Multilingual Testing:</strong> Hindi, French, German, Spanish, Sanskrit, Japanese, and English.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
              <span><strong>Technical Skills:</strong> Python programming, DSA, and Cloud DevOps fundamentals.</span>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="p-8 bg-linear-to-r from-indigo-900 to-blue-900 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white">Start your preparation today</h3>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1">
              Browse our assessment catalogue and discover practice tests calibrated for your goals.
            </p>
          </div>
          <Link href="/explore">
            <Button size="md" className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold border-none whitespace-nowrap">
              Explore All Tests
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
