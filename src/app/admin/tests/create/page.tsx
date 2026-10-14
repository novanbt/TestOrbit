"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Plus,
  Trash2,
  AlertCircle,
  Save,
  BookOpen,
  Eye,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge } from "@/components/admin/StudioUI";
import { BulkQuestionImportModal } from "@/components/admin/BulkQuestionImportModal";
import { CATEGORIES } from "@/data/categories";
import { saveMockTestAction, saveQuestionsForTestAction } from "@/app/actions/adminStudioActions";
import { MockTest, TestQuestion, DifficultyLevel } from "@/types";

export default function CreateTestPage() {
  const router = useRouter();

  // Wizard Tab: "details" | "questions" | "review"
  const [activeTab, setActiveTab] = useState<"details" | "questions" | "review">("details");

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("cat-competitive");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediate");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [maxMarks, setMaxMarks] = useState(100);
  const [isFree, setIsFree] = useState(false);
  const [priceInPaise, setPriceInPaise] = useState(19900); // ₹199
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [topics, setTopics] = useState("Algebra, Mechanics, Chemical Bonding");
  const [instructions, setInstructions] = useState(
    "Standard CBT evaluation. Each correct response carries designated marks; negative marking applies as configured."
  );

  // Questions for this test
  const [questions, setQuestions] = useState<TestQuestion[]>([
    {
      id: "q-1",
      questionNumber: 1,
      text: "Sample Question 1: What is the primary SI unit of electrical current?",
      options: [
        { id: "A", text: "Ampere" },
        { id: "B", text: "Volt" },
        { id: "C", text: "Ohm" },
        { id: "D", text: "Coulomb" },
      ],
      correctOptionId: "A",
      marks: 4,
      negativeMarks: 1,
      topic: "General Physics",
      explanation: "The ampere (symbol: A) is the base unit of electric current in the International System of Units (SI).",
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generated);
    }
  };

  // Add question to test
  const handleAddQuestion = () => {
    const qNum = questions.length + 1;
    const newQ: TestQuestion = {
      id: "q-" + Date.now().toString(36),
      questionNumber: qNum,
      text: `Question ${qNum}: Enter question statement here...`,
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
      explanation: "Provide reference explanation or formula derivation here.",
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
    // Auto-clear banner after 8 seconds
    setTimeout(() => {
      setImportBannerMsg(null);
    }, 8000);
  };

  const handleSave = async (publishImmediate: boolean) => {
    if (!title.trim() || !slug.trim()) {
      setErrorMsg("Test title and slug are mandatory.");
      setActiveTab("details");
      return;
    }

    if (questions.length === 0) {
      setErrorMsg("A test must contain at least 1 question before it can be created.");
      setActiveTab("questions");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    const catObj = CATEGORIES.find((c) => c.id === categoryId);

    const newTest: MockTest = {
      id: "test-" + Date.now().toString(36),
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
      language: "English",
      priceInPaise: isFree ? 0 : priceInPaise,
      isFree,
      topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
      expectations: [instructions],
      published: publishImmediate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const resTest = await saveMockTestAction(newTest);
      if (!resTest.success) {
        setErrorMsg(resTest.error || "Failed to save test.");
        setSaving(false);
        return;
      }

      // Save questions to test_questions
      await saveQuestionsForTestAction(newTest.slug, questions);

      router.push("/admin/tests");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      setSaving(false);
    }
  };

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
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Create New Mock Test
            </h1>
            <p className="text-xs text-slate-500">
              Configure curriculum metadata, question bank, scoring model, and publication.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => handleSave(false)}
            className="text-xs"
          >
            Save Draft
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={saving}
            onClick={() => handleSave(true)}
            className="text-xs"
          >
            {saving ? "Publishing..." : "Publish Test Live"}
          </Button>
        </div>
      </div>

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
          1. Test Details & Metadata
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
          3. Scoring & Review
        </button>
      </div>

      {/* TAB 1: Test Details */}
      {activeTab === "details" && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Test Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g., Class 12 Chemistry Board Mock Simulation"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">URL Slug *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="class-12-chemistry-board-mock"
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Access Type & Price</label>
              <div className="flex items-center gap-4 h-10">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="accessType"
                    checked={isFree}
                    onChange={() => setIsFree(true)}
                    className="text-indigo-600"
                  />
                  <span>Free Assessment</span>
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
                placeholder="e.g., CBSE Class 12 Science aspirants & JEE UG candidates"
                className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive overview of exam pattern, chapters covered, and difficulty breakdown."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab("questions")}
              className="text-xs"
            >
              Continue to Questions →
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
                Test Question Bank ({questions.length} Items)
              </span>
              <p className="text-[11px] text-slate-500">
                Author items manually or use bulk import to load questions via CSV or JSON.
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
                <span>Add Another Question</span>
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

          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Question #{idx + 1}
                </span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Question Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Question Statement</label>
                <textarea
                  rows={2}
                  value={q.text}
                  onChange={(e) => handleUpdateQuestion(idx, "text", e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Options */}
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
                        <span>Correct Answer</span>
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

              {/* Explanation & Scoring */}
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
                    value={q.negativeMarks || 0}
                    onChange={(e) => handleUpdateQuestion(idx, "negativeMarks", parseFloat(e.target.value) || 0)}
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
                  placeholder="Shown to learners upon test completion and review."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>
            </div>
          ))}

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("details")}
              className="text-xs"
            >
              ← Back to Details
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveTab("review")}
              className="text-xs"
            >
              Continue to Review →
            </Button>
          </div>
        </div>
      )}

      {/* TAB 3: Scoring & Review */}
      {activeTab === "review" && (
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Summary & Final Verification
          </h3>

          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Title:</span>
              <span className="font-semibold text-slate-900">{title || "(Untitled)"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Slug:</span>
              <span className="font-mono text-indigo-600">/tests/{slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Question Count:</span>
              <span className="font-semibold text-slate-900">{questions.length} questions</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Duration:</span>
              <span className="font-semibold text-slate-900">{durationMinutes} mins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pricing:</span>
              <span className="font-semibold text-emerald-700">
                {isFree ? "Free Assessment" : `₹${(priceInPaise / 100).toFixed(0)}`}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab("questions")}
              className="text-xs"
            >
              ← Back to Questions
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => handleSave(false)}
                className="text-xs"
              >
                Save as Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving}
                onClick={() => handleSave(true)}
                className="text-xs"
              >
                {saving ? "Publishing..." : "Publish Test Live"}
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
