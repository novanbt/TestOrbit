"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  BookOpen,
  Layers,
  History,
  Shield,
  ArrowRight,
  ExternalLink,
  Info,
  Calendar,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"tests" | "series" | "activity">("tests");

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your portal...</p>
        </div>
      </div>
    );
  }

  // 2. Gate: Requirement #3 - only visible once the user creates an account / becomes a user
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center px-4 py-16 bg-slate-50/50">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Student Account Required
            </h1>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              The student dashboard is reserved for registered learners to track mock test progress, scorecards, and syllabus readiness.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link href="/signup" className="flex-1">
              <Button variant="primary" size="md" className="w-full">
                Create Account
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="md" className="w-full">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-[11px] text-slate-400">
            Takes less than 15 seconds to set up your learner profile.
          </p>
        </div>
      </div>
    );
  }

  // Initials for avatar
  const initials = user.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Current Session";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* 1. Header Banner */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Welcome, {user.name || user.email.split("@")[0]}
              </h1>
              <Badge variant="primary" size="sm">
                Student Portal
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track your enrolled practice tests, examine answer sheets, and monitor syllabus readiness.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/explore">
            <Button variant="primary" size="sm" className="gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Browse More Tests
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Platform Status Bar */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
        <div className="flex items-start sm:items-center gap-2.5">
          <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Student Account Active:</strong> You have unlimited access to browse curriculum mock tests and practice bundles.
          </span>
        </div>
        <Badge variant="success" size="sm" className="whitespace-nowrap">
          Active Student Session
        </Badge>
      </div>

      {/* 3. Main Dashboard Layout (Grid with Main Area & Account Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Tabs for My Tests, My Series, Activity (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 space-x-6 text-sm">
            <button
              onClick={() => setActiveTab("tests")}
              className={`pb-3 font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "tests"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              My Tests
              <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                0
              </span>
            </button>

            <button
              onClick={() => setActiveTab("series")}
              className={`pb-3 font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "series"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              My Test Series
              <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                0
              </span>
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`pb-3 font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                activeTab === "activity"
                  ? "border-b-2 border-indigo-600 text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <History className="w-4 h-4" />
              Recent Activity
            </button>
          </div>

          {/* Tab 1: My Tests */}
          {activeTab === "tests" && (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  No individual mock tests enrolled yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Explore curriculum-aligned mock tests for school boards, engineering, medical, and coding assessments.
                </p>
              </div>
              <Link href="/explore">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Explore Mock Tests
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Tab 2: My Test Series */}
          {activeTab === "series" && (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  No test series packages enrolled yet
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Test series bundles include multiple progressive mock tests, syllabus-wide analytics, and comprehensive answer keys.
                </p>
              </div>
              <Link href="/explore">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Browse Test Series Bundles
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Tab 3: Recent Activity */}
          {activeTab === "activity" && (
            <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  No test attempts logged
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Your completed mock tests, sectional time analytics, and topic-wise accuracy scorecards will appear here as you take tests.
                </p>
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-50 py-2 px-3 rounded-lg inline-block border border-slate-200">
                Ready for test attempts • Choose a test to begin
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Account Information Overview (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Account Information
              </h3>
              <Badge variant="default" size="sm">
                Student
              </Badge>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Email</span>
                <span className="font-medium text-slate-900 truncate block">
                  {user.email}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Enrolment Tier</span>
                <span className="font-medium text-slate-900">
                  Student Member Tier
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Joined On</span>
                  <span className="font-medium text-slate-900">{formattedDate}</span>
                </div>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-1">
                  Authentication Security
                </span>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {isFirebaseConfigured
                      ? "Secured via Firebase Auth"
                      : "Verified Student Session"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={() => signOut()}
                variant="outline"
                size="sm"
                className="w-full text-xs text-slate-700 hover:text-rose-600 hover:border-rose-300"
              >
                Switch Account / Log Out
              </Button>
            </div>
          </div>

          {/* Quick Help Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
            <h4 className="font-semibold text-slate-900">Need exam guidance?</h4>
            <p className="text-slate-500 leading-relaxed">
              Our academic advisors can guide you toward the right test series for your target percentile.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1 text-indigo-600 font-medium hover:text-indigo-800 pt-1"
            >
              Browse test recommendations
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
