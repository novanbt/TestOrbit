"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  PlusCircle,
  Edit,
  Trash2,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
  Eye,
  Check,
  Code2,
  Sparkles,
  BookOpen,
  Award,
} from "lucide-react";
import { MockTest, TestQuestion, QuestionOption } from "@/types";
import {
  getAdminTestBySlug,
  getAdminTestQuestions,
  saveAdminTestQuestion,
  deleteAdminTestQuestion,
} from "@/lib/admin/adminStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function TestQuestionsManagerPage() {
  const params = useParams();
  const slugParam = (params?.slug as string) || "";

  const [test, setTest] = useState<MockTest | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [selectedTopicFilter, setSelectedTopicFilter] = useState("all");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State for Adding / Editing Question
  const [questionText, setQuestionText] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctOptionId, setCorrectOptionId] = useState<"A" | "B" | "C" | "D">("A");
  const [marks, setMarks] = useState(2);
  const [negativeMarks, setNegativeMarks] = useState(0.5);
  const [topic, setTopic] = useState("");
  const [explanation, setExplanation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const t = getAdminTestBySlug(slugParam);
    if (t) {
      setTest(t);
      const qList = getAdminTestQuestions(slugParam);
      setQuestions(qList);
      if (t.topics && t.topics.length > 0 && !topic) {
        setTopic(t.topics[0]);
      }
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("testorbit_admin_data_updated", handleUpdate);
    return () => window.removeEventListener("testorbit_admin_data_updated", handleUpdate);
  }, [slugParam]);

  // Unique topics across existing questions
  const availableTopics = Array.from(
    new Set([...(test?.topics || []), ...questions.map((q) => q.topic).filter(Boolean)])
  );

  const handleStartEdit = (q: TestQuestion) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.text);
    setCodeSnippet(q.codeSnippet || "");
    const a = q.options.find((o) => o.id === "A")?.text || "";
    const b = q.options.find((o) => o.id === "B")?.text || "";
    const c = q.options.find((o) => o.id === "C")?.text || "";
    const d = q.options.find((o) => o.id === "D")?.text || "";
    setOptA(a);
    setOptB(b);
    setOptC(c);
    setOptD(d);
    setCorrectOptionId(q.correctOptionId);
    setMarks(q.marks);
    setNegativeMarks(q.negativeMarks || 0);
    setTopic(q.topic);
    setExplanation(q.explanation);
    setFormError(null);

    // Smooth scroll to editor
    editorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleResetForm = () => {
    setEditingQuestionId(null);
    setQuestionText("");
    setCodeSnippet("");
    setOptA("");
    setOptB("");
    setOptC("");
    setOptD("");
    setCorrectOptionId("A");
    setMarks(2);
    setNegativeMarks(0.5);
    setExplanation("");
    setFormError(null);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!questionText.trim()) {
      setFormError("Question text is required.");
      return;
    }
    if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      setFormError("All 4 options (A, B, C, D) are required.");
      return;
    }

    const questionOptions: QuestionOption[] = [
      { id: "A", text: optA.trim() },
      { id: "B", text: optB.trim() },
      { id: "C", text: optC.trim() },
      { id: "D", text: optD.trim() },
    ];

    const qId = editingQuestionId || `q-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const qNumber = editingQuestionId
      ? questions.find((q) => q.id === editingQuestionId)?.questionNumber || questions.length + 1
      : questions.length + 1;

    const newQuestion: TestQuestion = {
      id: qId,
      questionNumber: qNumber,
      text: questionText.trim(),
      codeSnippet: codeSnippet.trim() ? codeSnippet.trim() : undefined,
      options: questionOptions,
      correctOptionId,
      marks: Number(marks) || 2,
      negativeMarks: Number(negativeMarks) || 0,
      topic: topic.trim() || test?.topics?.[0] || "General",
      explanation: explanation.trim() || "Option " + correctOptionId + " is the correct answer based on syllabus specifications.",
    };

    saveAdminTestQuestion(slugParam, newQuestion);
    setSuccessMessage(editingQuestionId ? "Question updated successfully!" : "New question added to bank!");
    setTimeout(() => setSuccessMessage(null), 3000);

    handleResetForm();
  };

  const handleDelete = (questionId: string) => {
    deleteAdminTestQuestion(slugParam, questionId);
    setDeleteConfirmId(null);
    setSuccessMessage("Question removed from bank.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const filteredQuestions = questions.filter((q) => {
    if (selectedTopicFilter !== "all" && q.topic !== selectedTopicFilter) {
      return false;
    }
    return true;
  });

  if (!test) {
    return (
      <div className="py-12 text-center text-slate-500">
        <p>Loading question bank for {slugParam}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/tests"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Mock Tests
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Question Bank: {test.title}
            </h1>
            <Badge variant="primary" size="sm">
              {questions.length} MCQs
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Category: <strong className="text-slate-700">{test.categoryName}</strong> • Duration: {test.durationMinutes} mins • Max Marks: {test.maxMarks}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/tests/${slugParam}/take`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" />
              Preview Exam Simulator
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              handleResetForm();
              editorRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="gap-1.5 shadow-xs text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Question
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Questions Stats & Topic Filter */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span>Filter by Topic:</span>
          <select
            value={selectedTopicFilter}
            onChange={(e) => setSelectedTopicFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">All Topics ({questions.length})</option>
            {availableTopics.map((top) => (
              <option key={top} value={top}>
                {top}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filteredQuestions.length}</strong> questions
        </div>
      </div>

      {/* 3. Question Bank List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 bg-white border border-slate-200/80 rounded-2xl text-center space-y-3">
            <FileQuestion className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              No questions found for this test
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use the question builder below to start authoring questions with multiple choice options and answer keys.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q.id}
              className={`p-6 bg-white border rounded-2xl shadow-xs transition-colors space-y-4 ${
                editingQuestionId === q.id ? "border-indigo-500 ring-2 ring-indigo-50" : "border-slate-200/80"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    Q{q.questionNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                    {q.topic}
                  </span>
                  <span className="text-xs text-slate-500">
                    +{q.marks} Marks {q.negativeMarks ? `(-${q.negativeMarks})` : "(No negative)"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartEdit(q)}
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </Button>

                  {deleteConfirmId === q.id ? (
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(q.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                {q.text}
              </div>

              {/* Code Snippet if present */}
              {q.codeSnippet && (
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto">
                  <code>{q.codeSnippet}</code>
                </pre>
              )}

              {/* Options 2x2 Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt) => {
                  const isCorrect = opt.id === q.correctOptionId;
                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                        isCorrect
                          ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium"
                          : "bg-slate-50/50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {isCorrect && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Box */}
              {q.explanation && (
                <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs text-indigo-950 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold text-indigo-900">Answer Explanation:</strong>{" "}
                    <span className="text-slate-700">{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 4. Dedicated Question Editor Form (Add or Edit) */}
      <div
        ref={editorRef}
        className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingQuestionId ? "Edit Question" : "Add New Question to Bank"}
              </h3>
              <p className="text-xs text-slate-500">
                Fill in question statement, 4 choices, mark the correct answer, and provide detailed solution keys.
              </p>
            </div>
          </div>

          {editingQuestionId && (
            <Button variant="outline" size="sm" onClick={handleResetForm} className="text-xs">
              Cancel Edit
            </Button>
          )}
        </div>

        {formError && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSaveQuestion} className="space-y-5">
          {/* Row 1: Topic, Marks, Negative Marks */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Topic / Subject Area *
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Thermodynamics, Variables, Mechanics"
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marks for Correct Answer *
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="20"
                required
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Negative Marks for Incorrect
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="10"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Row 2: Question Statement */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Question Statement *
            </label>
            <textarea
              rows={3}
              required
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="State the problem clearly, including parameters, formulas, or scenario context..."
              className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Row 3: Optional Code Snippet */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Optional Code / Math Expression Block</span>
            </label>
            <textarea
              rows={2}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="// Optional code snippet or mathematical equation..."
              className="block w-full px-3.5 py-2.5 bg-slate-900 text-emerald-300 font-mono border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Row 4: 4 Options Inputs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Answer Choices (A, B, C, D) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">Option A</span>
                <input
                  type="text"
                  required
                  value={optA}
                  onChange={(e) => setOptA(e.target.value)}
                  placeholder="Choice A text..."
                  className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Option B */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">Option B</span>
                <input
                  type="text"
                  required
                  value={optB}
                  onChange={(e) => setOptB(e.target.value)}
                  placeholder="Choice B text..."
                  className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Option C */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">Option C</span>
                <input
                  type="text"
                  required
                  value={optC}
                  onChange={(e) => setOptC(e.target.value)}
                  placeholder="Choice C text..."
                  className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Option D */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 block mb-1">Option D</span>
                <input
                  type="text"
                  required
                  value={optD}
                  onChange={(e) => setOptD(e.target.value)}
                  placeholder="Choice D text..."
                  className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Correct Option Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Mark Correct Option *
            </label>
            <div className="grid grid-cols-4 gap-3 max-w-md">
              {(["A", "B", "C", "D"] as const).map((optKey) => {
                const isSelected = correctOptionId === optKey;
                return (
                  <button
                    key={optKey}
                    type="button"
                    onClick={() => setCorrectOptionId(optKey)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>Option {optKey}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 6: Explanation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Detailed Solution & Explanation
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain step-by-step why the marked option is correct, including standard theorems or common traps to avoid..."
              className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center gap-3">
            <Button type="submit" variant="primary" size="md" className="gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingQuestionId ? "Update Question" : "Save Question to Bank"}</span>
            </Button>
            {editingQuestionId && (
              <Button type="button" variant="outline" size="md" onClick={handleResetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
