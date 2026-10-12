"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Lock,
  Plus,
  Search,
  Trash2,
  Edit3,
  Layers,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  LogOut,
  Tag,
  Clock,
  Award,
  BarChart3,
  Check,
  X,
  Eye,
  EyeOff,
  Filter,
  FileText,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { MockTest, TestQuestion, TestSeries, Category, DifficultyLevel } from "@/types";
import {
  ADMIN_CREDENTIALS,
  checkAdminSession,
  setAdminSession,
  loadAllAdminTests,
  saveAdminTests,
  loadAllAdminSeries,
  saveAdminSeries,
  loadAllAdminCategories,
  saveAdminCategories,
  loadQuestionsForTest,
  saveQuestionsForTest,
} from "@/lib/admin/adminStore";

export default function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState<string>("testorbit@ellipse.com");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<"overview" | "tests" | "questions" | "series" | "categories">("overview");

  // Data Collections
  const [tests, setTests] = useState<MockTest[]>([]);
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Search & Filter state for Tests
  const [testSearch, setTestSearch] = useState<string>("");
  const [testCategoryFilter, setTestCategoryFilter] = useState<string>("all");

  // Question Bank Tab State
  const [selectedTestSlug, setSelectedTestSlug] = useState<string>("");
  const [activeQuestions, setActiveQuestions] = useState<TestQuestion[]>([]);

  // Modals
  const [showTestModal, setShowTestModal] = useState<boolean>(false);
  const [editingTestSlug, setEditingTestSlug] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  const [showSeriesModal, setShowSeriesModal] = useState<boolean>(false);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  // Status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Test Form State
  const [testForm, setTestForm] = useState({
    title: "",
    slug: "",
    categoryId: "cat-competitive",
    categoryName: "Competitive Exams",
    targetAudience: "",
    description: "",
    questionCount: 30,
    durationMinutes: 60,
    maxMarks: 100,
    difficulty: "Intermediate" as DifficultyLevel,
    language: "English",
    priceInRupees: 199,
    isFree: false,
    topics: "",
    expectations: "",
    published: true,
    isFeatured: false,
  });

  // Question Form State
  const [questionForm, setQuestionForm] = useState({
    text: "",
    codeSnippet: "",
    topic: "",
    marks: 4,
    negativeMarks: 1,
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOptionId: "A" as "A" | "B" | "C" | "D",
    explanation: "",
  });

  // Series Form State
  const [seriesForm, setSeriesForm] = useState({
    title: "",
    slug: "",
    categoryId: "cat-competitive",
    categoryName: "Competitive Exams",
    targetAudience: "",
    description: "",
    includedTestsCount: 5,
    priceInRupees: 999,
    originalPriceInRupees: 1999,
    discountPercentage: 50,
    published: true,
  });

  // Category Form State
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
    iconName: "Target",
    description: "",
    testCount: 0,
  });

  // Initial load
  useEffect(() => {
    const isAuthed = checkAdminSession();
    setIsAuthenticated(isAuthed);
    setCheckingAuth(false);

    if (isAuthed) {
      loadData();
    }
  }, []);

  const loadData = () => {
    const loadedTests = loadAllAdminTests();
    const loadedSeries = loadAllAdminSeries();
    const loadedCats = loadAllAdminCategories();

    setTests(loadedTests);
    setSeriesList(loadedSeries);
    setCategories(loadedCats);

    if (loadedTests.length > 0 && !selectedTestSlug) {
      setSelectedTestSlug(loadedTests[0].slug);
      setActiveQuestions(loadQuestionsForTest(loadedTests[0].slug));
    }
  };

  // Handle Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    setTimeout(() => {
      if (
        loginEmail.trim().toLowerCase() === ADMIN_CREDENTIALS.email.toLowerCase() &&
        loginPassword === ADMIN_CREDENTIALS.password
      ) {
        setAdminSession(true);
        setIsAuthenticated(true);
        loadData();
        showToast("Authenticated as Super Administrator");
      } else {
        setLoginError("Invalid administrator credentials. Access denied.");
      }
      setIsLoggingIn(false);
    }, 400);
  };

  // Handle Logout
  const handleAdminLogout = () => {
    setAdminSession(false);
    setIsAuthenticated(false);
    setLoginPassword("");
  };

  // Switch questions when test slug changes
  const handleSelectTest = (slug: string) => {
    setSelectedTestSlug(slug);
    setActiveQuestions(loadQuestionsForTest(slug));
  };

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.slug.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.categoryName.toLowerCase().includes(testSearch.toLowerCase());
      const matchesCat = testCategoryFilter === "all" || t.categoryId === testCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [tests, testSearch, testCategoryFilter]);

  // Open Create Test Modal
  const openCreateTestModal = () => {
    setEditingTestSlug(null);
    setTestForm({
      title: "",
      slug: "",
      categoryId: categories[0]?.id || "cat-competitive",
      categoryName: categories[0]?.name || "Competitive Exams",
      targetAudience: "Aspirants preparing for competitive assessments",
      description: "Comprehensive mock test with timed interface and standard marking scheme.",
      questionCount: 25,
      durationMinutes: 60,
      maxMarks: 100,
      difficulty: "Intermediate",
      language: "English",
      priceInRupees: 199,
      isFree: false,
      topics: "Physics, Chemistry, Mathematics",
      expectations: "Timed Exam Simulation, Instant Scorecard",
      published: true,
      isFeatured: false,
    });
    setShowTestModal(true);
  };

  // Open Edit Test Modal
  const openEditTestModal = (test: MockTest) => {
    setEditingTestSlug(test.slug);
    setTestForm({
      title: test.title,
      slug: test.slug,
      categoryId: test.categoryId,
      categoryName: test.categoryName,
      targetAudience: test.targetAudience,
      description: test.description,
      questionCount: test.questionCount,
      durationMinutes: test.durationMinutes,
      maxMarks: test.maxMarks,
      difficulty: test.difficulty,
      language: test.language,
      priceInRupees: Math.round(test.priceInPaise / 100),
      isFree: Boolean(test.isFree),
      topics: test.topics.join(", "),
      expectations: test.expectations.join(", "),
      published: test.published,
      isFeatured: Boolean(test.isFeatured),
    });
    setShowTestModal(true);
  };

  // Save Test (Create or Update)
  const handleSaveTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testForm.title.trim()) return;

    const derivedSlug =
      testForm.slug.trim() ||
      testForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const categoryObj = categories.find((c) => c.id === testForm.categoryId);

    const newTest: MockTest = {
      id: editingTestSlug ? tests.find((t) => t.slug === editingTestSlug)?.id || `test-${Date.now()}` : `test-${Date.now()}`,
      title: testForm.title.trim(),
      slug: derivedSlug,
      categoryId: testForm.categoryId,
      categoryName: categoryObj?.name || testForm.categoryName,
      targetAudience: testForm.targetAudience.trim(),
      description: testForm.description.trim(),
      questionCount: Number(testForm.questionCount),
      durationMinutes: Number(testForm.durationMinutes),
      maxMarks: Number(testForm.maxMarks),
      difficulty: testForm.difficulty,
      language: testForm.language,
      priceInPaise: testForm.isFree ? 0 : Number(testForm.priceInRupees) * 100,
      isFree: testForm.isFree,
      topics: testForm.topics.split(",").map((s) => s.trim()).filter(Boolean),
      expectations: testForm.expectations.split(",").map((s) => s.trim()).filter(Boolean),
      published: testForm.published,
      isFeatured: testForm.isFeatured,
      createdAt: new Date().toISOString(),
    };

    let updatedList: MockTest[];
    if (editingTestSlug) {
      updatedList = tests.map((t) => (t.slug === editingTestSlug ? newTest : t));
      showToast(`Updated test: "${newTest.title}"`);
    } else {
      updatedList = [newTest, ...tests];
      showToast(`Created new test: "${newTest.title}"`);
    }

    setTests(updatedList);
    saveAdminTests(updatedList);
    setShowTestModal(false);
  };

  // Delete Test
  const handleDeleteTest = (slug: string) => {
    if (confirm(`Are you sure you want to remove test "${slug}"?`)) {
      const updated = tests.filter((t) => t.slug !== slug);
      setTests(updated);
      saveAdminTests(updated);
      showToast(`Removed test: ${slug}`);
    }
  };

  // Add Question to Selected Test
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.text.trim() || !selectedTestSlug) return;

    const newQ: TestQuestion = {
      id: `q-${Date.now()}`,
      questionNumber: activeQuestions.length + 1,
      text: questionForm.text.trim(),
      codeSnippet: questionForm.codeSnippet.trim() || undefined,
      options: [
        { id: "A", text: questionForm.optionA.trim() || "Option A" },
        { id: "B", text: questionForm.optionB.trim() || "Option B" },
        { id: "C", text: questionForm.optionC.trim() || "Option C" },
        { id: "D", text: questionForm.optionD.trim() || "Option D" },
      ],
      correctOptionId: questionForm.correctOptionId,
      marks: Number(questionForm.marks),
      negativeMarks: Number(questionForm.negativeMarks),
      topic: questionForm.topic.trim() || "General Syllabus",
      explanation: questionForm.explanation.trim() || "Official answer key explanation.",
    };

    const updated = [...activeQuestions, newQ];
    setActiveQuestions(updated);
    saveQuestionsForTest(selectedTestSlug, updated);
    setShowQuestionModal(false);
    showToast(`Added Question #${newQ.questionNumber} to ${selectedTestSlug}`);

    // Reset form
    setQuestionForm({
      text: "",
      codeSnippet: "",
      topic: "",
      marks: 4,
      negativeMarks: 1,
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOptionId: "A",
      explanation: "",
    });
  };

  // Delete Question
  const handleDeleteQuestion = (qId: string) => {
    if (!selectedTestSlug) return;
    const updated = activeQuestions.filter((q) => q.id !== qId);
    setActiveQuestions(updated);
    saveQuestionsForTest(selectedTestSlug, updated);
    showToast("Deleted question from bank");
  };

  // Save Test Series
  const handleSaveSeries = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesForm.title.trim()) return;

    const derivedSlug =
      seriesForm.slug.trim() ||
      seriesForm.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const cat = categories.find((c) => c.id === seriesForm.categoryId);

    const newSeries: TestSeries = {
      id: `series-${Date.now()}`,
      slug: derivedSlug,
      title: seriesForm.title.trim(),
      categoryId: seriesForm.categoryId,
      categoryName: cat?.name || seriesForm.categoryName,
      targetAudience: seriesForm.targetAudience.trim(),
      description: seriesForm.description.trim(),
      includedTestsCount: Number(seriesForm.includedTestsCount),
      priceInPaise: Number(seriesForm.priceInRupees) * 100,
      originalPriceInPaise: Number(seriesForm.originalPriceInRupees) * 100,
      discountPercentage: Number(seriesForm.discountPercentage),
      published: seriesForm.published,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSeries, ...seriesList];
    setSeriesList(updated);
    saveAdminSeries(updated);
    setShowSeriesModal(false);
    showToast(`Created Test Series: "${newSeries.title}"`);
  };

  // Delete Series
  const handleDeleteSeries = (slug: string) => {
    if (confirm(`Remove test series bundle "${slug}"?`)) {
      const updated = seriesList.filter((s) => s.slug !== slug);
      setSeriesList(updated);
      saveAdminSeries(updated);
      showToast(`Removed test series bundle`);
    }
  };

  // Save Category
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;

    const derivedSlug =
      categoryForm.slug.trim() ||
      categoryForm.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: categoryForm.name.trim(),
      slug: derivedSlug,
      iconName: categoryForm.iconName || "Target",
      description: categoryForm.description.trim() || "Curriculum assessments and practice simulations.",
      testCount: 0,
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    saveAdminCategories(updated);
    setShowCategoryModal(false);
    showToast(`Added category: "${newCat.name}"`);
  };

  // If checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 1. ADMIN LOGIN VIEW (Gated)
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-900">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-lg shadow-indigo-500/10">
              <ShieldCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              TestOrbit Executive Admin
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Curriculum, examination questions & marketplace management portal
            </p>
          </div>

          <div className="mt-8 bg-slate-800/90 py-8 px-6 border border-slate-700/80 rounded-2xl sm:px-10 shadow-2xl backdrop-blur-md">
            {loginError && (
              <div
                className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 mb-5"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleAdminLogin}>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Administrator Email
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="admin@ellipse.com"
                  className="block w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Executive Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="block w-full px-3.5 py-2.5 pr-10 bg-slate-900/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isLoggingIn ? "Verifying Credentials..." : "Authenticate as Admin"}</span>
                </button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-700/80 text-center">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
              >
                Return to Public Website
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. ADMIN PORTAL (Authenticated)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-[calc(100vh-140px)] bg-slate-900 text-slate-100 py-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Executive Header */}
        <div className="p-6 bg-slate-800/80 border border-slate-700/80 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  TestOrbit Executive Management
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Logged in as: <strong className="text-slate-200">{ADMIN_CREDENTIALS.email}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-2 bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>View Live Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleAdminLogout}
              className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-700 space-x-2 sm:space-x-4 overflow-x-auto text-sm pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab("tests")}
            className={`px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "tests"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Mock Tests
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-900 text-slate-300">
              {tests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "questions"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Question Bank
          </button>

          <button
            onClick={() => setActiveTab("series")}
            className={`px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "series"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            Test Series
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-900 text-slate-300">
              {seriesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2.5 rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "categories"
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Tag className="w-4 h-4" />
            Categories
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-900 text-slate-300">
              {categories.length}
            </span>
          </button>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-800/90 border border-slate-700/80 rounded-xl shadow-lg">
                <span className="text-xs font-medium text-slate-400">Total Mock Tests</span>
                <div className="mt-2 text-2xl font-bold text-white">{tests.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">Available across all streams</p>
              </div>

              <div className="p-5 bg-slate-800/90 border border-slate-700/80 rounded-xl shadow-lg">
                <span className="text-xs font-medium text-slate-400">Curated Test Series</span>
                <div className="mt-2 text-2xl font-bold text-white">{seriesList.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">Multi-test bundles</p>
              </div>

              <div className="p-5 bg-slate-800/90 border border-slate-700/80 rounded-xl shadow-lg">
                <span className="text-xs font-medium text-slate-400">Active Categories</span>
                <div className="mt-2 text-2xl font-bold text-white">{categories.length}</div>
                <p className="text-[11px] text-slate-400 mt-1">Curriculum segments</p>
              </div>

              <div className="p-5 bg-slate-800/90 border border-slate-700/80 rounded-xl shadow-lg">
                <span className="text-xs font-medium text-slate-400">Published Tests</span>
                <div className="mt-2 text-2xl font-bold text-emerald-400">
                  {tests.filter((t) => t.published).length}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Active in live marketplace</p>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-6 bg-slate-800/70 border border-slate-700/80 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Administrative Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={openCreateTestModal}
                  className="p-4 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                      + Create Mock Test
                    </span>
                    <Plus className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Add a timed simulation paper with custom syllabus and marking scheme.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("questions");
                    setShowQuestionModal(true);
                  }}
                  className="p-4 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                      + Add Question
                    </span>
                    <HelpCircle className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Append new multiple-choice questions with options and explanations.
                  </p>
                </button>

                <button
                  onClick={() => setShowSeriesModal(true)}
                  className="p-4 bg-slate-700/60 hover:bg-slate-700 border border-slate-600 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white group-hover:text-indigo-300">
                      + Create Test Series
                    </span>
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Bundle multiple tests into discounted exam series packs.
                  </p>
                </button>
              </div>
            </div>

            {/* Recent Mock Tests Snapshot */}
            <div className="p-6 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Live Mock Tests Snapshot</h3>
                <button
                  onClick={() => setActiveTab("tests")}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  View All ({tests.length}) →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Questions</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {tests.slice(0, 6).map((t) => (
                      <tr key={t.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-semibold text-white">{t.title}</td>
                        <td className="px-4 py-3">{t.categoryName}</td>
                        <td className="px-4 py-3">{t.durationMinutes} mins</td>
                        <td className="px-4 py-3">{t.questionCount} Qs</td>
                        <td className="px-4 py-3 font-medium">
                          {t.isFree ? (
                            <span className="text-emerald-400">FREE</span>
                          ) : (
                            `₹${t.priceInPaise / 100}`
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.published
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-700 text-slate-400"
                            }`}
                          >
                            {t.published ? "Published" : "Draft"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: MOCK TESTS MANAGEMENT */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "tests" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search tests by title, topic..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <select
                  value={testCategoryFilter}
                  onChange={(e) => setTestCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={openCreateTestModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Create Mock Test</span>
              </button>
            </div>

            {/* Tests Table */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Mock Test</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Duration & Marks</th>
                      <th className="px-4 py-3">Difficulty</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {filteredTests.map((test) => (
                      <tr key={test.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{test.title}</div>
                          <div className="text-[10px] text-slate-400">/{test.slug}</div>
                        </td>
                        <td className="px-4 py-3">{test.categoryName}</td>
                        <td className="px-4 py-3">
                          <div>{test.durationMinutes} mins • {test.questionCount} Qs</div>
                          <div className="text-[10px] text-slate-400">Max: {test.maxMarks} marks</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-[10px] font-medium">
                            {test.difficulty}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {test.isFree ? (
                            <span className="text-emerald-400">FREE</span>
                          ) : (
                            `₹${test.priceInPaise / 100}`
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              test.published
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-slate-700 text-slate-400"
                            }`}
                          >
                            {test.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                handleSelectTest(test.slug);
                                setActiveTab("questions");
                              }}
                              title="Manage Questions"
                              className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditTestModal(test)}
                              title="Edit Test Details"
                              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTest(test.slug)}
                              title="Delete Test"
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: QUESTION BANK */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
              <div className="flex items-center gap-3 flex-1">
                <label className="text-xs text-slate-400 font-medium shrink-0">
                  Select Mock Test:
                </label>
                <select
                  value={selectedTestSlug}
                  onChange={(e) => handleSelectTest(e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-md w-full"
                >
                  {tests.map((t) => (
                    <option key={t.id} value={t.slug}>
                      {t.title} ({t.categoryName})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowQuestionModal(true)}
                disabled={!selectedTestSlug}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question to Test</span>
              </button>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {activeQuestions.length} questions for <strong>{selectedTestSlug}</strong>
                </span>
              </div>

              {activeQuestions.length > 0 ? (
                activeQuestions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-xl shadow-md space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                            Topic: {q.topic}
                          </span>
                          <span className="text-xs text-emerald-400 font-medium">
                            +{q.marks} Marks {q.negativeMarks ? `/ -${q.negativeMarks}` : ""}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white pt-1">{q.text}</h4>
                      </div>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-slate-400 hover:text-rose-400 p-1.5 hover:bg-rose-950/30 rounded-md transition-colors cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {q.codeSnippet && (
                      <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-indigo-300 overflow-x-auto border border-slate-700">
                        {q.codeSnippet}
                      </pre>
                    )}

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {q.options.map((opt) => {
                        const isCorrect = opt.id === q.correctOptionId;
                        return (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-lg text-xs border flex items-center gap-2 ${
                              isCorrect
                                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold"
                                : "bg-slate-900/60 border-slate-700 text-slate-300"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-md font-bold text-[10px] flex items-center justify-center shrink-0 ${
                                isCorrect ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span>{opt.text}</span>
                            {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-700/60">
                        <strong className="text-slate-300">Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-10 bg-slate-800/40 border border-slate-700 rounded-2xl text-center space-y-3">
                  <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    No custom questions loaded for this test. Click &ldquo;Add Question to Test&rdquo; to populate the question bank.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 4: TEST SERIES BUNDLES */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "series" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Test Series Bundles</h3>
                <p className="text-xs text-slate-400">Manage multi-exam packs and pricing</p>
              </div>

              <button
                onClick={() => setShowSeriesModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Create Test Series</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seriesList.map((series) => (
                <div
                  key={series.id}
                  className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-xl shadow-lg space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {series.categoryName}
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        ₹{series.priceInPaise / 100}
                        {series.originalPriceInPaise && (
                          <span className="text-slate-400 line-through ml-1 text-[11px]">
                            ₹{series.originalPriceInPaise / 100}
                          </span>
                        )}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{series.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{series.description}</p>
                    <div className="text-[11px] text-indigo-400 font-medium">
                      Includes {series.includedTestsCount} full tests • {series.discountPercentage || 0}% discount
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">/{series.slug}</span>
                    <button
                      onClick={() => handleDeleteSeries(series.slug)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 5: CATEGORIES */}
        {/* ------------------------------------------------------------------ */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Curriculum Categories</h3>
                <p className="text-xs text-slate-400">Manage academic streams and departments</p>
              </div>

              <button
                onClick={() => setShowCategoryModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{cat.name}</span>
                    <span className="text-[10px] bg-indigo-900/60 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded-full font-bold">
                      {cat.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{cat.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT MOCK TEST */}
      {/* -------------------------------------------------------------------- */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 my-8 text-xs text-slate-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white">
                {editingTestSlug ? "Edit Mock Test" : "Create New Mock Test"}
              </h3>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Test Title *</label>
                  <input
                    type="text"
                    required
                    value={testForm.title}
                    onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                    placeholder="e.g. JEE Main Chemistry Full Syllabus Mock 2026"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Slug (URL path)</label>
                  <input
                    type="text"
                    value={testForm.slug}
                    onChange={(e) => setTestForm({ ...testForm, slug: e.target.value })}
                    placeholder="auto-generated from title"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={testForm.categoryId}
                    onChange={(e) => setTestForm({ ...testForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={testForm.durationMinutes}
                    onChange={(e) => setTestForm({ ...testForm, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Question Count</label>
                  <input
                    type="number"
                    required
                    value={testForm.questionCount}
                    onChange={(e) => setTestForm({ ...testForm, questionCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Max Marks</label>
                  <input
                    type="number"
                    required
                    value={testForm.maxMarks}
                    onChange={(e) => setTestForm({ ...testForm, maxMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Difficulty</label>
                  <select
                    value={testForm.difficulty}
                    onChange={(e) => setTestForm({ ...testForm, difficulty: e.target.value as DifficultyLevel })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Price (INR ₹)</label>
                  <input
                    type="number"
                    disabled={testForm.isFree}
                    value={testForm.priceInRupees}
                    onChange={(e) => setTestForm({ ...testForm, priceInRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white disabled:opacity-40"
                  />
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testForm.isFree}
                      onChange={(e) => setTestForm({ ...testForm, isFree: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Free Test</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testForm.published}
                      onChange={(e) => setTestForm({ ...testForm, published: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Published</span>
                  </label>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Topics (comma-separated)</label>
                  <input
                    type="text"
                    value={testForm.topics}
                    onChange={(e) => setTestForm({ ...testForm, topics: e.target.value })}
                    placeholder="Physical Chemistry, Organic Reactions, Atomic Structure"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={testForm.description}
                    onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg cursor-pointer shadow-md"
                >
                  {editingTestSlug ? "Save Changes" : "Create Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: ADD QUESTION */}
      {/* -------------------------------------------------------------------- */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 my-8 text-xs text-slate-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white">Add Question to: {selectedTestSlug}</h3>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Question Text *</label>
                <textarea
                  rows={2}
                  required
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                  placeholder="What is the time complexity of searching in a balanced BST?"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Code Snippet (Optional)</label>
                <textarea
                  rows={2}
                  value={questionForm.codeSnippet}
                  onChange={(e) => setQuestionForm({ ...questionForm, codeSnippet: e.target.value })}
                  placeholder="def binary_search(arr, x): ..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-indigo-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Topic</label>
                  <input
                    type="text"
                    value={questionForm.topic}
                    onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                    placeholder="Data Structures"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Correct Answer</label>
                  <select
                    value={questionForm.correctOptionId}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctOptionId: e.target.value as "A" | "B" | "C" | "D" })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold text-emerald-400"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>
              </div>

              {/* Options Inputs */}
              <div className="space-y-2">
                <label className="block text-slate-400 font-medium">Multiple Choice Options</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-bold text-slate-400 text-center">A:</span>
                    <input
                      type="text"
                      required
                      value={questionForm.optionA}
                      onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                      placeholder="Option A text"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-bold text-slate-400 text-center">B:</span>
                    <input
                      type="text"
                      required
                      value={questionForm.optionB}
                      onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                      placeholder="Option B text"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-bold text-slate-400 text-center">C:</span>
                    <input
                      type="text"
                      required
                      value={questionForm.optionC}
                      onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                      placeholder="Option C text"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="w-6 font-bold text-slate-400 text-center">D:</span>
                    <input
                      type="text"
                      required
                      value={questionForm.optionD}
                      onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                      placeholder="Option D text"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Explanation (Answer Key)</label>
                <textarea
                  rows={2}
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                  placeholder="Detailed rationale for the correct answer..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg cursor-pointer shadow-md"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: CREATE TEST SERIES */}
      {/* -------------------------------------------------------------------- */}
      {showSeriesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 my-8 text-xs text-slate-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white">Create Test Series Bundle</h3>
              <button
                onClick={() => setShowSeriesModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeries} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Series Title *</label>
                <input
                  type="text"
                  required
                  value={seriesForm.title}
                  onChange={(e) => setSeriesForm({ ...seriesForm, title: e.target.value })}
                  placeholder="e.g. NEET UG 2026 High-Yield Mock Series"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={seriesForm.categoryId}
                    onChange={(e) => setSeriesForm({ ...seriesForm, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Included Tests</label>
                  <input
                    type="number"
                    required
                    value={seriesForm.includedTestsCount}
                    onChange={(e) => setSeriesForm({ ...seriesForm, includedTestsCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={seriesForm.priceInRupees}
                    onChange={(e) => setSeriesForm({ ...seriesForm, priceInRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Original (₹)</label>
                  <input
                    type="number"
                    value={seriesForm.originalPriceInRupees}
                    onChange={(e) => setSeriesForm({ ...seriesForm, originalPriceInRupees: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Discount %</label>
                  <input
                    type="number"
                    value={seriesForm.discountPercentage}
                    onChange={(e) => setSeriesForm({ ...seriesForm, discountPercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={seriesForm.description}
                  onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowSeriesModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg cursor-pointer shadow-md"
                >
                  Create Series
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL: ADD CATEGORY */}
      {/* -------------------------------------------------------------------- */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 my-8 text-xs text-slate-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-bold text-white">Add Curriculum Category</h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Civil Services & UPSC"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Curriculum overview..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg cursor-pointer shadow-md"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
