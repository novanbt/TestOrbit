"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  HelpCircle,
  Plus,
  Search,
  Upload,
  Download,
  Filter,
  CheckCircle,
  Trash2,
  Edit2,
  Copy,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { getAllQuestionBankItems } from "@/lib/admin/adminDataService";
import { saveQuestionItemAction } from "@/app/actions/adminStudioActions";
import { QuestionBankItem } from "@/types/admin";

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");

  // Modal State for Manual Creation / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);

  // Form State
  const [qText, setQText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correctOption, setCorrectOption] = useState<"A" | "B" | "C" | "D">("A");
  const [topic, setTopic] = useState("General");
  const [marks, setMarks] = useState(4);
  const [negativeMarks, setNegativeMarks] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await getAllQuestionBankItems();
      setQuestions(data);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Distinct Topics
  const allTopics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set).sort();
  }, [questions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchText = q.text.toLowerCase().includes(query);
        const matchTopic = q.topic?.toLowerCase().includes(query);
        if (!matchText && !matchTopic) return false;
      }
      if (selectedTopic !== "all" && q.topic !== selectedTopic) {
        return false;
      }
      return true;
    });
  }, [questions, searchQuery, selectedTopic]);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setQText("");
    setOptA("Option A statement");
    setOptB("Option B statement");
    setOptC("Option C statement");
    setOptD("Option D statement");
    setCorrectOption("A");
    setTopic("General");
    setMarks(4);
    setNegativeMarks(1);
    setExplanation("");
    setModalOpen(true);
  };

  const openEditModal = (q: QuestionBankItem) => {
    setEditingQuestion(q);
    setQText(q.text);
    setOptA(q.options.find((o) => o.id === "A")?.text || "");
    setOptB(q.options.find((o) => o.id === "B")?.text || "");
    setOptC(q.options.find((o) => o.id === "C")?.text || "");
    setOptD(q.options.find((o) => o.id === "D")?.text || "");
    setCorrectOption(q.correctOptionId);
    setTopic(q.topic || "General");
    setMarks(q.marks || 4);
    setNegativeMarks(q.negativeMarks || 1);
    setExplanation(q.explanation || "");
    setModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    setSaving(true);
    const itemToSave: QuestionBankItem = {
      id: editingQuestion?.id || "q_" + Date.now().toString(36),
      questionNumber: editingQuestion?.questionNumber || questions.length + 1,
      text: qText.trim(),
      options: [
        { id: "A", text: optA },
        { id: "B", text: optB },
        { id: "C", text: optC },
        { id: "D", text: optD },
      ],
      correctOptionId: correctOption,
      marks,
      negativeMarks,
      topic: topic.trim(),
      explanation: explanation.trim(),
      status: "approved",
      createdAt: editingQuestion?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await saveQuestionItemAction(itemToSave);
    if (res.success) {
      if (editingQuestion) {
        setQuestions((prev) => prev.map((q) => (q.id === itemToSave.id ? itemToSave : q)));
        showFeedback("success", "Question updated in Question Bank.");
      } else {
        setQuestions((prev) => [itemToSave, ...prev]);
        showFeedback("success", "New question added to Question Bank.");
      }
      setModalOpen(false);
    } else {
      showFeedback("error", res.error || "Failed to save question.");
    }
    setSaving(false);
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `testorbit_question_bank_${Date.now()}.json`);
    dlAnchor.click();
    showFeedback("success", `Exported ${questions.length} questions to JSON.`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Central Question Bank ({questions.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate reusable MCQ questions, topics, answer keys, and grading specifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Export JSON</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Create Question</span>
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search statements, explanations, topics..."
              className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
            />
          </div>

          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">All Topics ({allTopics.length})</option>
            {allTopics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading question bank...</p>
          </div>
        ) : filteredQuestions.length === 0 ? (
          <StudioEmptyState
            icon={HelpCircle}
            title="No questions found in this view"
            description="Add your first question manually or export/import a JSON set."
            action={
              <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs">
                Create First Question
              </Button>
            }
          />
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition-colors space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    ID: {q.id}
                  </span>
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {q.topic}
                  </span>
                  <span className="text-xs text-slate-400">
                    +{q.marks} / -{q.negativeMarks || 0} marks
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(q)}
                    className="h-7 px-2 text-xs text-slate-600 hover:text-indigo-600"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    <span>Edit</span>
                  </Button>
                </div>
              </div>

              {/* Statement */}
              <p className="text-xs font-bold text-slate-900 leading-relaxed">
                {q.text}
              </p>

              {/* Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      opt.id === q.correctOptionId
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 font-semibold"
                        : "bg-slate-50/50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <span>
                      <strong>{opt.id}.</strong> {opt.text}
                    </span>
                    {opt.id === q.correctOptionId && (
                      <span className="text-[10px] uppercase font-bold text-emerald-700">
                        Correct Key
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {q.explanation && (
                <div className="text-[11px] text-slate-500 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                  <span className="font-semibold text-slate-700">Explanation: </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Manual Creation / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingQuestion ? "Edit Question" : "Create Question in Bank"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Question Statement *</label>
                <textarea
                  rows={3}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter question text here..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Option A</label>
                  <input
                    type="text"
                    required
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Option B</label>
                  <input
                    type="text"
                    required
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Option C</label>
                  <input
                    type="text"
                    required
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Option D</label>
                  <input
                    type="text"
                    required
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Correct Option</label>
                  <select
                    value={correctOption}
                    onChange={(e) => setCorrectOption(e.target.value as "A" | "B" | "C" | "D")}
                    className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-emerald-700 cursor-pointer"
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Topic</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Marks</label>
                  <input
                    type="number"
                    step="0.5"
                    value={marks}
                    onChange={(e) => setMarks(parseFloat(e.target.value) || 1)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Negative Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(parseFloat(e.target.value) || 0)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Detailed Explanation</label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Rationale or derivation of the correct answer..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save to Question Bank"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
