"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Award,
  BarChart3,
  Check,
  X,
  Eye,
  Home,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { MockTest, TestQuestion, QuestionAttemptStatus, TestAttemptScorecard } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDuration } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { saveUserAttempt } from "@/lib/firebase/firestoreService";

interface TestRunnerProps {
  test: MockTest;
  questions: TestQuestion[];
}

export function TestRunner({ test, questions }: TestRunnerProps) {
  const { user, loading } = useAuth();
  // Test state
  const totalQuestions = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [visitedQuestions, setVisitedQuestions] = useState<Record<string, boolean>>({
    [questions[0]?.id || "q1"]: true,
  });

  // Timer state
  const totalSeconds = test.durationMinutes * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Modals & submission state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [scorecard, setScorecard] = useState<TestAttemptScorecard | null>(null);
  const [solutionFilter, setSolutionFilter] = useState<"all" | "incorrect" | "correct" | "unattempted">("all");

  const currentQ = questions[currentIndex];

  // Mark visited when index changes
  useEffect(() => {
    if (currentQ) {
      setVisitedQuestions((prev) => ({ ...prev, [currentQ.id]: true }));
    }
  }, [currentIndex, currentQ]);

  // Countdown timer interval
  useEffect(() => {
    if (!user || isCompleted || isTimerPaused) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [user, isCompleted, isTimerPaused]);

  // Format seconds into HH:MM:SS
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Determine status of a question
  const getQuestionStatus = (q: TestQuestion): QuestionAttemptStatus => {
    const isAnswered = selectedAnswers[q.id] !== undefined;
    const isMarked = markedForReview[q.id] === true;
    const isVisited = visitedQuestions[q.id] === true;

    if (isAnswered && isMarked) return "answered-and-marked";
    if (isMarked) return "marked";
    if (isAnswered) return "answered";
    if (isVisited) return "not-answered";
    return "not-visited";
  };

  // Palette counts
  const statusCounts = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let answeredAndMarked = 0;
    let notVisited = 0;

    for (const q of questions) {
      const status = getQuestionStatus(q);
      if (status === "answered") answered++;
      else if (status === "not-answered") notAnswered++;
      else if (status === "marked") marked++;
      else if (status === "answered-and-marked") answeredAndMarked++;
      else notVisited++;
    }

    return {
      answered,
      notAnswered,
      marked,
      answeredAndMarked,
      notVisited,
    };
  }, [selectedAnswers, markedForReview, visitedQuestions, questions]);

  // Handle Option Click
  const handleSelectOption = (optId: "A" | "B" | "C" | "D") => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optId,
    }));
  };

  // Clear Response
  const handleClearResponse = () => {
    setSelectedAnswers((prev) => {
      const updated = { ...prev };
      delete updated[currentQ.id];
      return updated;
    });
  };

  // Save & Next
  const handleSaveAndNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Mark for Review & Next
  const handleMarkForReviewAndNext = () => {
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }));
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Final Submit Handler
  const handleFinalSubmit = () => {
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;
    let marksEarned = 0;
    const topicScores: Record<string, { total: number; correct: number }> = {};

    questions.forEach((q) => {
      const userChoice = selectedAnswers[q.id];
      const isCorrect = userChoice === q.correctOptionId;

      if (!topicScores[q.topic]) {
        topicScores[q.topic] = { total: 0, correct: 0 };
      }
      topicScores[q.topic].total += 1;

      if (!userChoice) {
        unattemptedCount += 1;
      } else if (isCorrect) {
        correctCount += 1;
        topicScores[q.topic].correct += 1;
        marksEarned += q.marks;
      } else {
        incorrectCount += 1;
        marksEarned -= q.negativeMarks || 0;
      }
    });

    const attemptedCount = correctCount + incorrectCount;
    const accuracy = attemptedCount > 0 ? Math.round((correctCount / attemptedCount) * 100) : 0;
    const timeTaken = totalSeconds - secondsRemaining;

    const finalScorecard: TestAttemptScorecard = {
      totalQuestions,
      attemptedCount,
      unattemptedCount,
      markedForReviewCount: Object.values(markedForReview).filter(Boolean).length,
      correctCount,
      incorrectCount,
      totalMarksScored: Math.max(0, Math.round(marksEarned * 10) / 10),
      maxMarks: test.maxMarks,
      accuracyPercentage: accuracy,
      timeTakenSeconds: timeTaken,
      topicScores,
    };

    setScorecard(finalScorecard);
    setIsCompleted(true);
    setShowSubmitModal(false);

    // Persist attempt to Firestore under /users/{userId}/attempts
    if (user?.id) {
      saveUserAttempt(user.id, test, finalScorecard).catch((err) => {
        console.warn("Could not save attempt to Firestore:", err);
      });
    }
  };

  // Retake Test
  const handleRetake = () => {
    setSelectedAnswers({});
    setMarkedForReview({});
    setVisitedQuestions({ [questions[0]?.id || "q1"]: true });
    setSecondsRemaining(totalSeconds);
    setCurrentIndex(0);
    setIsCompleted(false);
    setScorecard(null);
  };

  // ----------------------------------------------------
  // AUTHENTICATION GUARD: Prevent test attempt without account
  // ----------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">Verifying candidate session...</p>
        <p className="text-xs text-slate-500 mt-1">Preparing your secure examination environment.</p>
      </div>
    );
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(`/tests/${test.slug}/take`);
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Header icon & badge */}
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-800">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-nav.png"
                alt="TestOrbit"
                width={140}
                height={39}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <Badge variant="outline" size="sm" className="gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              Account Required
            </Badge>
          </div>

          <div className="text-center sm:text-left mb-6">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Create an Account to Start This Mock Test
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              To participate in official TestOrbit mock examinations, ensure timed integrity, and record your scorecard with detailed solutions, an account is required.
            </p>
          </div>

          {/* Test Preview Card */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">
                {test.categoryName}
              </span>
              <span className="text-xs text-slate-400">
                {test.difficulty}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white line-clamp-2">
              {test.title}
            </h2>
            <div className="flex items-center gap-4 text-xs text-slate-300 pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {test.durationMinutes} Mins
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                {test.questionCount} Questions
              </span>
              {test.maxMarks ? (
                <>
                  <span>•</span>
                  <span>{test.maxMarks} Marks</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href={`/signup?redirect=${redirectUrl}`}
              className="block w-full"
            >
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md gap-2"
              >
                Create Free Account & Start Mock
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link
              href={`/login?redirect=${redirectUrl}`}
              className="block w-full"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-center border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white font-medium"
              >
                Sign In to Existing Account
              </Button>
            </Link>

            <Link
              href={`/tests/${test.slug}`}
              className="block text-center text-xs text-slate-400 hover:text-slate-200 transition-colors pt-2"
            >
              ← Return to Test Overview
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Instant free registration</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Personalized scorecards</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Weakness analytics</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Full step-by-step solutions</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // EMPTY QUESTION BANK GUARD
  // ----------------------------------------------------
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Questions Not Available</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This mock test does not have questions published yet. Please check back soon.
            </p>
          </div>
          <div className="flex items-center justify-center pt-2">
            <Link href={`/tests/${test.slug}`} className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full text-xs border-slate-700 text-slate-300">
                Back to Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RESULT SCORECARD VIEW
  // ----------------------------------------------------
  if (isCompleted && scorecard) {
    const filteredQuestions = questions.filter((q) => {
      const userAns = selectedAnswers[q.id];
      if (solutionFilter === "correct") return userAns === q.correctOptionId;
      if (solutionFilter === "incorrect") return userAns && userAns !== q.correctOptionId;
      if (solutionFilter === "unattempted") return !userAns;
      return true;
    });

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  Examination Result Analysis
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  {test.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleRetake} className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Retake Mock
              </Button>
              <Link href="/explore">
                <Button variant="primary" size="sm" className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  Explore More Tests
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Performance Hero Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Test Attempt Submitted Successfully
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Your Score:{" "}
                  <span className="text-indigo-600">
                    {scorecard.totalMarksScored} / {scorecard.maxMarks}
                  </span>
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Overall Accuracy: <strong>{scorecard.accuracyPercentage}%</strong> • Completed in{" "}
                  <strong>{formatDuration(Math.ceil(scorecard.timeTakenSeconds / 60))}</strong> of{" "}
                  <strong>{test.durationMinutes} mins</strong>
                </p>
              </div>

              {/* Performance Indicator Pill */}
              <div className="flex items-center gap-6 bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                <div className="text-center px-2">
                  <span className="text-xs text-slate-500 block font-medium">Attempted</span>
                  <span className="text-xl font-bold text-slate-900">
                    {scorecard.attemptedCount} / {scorecard.totalQuestions}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center px-2">
                  <span className="text-xs text-slate-500 block font-medium">Accuracy</span>
                  <span className="text-xl font-bold text-indigo-600">
                    {scorecard.accuracyPercentage}%
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="text-center px-2">
                  <span className="text-xs text-slate-500 block font-medium">Status</span>
                  <span className="text-sm font-bold text-emerald-600">Evaluated</span>
                </div>
              </div>
            </div>

            {/* Metric Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-emerald-700">Correct Answers</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-900">{scorecard.correctCount}</div>
                <span className="text-[11px] text-emerald-600 font-medium">Positive marks earned</span>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-rose-700">Incorrect Answers</span>
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-rose-900">{scorecard.incorrectCount}</div>
                <span className="text-[11px] text-rose-600 font-medium">Negative deductions applied</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600">Unattempted</span>
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-2xl font-black text-slate-800">{scorecard.unattemptedCount}</div>
                <span className="text-[11px] text-slate-500 font-medium">Zero penalties incurred</span>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-indigo-700">Time Consumed</span>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-indigo-900">
                  {formatDuration(Math.ceil(scorecard.timeTakenSeconds / 60))}
                </div>
                <span className="text-[11px] text-indigo-600 font-medium">
                  Allocated: {test.durationMinutes} mins
                </span>
              </div>
            </div>
          </div>

          {/* Topic Performance Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Syllabus Topic Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(scorecard.topicScores).map(([topic, data]) => {
                const topicPct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                return (
                  <div key={topic} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 truncate pr-2">{topic}</span>
                      <span className="font-bold text-slate-900 shrink-0">
                        {data.correct}/{data.total} ({topicPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          topicPct >= 75
                            ? "bg-emerald-500"
                            : topicPct >= 50
                            ? "bg-indigo-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${topicPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Question Review & Step-by-Step Solutions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Question Review & Step-by-Step Explanations
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect your response against verified answer keys with explanatory rationales.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                <button
                  onClick={() => setSolutionFilter("all")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    solutionFilter === "all" ? "bg-white text-indigo-700 shadow-xs font-semibold" : ""
                  }`}
                >
                  All ({questions.length})
                </button>
                <button
                  onClick={() => setSolutionFilter("incorrect")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    solutionFilter === "incorrect"
                      ? "bg-white text-rose-700 shadow-xs font-semibold"
                      : ""
                  }`}
                >
                  Incorrect ({scorecard.incorrectCount})
                </button>
                <button
                  onClick={() => setSolutionFilter("correct")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    solutionFilter === "correct"
                      ? "bg-white text-emerald-700 shadow-xs font-semibold"
                      : ""
                  }`}
                >
                  Correct ({scorecard.correctCount})
                </button>
                <button
                  onClick={() => setSolutionFilter("unattempted")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    solutionFilter === "unattempted"
                      ? "bg-white text-slate-800 shadow-xs font-semibold"
                      : ""
                  }`}
                >
                  Skipped ({scorecard.unattemptedCount})
                </button>
              </div>
            </div>

            {/* Question Review List */}
            <div className="space-y-6">
              {filteredQuestions.map((q) => {
                const userChoice = selectedAnswers[q.id];
                const isCorrect = userChoice === q.correctOptionId;
                const isUnattempted = !userChoice;

                return (
                  <article
                    key={q.id}
                    className={`p-5 rounded-xl border transition-all ${
                      isCorrect
                        ? "border-emerald-200 bg-emerald-50/20"
                        : isUnattempted
                        ? "border-slate-200 bg-white"
                        : "border-rose-200 bg-rose-50/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Question {q.questionNumber}</span>
                        <Badge variant="default" size="sm">
                          {q.topic}
                        </Badge>
                      </div>

                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                          <Check className="w-3.5 h-3.5" /> Correct (+{q.marks})
                        </span>
                      ) : isUnattempted ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                          Unattempted (0)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                          <X className="w-3.5 h-3.5" /> Incorrect (-{q.negativeMarks || 0})
                        </span>
                      )}
                    </div>

                    {/* Question statement */}
                    <p className="text-sm font-medium text-slate-900 mb-3 leading-relaxed">{q.text}</p>

                    {/* Code snippet if any */}
                    {q.codeSnippet && (
                      <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto mb-4 border border-slate-800">
                        {q.codeSnippet}
                      </pre>
                    )}

                    {/* Options Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      {q.options.map((opt) => {
                        const isThisCorrect = opt.id === q.correctOptionId;
                        const isUserPick = opt.id === userChoice;

                        let optionStyle = "border-slate-200 bg-white text-slate-700";
                        if (isThisCorrect) {
                          optionStyle = "border-emerald-400 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-400";
                        } else if (isUserPick) {
                          optionStyle = "border-rose-400 bg-rose-50 text-rose-950 font-medium ring-1 ring-rose-400";
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs ${optionStyle}`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center font-bold shrink-0 ${
                                isThisCorrect
                                  ? "bg-emerald-600 text-white"
                                  : isUserPick
                                  ? "bg-rose-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="flex-1 leading-normal">{opt.text}</span>
                            {isThisCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {isUserPick && !isThisCorrect && (
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Verified Solution & Explanation */}
                    <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs text-indigo-950 leading-relaxed">
                      <span className="font-bold text-indigo-900 block mb-1">
                        Verified Explanation & Concept Walkthrough:
                      </span>
                      {q.explanation}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ----------------------------------------------------
  // ACTIVE CBT TEST RUNNER INTERFACE
  // ----------------------------------------------------
  const timerIsWarning = secondsRemaining < 300; // less than 5 mins

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none">
      {/* 1. Dedicated Examination Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            TO
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-md">
              {test.title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="truncate">{test.categoryName}</span>
              <span>•</span>
              <span className="font-medium text-slate-700">Official CBT Simulation</span>
            </div>
          </div>
        </div>

        {/* Center / Real-time Timer Counter */}
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border font-mono font-bold text-sm tracking-wide transition-colors ${
            timerIsWarning
              ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
              : "bg-slate-50 border-slate-200 text-slate-900"
          }`}
        >
          <Clock className={`w-4 h-4 ${timerIsWarning ? "text-rose-600" : "text-indigo-600"}`} />
          <span>{formatTime(secondsRemaining)}</span>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* 2. Main Test Split View (Questions on Left, Question Palette on Right) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Question Area (8 Cols on Desktop) */}
        <main className="lg:col-span-8 flex flex-col bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Question Banner */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50/70 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <Badge variant="default" size="sm">
                {currentQ.topic}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-700">+{currentQ.marks} Marks</span>
              <span className="text-slate-300">|</span>
              <span className="font-semibold text-rose-700">
                -{currentQ.negativeMarks || 0} Negative
              </span>
            </div>
          </div>

          {/* Question Body */}
          <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
            <h2 className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
              {currentQ.text}
            </h2>

            {/* Code Snippet if present */}
            {currentQ.codeSnippet && (
              <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs sm:text-sm rounded-lg overflow-x-auto border border-slate-800 leading-relaxed">
                {currentQ.codeSnippet}
              </pre>
            )}

            {/* Multiple Choice Options */}
            <div className="pt-2 space-y-3">
              {currentQ.options.map((opt) => {
                const isSelected = selectedAnswers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all text-xs sm:text-sm leading-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium ring-1 ring-indigo-500 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-800"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="flex-1 pt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer Bar */}
          <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearResponse}
                disabled={!selectedAnswers[currentQ.id]}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Clear Response
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarkForReviewAndNext}
                className="text-xs gap-1 border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
              >
                <Bookmark className="w-3.5 h-3.5" />
                {markedForReview[currentQ.id] ? "Unmark Review" : "Mark for Review"}
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveAndNext}
                className="text-xs gap-1"
              >
                {currentIndex === totalQuestions - 1 ? "Save" : "Save & Next"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </main>

        {/* Right Column: Question Palette & Navigation (4 Cols on Desktop) */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Question Palette
            </h3>

            {/* Status Indicator Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>Answered ({statusCounts.answered})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-rose-500" />
                <span>Not Answered ({statusCounts.notAnswered})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-purple-600" />
                <span>Marked ({statusCounts.marked})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-slate-200" />
                <span>Not Visited ({statusCounts.notVisited})</span>
              </div>
            </div>

            {/* Interactive Question Grid */}
            <div className="pt-2 border-t border-slate-100">
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-[320px] overflow-y-auto pr-1">
                {questions.map((q, idx) => {
                  const status = getQuestionStatus(q);
                  const isCurrent = idx === currentIndex;

                  let btnBg = "bg-slate-100 text-slate-700 hover:bg-slate-200";
                  if (status === "answered") {
                    btnBg = "bg-emerald-600 text-white hover:bg-emerald-700";
                  } else if (status === "not-answered") {
                    btnBg = "bg-rose-500 text-white hover:bg-rose-600";
                  } else if (status === "marked" || status === "answered-and-marked") {
                    btnBg = "bg-purple-600 text-white hover:bg-purple-700";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${btnBg} ${
                        isCurrent ? "ring-2 ring-indigo-500 ring-offset-2 scale-105" : ""
                      }`}
                      aria-label={`Jump to question ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Final Submit Trigger */}
            <div className="pt-3 border-t border-slate-100">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowSubmitModal(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
              >
                Submit Examination
              </Button>
            </div>
          </div>

          {/* Guidelines Brief */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
            <span className="font-bold block">Examination Tip:</span>
            <p className="leading-relaxed">
              Use 'Mark for Review' on uncertain questions to easily return to them via the palette before submitting.
            </p>
          </div>
        </aside>
      </div>

      {/* 3. Pre-Submission Confirmation Dialog */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Test Submission</h3>
                <p className="text-xs text-slate-500">Are you sure you want to conclude your exam?</p>
              </div>
            </div>

            {/* Attempt Overview Table */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold text-slate-900">{totalQuestions}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Answered:</span>
                <span className="font-bold">{statusCounts.answered + statusCounts.answeredAndMarked}</span>
              </div>
              <div className="flex justify-between text-rose-700">
                <span>Unattempted:</span>
                <span className="font-bold">{statusCounts.notAnswered + statusCounts.notVisited}</span>
              </div>
              <div className="flex justify-between text-purple-700">
                <span>Marked for Review:</span>
                <span className="font-bold">{statusCounts.marked + statusCounts.answeredAndMarked}</span>
              </div>
              <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-slate-900">{formatTime(secondsRemaining)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1"
              >
                Return to Test
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleFinalSubmit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                Submit & Finish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
