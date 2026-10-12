"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Layers,
  HelpCircle,
  Grid,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit,
  Eye,
  FileQuestion,
  Users,
} from "lucide-react";
import { MockTest, TestSeries, Category } from "@/types";
import { getAdminTests, getAdminSeries, getAdminCategories, getAdminTestQuestions } from "@/lib/admin/adminStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDuration } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [series, setSeries] = useState<TestSeries[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);

  const loadData = () => {
    const loadedTests = getAdminTests();
    const loadedSeries = getAdminSeries();
    const loadedCats = getAdminCategories();

    setTests(loadedTests);
    setSeries(loadedSeries);
    setCategories(loadedCats);

    // Sum questions
    const qCount = loadedTests.reduce((acc, t) => acc + (t.questionCount || 0), 0);
    setTotalQuestions(qCount);
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("testorbit_admin_data_updated", handleUpdate);
    return () => window.removeEventListener("testorbit_admin_data_updated", handleUpdate);
  }, []);

  const publishedTestsCount = tests.filter((t) => t.published).length;
  const publishedSeriesCount = series.filter((s) => s.published).length;

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              TestOrbit Administration Portal
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
              v1.0 Live
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete curriculum, question bank, test series, and student evaluation control center.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/tests/create">
            <Button variant="primary" size="sm" className="gap-1.5 shadow-xs">
              <PlusCircle className="w-4 h-4" />
              Create New Mock Test
            </Button>
          </Link>
          <Link href="/admin/series">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Layers className="w-4 h-4" />
              Manage Series
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1 */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Mock Tests</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{tests.length}</span>
            <span className="text-xs font-semibold text-emerald-600">
              {publishedTestsCount} Published
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Curriculum test simulations</p>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Question Bank</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalQuestions}</span>
            <span className="text-xs text-slate-400">Total MCQs</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Configured with answer keys</p>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Test Series Bundles</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{series.length}</span>
            <span className="text-xs font-semibold text-blue-600">
              {publishedSeriesCount} Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Packaged multi-test series</p>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Categories</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{categories.length}</span>
            <span className="text-xs text-slate-400">Domains</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">School, JEE, NEET, Tech</p>
        </div>
      </div>

      {/* 3. Quick Action Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/tests/create"
          className="group p-5 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white transition-colors flex items-center justify-center mb-3">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Create New Mock Test
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Build a test from scratch with customized duration, marking scheme, negative marks, and curriculum expectations.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-indigo-600">
            <span>Launch Test Builder</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/tests"
          className="group p-5 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white transition-colors flex items-center justify-center mb-3">
              <FileQuestion className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Question Bank Manager
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Add, edit, or adjust question options, code snippets, negative marks, and explanations for any test.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-emerald-600">
            <span>Manage Questions</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        <Link
          href="/admin/attempts"
          className="group p-5 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-600 text-amber-600 group-hover:text-white transition-colors flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Student Submissions & Scorecards
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Review live mock test completions from students stored in Firestore, evaluate accuracy %, and inspect scores.
            </p>
          </div>
          <div className="pt-4 flex items-center text-xs font-semibold text-amber-600">
            <span>View Student Attempts</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* 4. Recent Mock Tests Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Catalog Mock Tests ({tests.length})
            </h2>
            <p className="text-xs text-slate-500">
              Quickly inspect, edit curriculum data, or manage questions
            </p>
          </div>

          <Link href="/admin/tests">
            <Button variant="outline" size="sm" className="text-xs gap-1">
              View All Tests ({tests.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Test Title & Category</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.slice(0, 8).map((test) => (
                <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 line-clamp-1">{test.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{test.categoryName}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
                      test.difficulty === "Beginner"
                        ? "bg-emerald-50 text-emerald-700"
                        : test.difficulty === "Intermediate"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                    }`}>
                      {test.difficulty}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {test.questionCount} MCQs
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {formatDuration(test.durationMinutes)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {test.isFree ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      formatCurrency(test.priceInPaise)
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      test.published
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${test.published ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {test.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link href={`/admin/tests/${test.slug}/questions`}>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                          <FileQuestion className="w-3 h-3" />
                          Questions
                        </Button>
                      </Link>
                      <Link href={`/admin/tests/${test.slug}/edit`}>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1">
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/tests/${test.slug}`} target="_blank">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
