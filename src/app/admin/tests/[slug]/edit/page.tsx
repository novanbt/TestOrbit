"use client";

import React, { useState, useEffect, use } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge } from "@/components/admin/StudioUI";
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
  const [isFree, setIsFree] = useState(false);
  const [priceInPaise, setPriceInPaise] = useState(19900);
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [published, setPublished] = useState(true);
  const [topics, setTopics] = useState("");
  const [instructions, setInstructions] = useState("");

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
          setMaxMarks(found.maxMarks);
          setIsFree(Boolean(found.isFree || found.priceInPaise === 0));
          setPriceInPaise(found.priceInPaise || 0);
          setDescription(found.description || "");
          setTargetAudience(found.targetAudience || "");
          setPublished(found.published);
          setTopics(found.topics?.join(", ") || "");
          setInstructions(found.expectations?.[0] || "");

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
      language: "English",
      priceInPaise: isFree ? 0 : priceInPaise,
      isFree,
      topics: topics.split(",").map((t) => t.trim()).filter(Boolean),
      expectations: instructions ? [instructions] : [],
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
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-5">
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
      )}

      {/* TAB 2: Questions Editor */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Assigned Questions ({questions.length})
            </span>
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
    </div>
  );
}
