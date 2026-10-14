"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  BookOpen,
  Eye,
  Upload,
  Globe,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge } from "@/components/admin/StudioUI";
import { BulkQuestionImportModal } from "@/components/admin/BulkQuestionImportModal";
import { CATEGORIES } from "@/data/categories";
import { saveMockTestAction, saveQuestionsForTestAction } from "@/app/actions/adminStudioActions";
import { fetchCanonicalTestBySlug, fetchCanonicalQuestionsForTest } from "@/lib/data/testService";
import { MockTest, TestQuestion, DifficultyLevel } from "@/types";

export default function EditTestPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug: routeSlug } = use(params);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"details" | "questions" | "review">("details");

  // Form State
  const [testId, setTestId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("cat-competitive");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediate");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxMarks, setMaxMarks] = useState(100);
  const [language, setLanguage] = useState("English");
  const [isFree, setIsFree] = useState(false);
  const [priceInPaise, setPriceInPaise] = useState(19900);
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [published, setPublished] = useState(true);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [expectations, setExpectations] = useState<string[]>([
    "Standard CBT evaluation. Each correct response carries designated marks; negative marking applies as configured.",
  ]);

  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadTest() {
      try {
        const found = await fetchCanonicalTestBySlug(routeSlug, false);
        if (found) {
          setTestId(found.id);
          setTitle(found.title);
          setSlug(found.slug);
          setCategoryId(found.categoryId);
          setDifficulty(found.difficulty);
          setDurationMinutes(found.durationMinutes);
          setMaxMarks(found.maxMarks || 100);
          setLanguage(found.language || "English");
          setIsFree(Boolean(found.isFree || found.priceInPaise === 0));
          setPriceInPaise(found.priceInPaise || 0);
          setDescription(found.description || "");
          setTargetAudience(found.targetAudience || "");
          setPublished(found.published);
          const loadedTopics = Array.isArray(found.topics) ? found.topics : [];
          setTopics(loadedTopics);
          setTopicInput(loadedTopics.join(", "));
          if (Array.isArray(found.expectations) && found.expectations.length > 0) {
            setExpectations(found.expectations);
          } else {
            setExpectations([
              "Standard CBT evaluation. Each correct response carries designated marks; negative marking applies as configured.",
            ]);
          }

          const qList = await fetchCanonicalQuestionsForTest(found.slug, found);
          setQuestions(qList);
        } else {
          setErrorMsg(`Mock test "${routeSlug}" not found in catalogue.`);
        }
      } catch (err) {
        setErrorMsg("Failed to load test details.");
      } finally {
        setLoading(false);
      }
    }
    loadTest();
  }, [routeSlug]);

  // Question Management
  const handleAddQuestion = () => {
    const qNum = questions.length + 1;
    const newQ: TestQuestion = {
      id: "q-" + Date.now().toString(36),
      questionNumber: qNum,
      text: `Question ${qNum}: Statement here...`,
      options: [
        { id: "A", text: "Option A" },
        { id: "B", text: "Option B" },
        { id: "C", text: "Option C" },
        { id: "D", text: "Option D" },
      ],
      correctOptionId: "A",
      marks: 4,
      negativeMarks: 1,
      topic: "General",
      explanation: "Explanation goes here.",
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated.map((q, i) => ({ ...q, questionNumber: i + 1 })));
  };

  const handleUpdateQuestion = (idx: number, field: keyof TestQuestion, val: unknown) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: val } : q))
    );
  };

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importBannerMsg, setImportBannerMsg] = useState<string | null>(null);

  const handleBulkImport = (importedQuestions: TestQuestion[], mode: "append" | "replace") => {
    if (mode === "replace") {
      const formatted = importedQuestions.map((q, i) => ({ ...q, questionNumber: i + 1 }));
      setQuestions(formatted);
      setImportBannerMsg(`Successfully replaced questions with ${formatted.length} imported questions.`);
    } else {
      const combined = [...questions, ...importedQuestions].map((q, i) => ({ ...q, questionNumber: i + 1 }));
      setQuestions(combined);
      setImportBannerMsg(`Successfully imported and appended ${importedQuestions.length} questions (Total: ${combined.length}).`);
    }
    setTimeout(() => {
      setImportBannerMsg(null);
    }, 8000);
  };

  const handleSave = async (isPublishedOverride?: boolean) => {
    if (!title.trim() || !slug.trim()) {
      setErrorMsg("Title and slug are mandatory.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const effectivePublished =
      isPublishedOverride !== undefined ? isPublishedOverride : published;

    const catObj = CATEGORIES.find((c) => c.id === categoryId);

    const effectiveTopics = Array.from(
      new Set(
        topicInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      )
    );

    const effectiveExpectations = expectations
      .map((e) => e.trim())
      .filter(Boolean);

    const updatedTest: MockTest = {
      id: testId || "test-" + Date.now().toString(36),
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      categoryId,
      categoryName: catObj?.name || "Competitive Exams",
      targetAudience: targetAudience.trim() || undefined,
      description: description.trim() || "Standardized curriculum assessment.",
      questionCount: questions.length,
      durationMinutes,
      maxMarks,
      difficulty,
      language: language.trim() || "English",
      priceInPaise: isFree ? 0 : priceInPaise,
      isFree,
      topics: effectiveTopics.length > 0 ? effectiveTopics : ["General Assessment"],
      expectations:
        effectiveExpectations.length > 0
          ? effectiveExpectations
          : [
              "Standard CBT evaluation. Each correct response carries designated marks; negative marking applies as configured.",
            ],
      published: effectivePublished,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const resTest = await saveMockTestAction(updatedTest);
      if (!resTest.success) {
        setErrorMsg(resTest.error || "Failed to update test.");
        setSaving(false);
        return;
      }

      await saveQuestionsForTestAction(updatedTest.slug, questions);

      setPublished(effectivePublished);
      setSuccessMsg("Test and question bank updated successfully!");
      setSaving(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading test workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <Link href="/admin/tests">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Edit: {title}
              </h1>
              <StudioBadge variant={published ? "published" : "draft"} size="sm">
                {published ? "Published" : "Draft"}
              </StudioBadge>
            </div>
            <p className="text-xs text-slate-500">
              /tests/{slug} • {questions.length} Questions configured
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/tests/${slug}`} target="_blank">
            <Button variant="outline" size="sm" className="text-xs">
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>Preview</span>
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            disabled={saving}
            onClick={() => handleSave()}
            className="text-xs"
          >
            {saving ? "Saving Changes..." : "Save Test"}
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "details"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          1. Metadata & Settings
        </button>
        <button
          onClick={() => setActiveTab("questions")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "questions"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          2. Questions ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab("review")}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === "review"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          3. Publication Status
        </button>
      </div>

      {/* TAB 1: Details */}
      {activeTab === "details" && (
        <div className="space-y-6">
          {/* Card 1: Metadata & Settings */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Metadata & Core Settings</h2>
                <p className="text-[11px] text-slate-500">
                  Configure title, classification, timing, language, and scoring specifications.
                </p>
              </div>
              <StudioBadge variant="info">Configuration</StudioBadge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Test Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">URL Slug *</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category *</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="360"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Total Marks (Max Marks) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Total Marks (Max Marks) *</label>
                <input
                  type="number"
                  min="1"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
                  placeholder="100"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Examination Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Examination Language *</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Bilingual (English & Hindi)">Bilingual (English & Hindi)</option>
                  <option value="Bengali">Bengali</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Telugu">Telugu</option>
                  <option value="Marathi">Marathi</option>
                  <option value="Gujarati">Gujarati</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Access Pricing</label>
                <div className="flex items-center gap-4 h-10">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="accessType"
                      checked={isFree}
                      onChange={() => setIsFree(true)}
                      className="text-indigo-600"
                    />
                    <span>Free</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="accessType"
                      checked={!isFree}
                      onChange={() => setIsFree(false)}
                      className="text-indigo-600"
                    />
                    <span>Paid (₹{(priceInPaise / 100).toFixed(0)})</span>
                  </label>
                </div>
              </div>

              {!isFree && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Price in INR (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={priceInPaise / 100}
                    onChange={(e) => setPriceInPaise((parseInt(e.target.value) || 0) * 100)}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g. CBSE Class 10 students"
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Curriculum Syllabus & Learner Expectations */}
          <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Curriculum Syllabus & Learner Expectations</h2>
                <p className="text-[11px] text-slate-500">
                  Define topics covered in the syllabus and expectations/instructions shown to students on the storefront.
                </p>
              </div>
              <StudioBadge variant="neutral">Curriculum</StudioBadge>
            </div>

            {/* Syllabus & Topics Covered */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-bold text-slate-800">
                  Syllabus & Topics Covered
                </label>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Enter chapters or syllabus topics covered in this test (separated by commas). These will appear as bullet items under &quot;Syllabus & Topics Covered&quot; on the public assessment overview page.
              </p>

              <textarea
                rows={3}
                value={topicInput}
                onChange={(e) => {
                  setTopicInput(e.target.value);
                  setTopics(e.target.value.split(",").map(t => t.trim()).filter(Boolean));
                }}
                placeholder="e.g. Light: Reflection and Refraction, Electricity, Magnetic Effects of Electric Current, Human Eye and Colourful World"
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
              />

              {/* Topic Tag Chips Live Preview */}
              {topics.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Active Syllabus Topics ({topics.length} items):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = topics.filter((_, i) => i !== idx);
                            setTopics(updated);
                            setTopicInput(updated.join(", "));
                          }}
                          className="text-indigo-400 hover:text-indigo-700 font-bold ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* What You Can Expect */}
            <div className="space-y-3 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <label className="text-xs font-bold text-slate-800">
                    What You Can Expect (Key Pointers)
                  </label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setExpectations([...expectations, ""])}
                  className="text-[11px] h-7 px-2.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50/50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  <span>Add Expectation Pointer</span>
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Each pointer appears with a green checkmark icon in the &quot;What You Can Expect&quot; card of the test overview page.
              </p>

              <div className="space-y-2.5">
                {expectations.map((exp, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-2" />
                    <textarea
                      rows={2}
                      value={exp}
                      onChange={(e) => {
                        const updated = [...expectations];
                        updated[idx] = e.target.value;
                        setExpectations(updated);
                      }}
                      placeholder="e.g. Standard CBT evaluation. Each correct response carries designated marks; negative marking applies as configured."
                      className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none resize-none"
                    />
                    {expectations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setExpectations(expectations.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors mt-1"
                        title="Delete pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab("questions")}
              className="text-xs"
            >
              Continue to Questions ({questions.length}) →
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: Questions Editor */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Questions ({questions.length})
              </span>
              <p className="text-[11px] text-slate-500">
                Author items manually or bulk import questions via CSV or JSON.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsImportModalOpen(true)}
                className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50/50"
              >
                <Upload className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                <span>Bulk Import Questions</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                className="text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Add Question</span>
              </Button>
            </div>
          </div>

          {importBannerMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importBannerMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setImportBannerMsg(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-0.5 rounded hover:bg-emerald-100/50"
              >
                Dismiss
              </button>
            </div>
          )}

          {questions.length > 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Quick Scoring Calibration:</span>
                <span className="text-[11px] text-slate-500">
                  Total Questions Marks:{" "}
                  <strong className="text-slate-900">
                    {questions.reduce((sum, q) => sum + (q.marks || 0), 0)} Marks
                  </strong>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 mr-1">Batch Negative Marks:</span>
                <button
                  type="button"
                  onClick={() => {
                    setQuestions((prev) => prev.map((q) => ({ ...q, negativeMarks: 0 })));
                  }}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-md text-slate-700 shadow-2xs cursor-pointer"
                >
                  No Penalty (0)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuestions((prev) =>
                      prev.map((q) => ({
                        ...q,
                        negativeMarks: Number(((q.marks || 4) * 0.25).toFixed(2)),
                      }))
                    );
                  }}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-indigo-200 hover:bg-indigo-50/50 rounded-md text-indigo-700 shadow-2xs cursor-pointer"
                >
                  25% of Marks
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuestions((prev) => prev.map((q) => ({ ...q, negativeMarks: 0.5 })));
                  }}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-md text-slate-700 shadow-2xs cursor-pointer"
                >
                  -0.5M
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuestions((prev) => prev.map((q) => ({ ...q, negativeMarks: 1 })));
                  }}
                  className="px-2 py-1 text-[11px] font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-md text-slate-700 shadow-2xs cursor-pointer"
                >
                  -1M
                </button>
              </div>
            </div>
          )}

          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Question #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(idx)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Question Statement</label>
                <textarea
                  rows={2}
                  value={q.text}
                  onChange={(e) => handleUpdateQuestion(idx, "text", e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt, optIdx) => (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Option {opt.id}</span>
                      <label className="flex items-center gap-1 cursor-pointer text-indigo-600">
                        <input
                          type="radio"
                          name={`correct-${idx}`}
                          checked={q.correctOptionId === opt.id}
                          onChange={() => handleUpdateQuestion(idx, "correctOptionId", opt.id)}
                          className="text-indigo-600"
                        />
                        <span>Correct</span>
                      </label>
                    </div>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => {
                        const updatedOpts = [...q.options];
                        updatedOpts[optIdx] = { ...opt, text: e.target.value };
                        handleUpdateQuestion(idx, "options", updatedOpts);
                      }}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Topic</label>
                  <input
                    type="text"
                    value={q.topic}
                    onChange={(e) => handleUpdateQuestion(idx, "topic", e.target.value)}
                    className="w-full h-8.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={q.marks}
                    onChange={(e) => handleUpdateQuestion(idx, "marks", parseFloat(e.target.value) || 1)}
                    className="w-full h-8.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Negative Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={q.negativeMarks !== undefined ? q.negativeMarks : 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      handleUpdateQuestion(idx, "negativeMarks", isNaN(val) ? 0 : Math.abs(val));
                    }}
                    className="w-full h-8.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-semibold text-slate-600">Detailed Explanation</label>
                <textarea
                  rows={2}
                  value={q.explanation}
                  onChange={(e) => handleUpdateQuestion(idx, "explanation", e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Review & Publish State */}
      {activeTab === "review" && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Lifecycle & Publication Status
          </h3>

          <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Publication State</span>
                <span className="text-slate-500">
                  {published
                    ? "Currently published and visible to learners on the storefront."
                    : "Draft mode: Not visible in the public catalogue."}
                </span>
              </div>
              <Button
                variant={published ? "outline" : "primary"}
                size="sm"
                onClick={() => handleSave(!published)}
                className="text-xs"
              >
                {published ? "Unpublish (Move to Draft)" : "Publish Live"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Question Import Modal */}
      <BulkQuestionImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBulkImport}
        existingQuestionsCount={questions.length}
      />
    </div>
  );
}
