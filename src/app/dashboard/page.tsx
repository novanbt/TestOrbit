"use client";

import React, { useState, useEffect } from "react";
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
  Award,
  TrendingUp,
  Clock,
  Target,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";
import {
  getUserDashboardData,
  updateStudentTargetExam,
  UserDashboardData,
  StoredAttempt,
} from "@/lib/firebase/firestoreService";

const TARGET_EXAMS = [
  "JEE Main & Advanced 2026",
  "NEET UG (Medical Entrance)",
  "CBSE Class 12 Boards",
  "CBSE Class 10 Boards",
  "Software Engineering / Coding",
  "General Competitive Exams",
];

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"tests" | "series" | "activity">("tests");
  const [dashboardData, setDashboardData] = useState<UserDashboardData>({
    targetExam: "JEE Main & Advanced 2026",
    totalAttempts: 0,
    avgAccuracy: 0,
    totalPracticeTimeSeconds: 0,
    recentAttempts: [],
  });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [targetSavedSuccess, setTargetSavedSuccess] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    getUserDashboardData(user.id).then((data) => {
      if (isMounted) {
        setDashboardData(data);
        setIsLoadingData(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleUpdateTarget = async (newTarget: string) => {
    if (!user?.id || isSavingTarget) return;
    setIsSavingTarget(true);
    setDashboardData((prev) => ({ ...prev, targetExam: newTarget }));

    const success = await updateStudentTargetExam(user.id, newTarget);
    setIsSavingTarget(false);
    if (success) {
      setTargetSavedSuccess(true);
      setTimeout(() => setTargetSavedSuccess(false), 2500);
    }
  };

  const formatPracticeTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0 mins";
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} mins`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs} hrs`;
  };

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

  // 2. Gate: Requirement #3 - only visible once the user creates an account
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
              Target: <span className="font-semibold text-slate-700">{dashboardData.targetExam}</span> • Track your mock test performance and syllabus readiness
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

      {/* 2. Key Performance Indicators (KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tests Completed */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tests Attempted</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {isLoadingData ? "..." : dashboardData.totalAttempts}
            </span>
            <span className="text-xs text-slate-400">tests</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Recorded in your profile</p>
        </div>

        {/* KPI 2: Average Accuracy */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Accuracy</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {isLoadingData
                ? "..."
                : dashboardData.totalAttempts > 0
                ? `${dashboardData.avgAccuracy}%`
                : "—"}
            </span>
            {dashboardData.totalAttempts > 0 && (
              <span className={`text-xs font-semibold ${
                dashboardData.avgAccuracy >= 75
                  ? "text-emerald-600"
                  : dashboardData.avgAccuracy >= 50
                  ? "text-amber-600"
                  : "text-rose-600"
              }`}>
                {dashboardData.avgAccuracy >= 75
                  ? "Strong"
                  : dashboardData.avgAccuracy >= 50
                  ? "Moderate"
                  : "Needs work"}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">From all completed exams</p>
        </div>

        {/* KPI 3: Total Practice Time */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Practice Time</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {isLoadingData
                ? "..."
                : formatPracticeTime(dashboardData.totalPracticeTimeSeconds)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Timed simulation hours</p>
        </div>

        {/* KPI 4: Target Exam Goal */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Preparation Goal</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-sm font-semibold text-slate-900 truncate block">
              {dashboardData.targetExam}
            </span>
          </div>
          <p className="text-[11px] text-indigo-600 mt-1 font-medium">Customizable in sidebar</p>
        </div>
      </div>

      {/* 3. Continue Practicing Recommended Banner */}
      <div className="p-5 bg-linear-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-xl text-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-medium backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Recommended Next Practice</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold">
            Ready to test your speed & negative marking accuracy?
          </h3>
          <p className="text-xs text-indigo-100 max-w-xl">
            Simulate real examination conditions with timed question palettes, instant scorecards, and detailed explanations.
          </p>
        </div>

        <Link href="/explore" className="shrink-0">
          <button className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold text-xs rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5">
            Launch Mock Test
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </div>

      {/* 4. Main Dashboard Layout (Grid with Main Area & Account Info) */}
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
              <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">
                {dashboardData.recentAttempts.length}
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
              <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-semibold">
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
              {dashboardData.recentAttempts.length > 0 && (
                <span className="text-[11px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-semibold">
                  {dashboardData.recentAttempts.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab 1: My Tests */}
          {activeTab === "tests" && (
            <div className="space-y-4">
              {dashboardData.recentAttempts.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentAttempts.map((att) => (
                    <div
                      key={att.id}
                      className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {att.categoryName || "Curriculum"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Completed {new Date(att.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{att.testTitle}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>
                            Score: <strong className="text-slate-800">{att.marksScored}/{att.maxMarks}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Accuracy: <strong className="text-emerald-700">{att.accuracyPercentage}%</strong>
                          </span>
                          <span>•</span>
                          <span>{formatPracticeTime(att.timeTakenSeconds)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/tests/${att.testSlug}/take`}>
                          <Button variant="primary" size="sm" className="gap-1 text-xs">
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retake Test
                          </Button>
                        </Link>
                        <Link href={`/tests/${att.testSlug}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            Overview
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
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
                    <Button variant="primary" size="sm" className="gap-1.5">
                      Explore Mock Tests
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
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
              <Link href="/explore?type=series">
                <Button variant="outline" size="sm" className="gap-1.5">
                  Browse Test Series Bundles
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          )}

          {/* Tab 3: Recent Activity */}
          {activeTab === "activity" && (
            <div className="space-y-4">
              {dashboardData.recentAttempts.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recentAttempts.map((att, idx) => (
                    <div
                      key={att.id || idx}
                      className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-semibold text-slate-900">
                            {att.testTitle}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(att.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {new Date(att.completedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 bg-slate-50 rounded-lg px-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Score</span>
                          <span className="font-bold text-slate-900">{att.marksScored} / {att.maxMarks}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Accuracy</span>
                          <span className="font-bold text-emerald-700">{att.accuracyPercentage}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Questions</span>
                          <span className="font-medium text-slate-700">{att.scorecard?.attemptedCount || 0} / {att.scorecard?.totalQuestions || 0}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Duration</span>
                          <span className="font-medium text-slate-700">{formatPracticeTime(att.timeTakenSeconds)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Link href={`/tests/${att.testSlug}/take`}>
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retake Exam
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-white border border-slate-200 rounded-xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      No test attempts logged yet
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                      Your completed mock tests, sectional time analytics, and topic-wise accuracy scorecards will automatically appear here as you take tests.
                    </p>
                  </div>
                  <Link href="/explore">
                    <Button variant="primary" size="sm" className="gap-1.5">
                      Start Your First Test
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Account Information Overview (1 col) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Target Exam Goal Card */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                Target Exam Goal
              </h3>
              {targetSavedSuccess && (
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Select your primary exam so TestOrbit tailors mock recommendations to your syllabus:
            </p>

            <div className="space-y-1.5">
              {TARGET_EXAMS.map((exam) => {
                const isSelected = dashboardData.targetExam === exam;
                return (
                  <button
                    key={exam}
                    type="button"
                    onClick={() => handleUpdateTarget(exam)}
                    disabled={isSavingTarget}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{exam}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Profile Card */}
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
