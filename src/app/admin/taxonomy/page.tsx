"use client";

import React, { useState } from "react";
import { Tag, Plus, CheckCircle, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/data/categories";

interface SubjectItem {
  id: string;
  name: string;
  categoryId: string;
  topics: string[];
}

const INITIAL_SUBJECTS: SubjectItem[] = [
  {
    id: "sub-1",
    name: "Mathematics",
    categoryId: "cat-school",
    topics: ["Algebra", "Trigonometry", "Calculus", "Coordinate Geometry", "Statistics"],
  },
  {
    id: "sub-2",
    name: "Physics",
    categoryId: "cat-competitive",
    topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics"],
  },
  {
    id: "sub-3",
    name: "Chemistry",
    categoryId: "cat-competitive",
    topics: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Equilibrium"],
  },
  {
    id: "sub-4",
    name: "Computer Science",
    categoryId: "cat-programming",
    topics: ["Data Structures", "Algorithms", "Object-Oriented Programming", "Databases", "Web Architecture"],
  },
];

export default function TaxonomyPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>(INITIAL_SUBJECTS);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("cat-competitive");
  const [newTopicInputs, setNewTopicInputs] = useState<Record<string, string>>({});

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newSub: SubjectItem = {
      id: "sub-" + Date.now().toString(36),
      name: newSubjectName.trim(),
      categoryId: selectedCatId,
      topics: [],
    };
    setSubjects([...subjects, newSub]);
    setNewSubjectName("");
  };

  const handleAddTopic = (subjectId: string) => {
    const topicVal = newTopicInputs[subjectId]?.trim();
    if (!topicVal) return;

    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId && !s.topics.includes(topicVal)
          ? { ...s, topics: [...s.topics, topicVal] }
          : s
      )
    );
    setNewTopicInputs((prev) => ({ ...prev, [subjectId]: "" }));
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
            {CATEGORIES.map((c) => (
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

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {subjects.map((sub) => {
          const cat = CATEGORIES.find((c) => c.id === sub.categoryId);

          return (
            <div
              key={sub.id}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{sub.name}</h3>
                  <span className="text-[11px] text-slate-400">
                    Category: {cat?.name || "General"}
                  </span>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {sub.topics.length} Topics
                </span>
              </div>

              {/* Topics Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sub.topics.map((t) => (
                  <span
                    key={t}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
                  >
                    {t}
                  </span>
                ))}
              </div>

              {/* Add Topic Input */}
              <div className="pt-2 flex gap-2">
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
    </div>
  );
}
