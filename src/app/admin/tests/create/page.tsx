"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Sparkles,
  BookOpen,
  Plus,
  X,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { MockTest, DifficultyLevel, Category } from "@/types";
import { saveAdminTest, getAdminCategories, getAdminTestBySlug } from "@/lib/admin/adminStore";
import { saveTestServerAction } from "@/app/actions/testActions";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDuration } from "@/lib/utils";

export default function CreateTestPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>(["Class 10", "CBSE", "Board Exam"]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questionCount, setQuestionCount] = useState(25);
  const [maxMarks, setMaxMarks] = useState(100);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediate");
  const [language, setLanguage] = useState("English");
  const [priceInRupees, setPriceInRupees] = useState(299);
  const [isFree, setIsFree] = useState(false);
  const [published, setPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Topics & Expectations Arrays
  const [topics, setTopics] = useState<string[]>(["Core Concepts", "Problem Solving"]);
  const [newTopic, setNewTopic] = useState("");
  const [expectations, setExpectations] = useState<string[]>([
    "Timed CBT exam simulation",
    "Instant scorecard with answer explanations",
  ]);
  const [newExpectation, setNewExpectation] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const cats = getAdminCategories();
    setCategories(cats);
    if (cats.length > 0) {
      setCategoryId(cats[0].id);
    }
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generated);
  };

  const handleAddTag = (tagToAdd?: string) => {
    const val = (tagToAdd || tagInput).trim().replace(/^#/, "");
    if (!val) return;
    if (!tags.some((t) => t.toLowerCase() === val.toLowerCase())) {
      setTags([...tags, val]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleAddExpectation = () => {
    if (newExpectation.trim() && !expectations.includes(newExpectation.trim())) {
      setExpectations([...expectations, newExpectation.trim()]);
      setNewExpectation("");
    }
  };

  const handleRemoveExpectation = (index: number) => {
    setExpectations(expectations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim()) {
      setErrorMessage("Please enter a test title.");
      return;
    }

    const cleanSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (getAdminTestBySlug(cleanSlug)) {
      setErrorMessage(`A mock test with slug "${cleanSlug}" already exists. Please choose a unique slug.`);
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);
    const categoryName = selectedCat ? selectedCat.name : "Competitive Exams";

    setIsSubmitting(true);

    const newTest: MockTest = {
      id: "test-" + Date.now().toString(36),
      slug: cleanSlug,
      title: title.trim(),
      categoryId: categoryId || "cat-competitive",
      categoryName,
      tags: tags.length > 0 ? tags : ["General"],
      targetAudience: tags.join(", ") || "All Students",
      description: description.trim() || `Full mock examination simulation for ${title.trim()}.`,
      questionCount: Number(questionCount) || 20,
      durationMinutes: Number(durationMinutes) || 60,
      maxMarks: Number(maxMarks) || 100,
      difficulty,
      language,
      priceInPaise: isFree ? 0 : Math.round(priceInRupees * 100),
      isFree,
      topics: topics.length > 0 ? topics : ["General Syllabus"],
      expectations: expectations.length > 0 ? expectations : ["Standard marking scheme", "Detailed solutions"],
      published,
      isFeatured,
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      // 1. Immediately store in local admin store so questions page finds it with zero delay
      saveAdminTest(newTest);

      // 2. Persist to server / Firestore
      const result = await saveTestServerAction(newTest);
      if (!result.success) {
        console.warn("[createTest] Server action notice:", result.error);
      }

      // 3. Redirect directly to questions builder for the new test!
      router.push(`/admin/tests/${cleanSlug}/questions`);
    } catch (err: unknown) {
      console.warn("[createTest] Server persistence error:", err);
      // Since it is saved locally in saveAdminTest, proceed to questions editor
      router.push(`/admin/tests/${cleanSlug}/questions`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Breadcrumbs & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/tests"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Mock Tests
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Create New Mock Test
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure examination structure, duration, marking keys, and syllabus expectations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/tests">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save & Add Questions</span>
          </Button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. Main Grid Layout: Form (Left 2 cols) & Live Preview (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          {/* Card 1: General Details */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              1. General Information
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mock Test Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., JEE Main Physics Full Syllabus Mock Exam 2026"
                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-slate-400 font-mono">
                    /tests/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="jee-main-physics-mock"
                    className="block w-full pl-16 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Curriculum Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Search & Discovery Tags
                </label>
                <span className="text-[11px] text-slate-400">Press Enter or comma to add</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 min-h-[46px] bg-slate-50/50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-indigo-900 ml-0.5 cursor-pointer text-indigo-400 hover:text-indigo-700"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? "Type tag (e.g. CBSE, Class 10, JEE) and press Enter..." : "Add more tags..."}
                  className="flex-1 min-w-[140px] bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none py-1"
                />
                {tagInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleAddTag()}
                    className="px-2 py-1 rounded bg-indigo-600 text-white text-xs font-medium cursor-pointer"
                  >
                    Add
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-slate-400">Popular:</span>
                {["Class 10", "Class 12", "CBSE", "JEE Main", "NEET", "Board Exam", "Mathematics", "Science", "PYQ"].map(
                  (suggested) => (
                    <button
                      key={suggested}
                      type="button"
                      onClick={() => handleAddTag(suggested)}
                      disabled={tags.some((t) => t.toLowerCase() === suggested.toLowerCase())}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      +{suggested}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Test Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed overview of syllabus coverage, question types, and simulation environment..."
                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Card 2: Examination Settings */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              2. Examination Parameters
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Mins)
                </label>
                <input
                  type="number"
                  min={5}
                  max={360}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Questions
                </label>
                <input
                  type="number"
                  min={1}
                  max={300}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Marks
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card 3: Pricing & Access */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              3. Pricing & Marketplace Access
            </h3>

            <div className="flex items-center gap-6">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Free Practice Test</span>
              </label>

              {!isFree && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Price (INR ₹):</span>
                  <input
                    type="number"
                    min={1}
                    value={priceInRupees}
                    onChange={(e) => setPriceInRupees(Number(e.target.value))}
                    className="w-28 px-3 py-1.5 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] text-slate-400">
                    ({Math.round(priceInRupees * 100)} paise)
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-6 border-t border-slate-100">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Published to Marketplace</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Feature on Homepage</span>
              </label>
            </div>
          </div>

          {/* Card 4: Topics & Expectations */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              4. Topics & Syllabus Highlights
            </h3>

            {/* Topics Tag Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Covered Topics
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {topics.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTopic())}
                  placeholder="Add a syllabus topic and press enter..."
                  className="flex-1 px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddTopic} className="text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
            </div>

            {/* Expectations List */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                What Students Can Expect
              </label>
              <div className="space-y-1.5 mb-2">
                {expectations.map((exp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{exp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpectation(idx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExpectation}
                  onChange={(e) => setNewExpectation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExpectation())}
                  placeholder="e.g., Sectional timer and real exam negative marking..."
                  className="flex-1 px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddExpectation} className="text-xs">
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Right Column: Live Marketplace Card Preview */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
          <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Live Card Preview
              </span>
              <span className="text-[10px] text-slate-400">Marketplace View</span>
            </div>

            {/* Test Card Simulation */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  {categories.find((c) => c.id === categoryId)?.name || "Competitive Exams"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  difficulty === "Beginner"
                    ? "bg-emerald-50 text-emerald-700"
                    : difficulty === "Intermediate"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-purple-50 text-purple-700"
                }`}>
                  {difficulty}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                {title || "Untitled Mock Test"}
              </h4>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                  {tags.length > 3 && (
                    <span className="text-[10px] text-slate-400 self-center">+{tags.length - 3}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{durationMinutes}m</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>{questionCount} MCQs</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Enrollment</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {isFree ? "Free" : `₹${priceInRupees}`}
                  </span>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Start Test
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full gap-2 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Save & Add Questions</span>
              </Button>
              <p className="text-[11px] text-slate-400 text-center">
                Saving will take you directly to the Question Bank editor for this test.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
