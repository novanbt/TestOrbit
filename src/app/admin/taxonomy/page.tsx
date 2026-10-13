"use client";

import React, { useState, useEffect } from "react";
import { Tag, Plus, CheckCircle, BookOpen, Layers, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchCanonicalTaxonomy, SubjectTaxonomy } from "@/lib/data/taxonomyService";
import { fetchCanonicalCategories } from "@/lib/data/categoryService";
import { saveSubjectAction, deleteSubjectAction } from "@/app/actions/adminStudioActions";
import { Category } from "@/types";

export default function TaxonomyPage() {
  const [subjects, setSubjects] = useState<SubjectTaxonomy[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("cat-competitive");
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [taxList, catList] = await Promise.all([
        fetchCanonicalTaxonomy(),
        fetchCanonicalCategories(),
      ]);
      setSubjects(taxList);
      setCategories(catList);
      if (catList.length > 0) {
        setSelectedCatId(catList[0].id);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newSub: SubjectTaxonomy = {
      id: "sub-" + Date.now().toString(36),
      name: newSubjectName.trim(),
      slug: newSubjectName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      categoryId: selectedCatId,
      topics: [],
    };

    const res = await saveSubjectAction(newSub);
    if (res.success && res.data) {
      setSubjects((prev) => [...prev, res.data!]);
      setNewSubjectName("");
      setFeedback(`Added subject "${newSub.name}".`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteSubject = async (sub: SubjectTaxonomy) => {
    if (!window.confirm(`Delete subject "${sub.name}"?`)) return;
    const res = await deleteSubjectAction(sub.id);
    if (res.success) {
      setSubjects((prev) => prev.filter((s) => s.id !== sub.id));
      setFeedback(`Deleted subject "${sub.name}".`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleAddTopic = async (subjectId: string) => {
    const topicVal = newTopicInputs[subjectId]?.trim();
    if (!topicVal) return;

    const targetSub = subjects.find((s) => s.id === subjectId);
    if (!targetSub || targetSub.topics.includes(topicVal)) return;

    const updatedSub: SubjectTaxonomy = {
      ...targetSub,
      topics: [...targetSub.topics, topicVal],
    };

    const res = await saveSubjectAction(updatedSub);
    if (res.success) {
      setSubjects((prev) => prev.map((s) => (s.id === subjectId ? updatedSub : s)));
      setNewTopicInputs((prev) => ({ ...prev, [subjectId]: "" }));
    }
  };

  const handleRemoveTopic = async (subjectId: string, topicVal: string) => {
    const targetSub = subjects.find((s) => s.id === subjectId);
    if (!targetSub) return;

    const updatedSub: SubjectTaxonomy = {
      ...targetSub,
      topics: targetSub.topics.filter((t: string) => t !== topicVal),
    };

    const res = await saveSubjectAction(updatedSub);
    if (res.success) {
      setSubjects((prev) => prev.map((s) => (s.id === subjectId ? updatedSub : s)));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Subjects & Topic Taxonomy
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Map curriculum subjects and nested topics for question bank tagging and analytics.
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Add Subject Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="New Subject Name (e.g., Biology, Artificial Intelligence)..."
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            className="flex-1 h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
          />
          <select
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="primary" size="sm" className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add Subject</span>
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading taxonomy...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200/80 rounded-2xl p-6">
          <Tag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No subjects registered</h3>
          <p className="text-xs text-slate-500 mt-1">Add your first subject using the field above.</p>
        </div>
      ) : (
        /* Subjects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((sub) => {
            const cat = categories.find((c) => c.id === sub.categoryId);

            return (
              <div
                key={sub.id}
                className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{sub.name}</h3>
                      <span className="text-[11px] text-slate-400">
                        Category: {cat?.name || "General"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {sub.topics.length} Topics
                      </span>
                      <button
                        onClick={() => handleDeleteSubject(sub)}
                        title="Delete subject"
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Topics Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-3">
                    {sub.topics.map((t: string) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                      >
                        <span>{t}</span>
                        <button
                          onClick={() => handleRemoveTopic(sub.id, t)}
                          className="hover:text-rose-600 text-slate-400 font-bold ml-0.5"
                          title="Remove topic"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    {sub.topics.length === 0 && (
                      <span className="text-xs text-slate-400 italic">No topics added yet.</span>
                    )}
                  </div>
                </div>

                {/* Add Topic Input */}
                <div className="pt-2 flex gap-2 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Add topic..."
                    value={newTopicInputs[sub.id] || ""}
                    onChange={(e) =>
                      setNewTopicInputs({ ...newTopicInputs, [sub.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTopic(sub.id);
                      }
                    }}
                    className="flex-1 h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTopic(sub.id)}
                    className="h-8 text-xs px-2.5"
                  >
                    Add
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
