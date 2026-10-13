"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { getAllAssignments } from "@/lib/admin/adminDataService";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { saveAssignmentAction, deleteAssignmentAction } from "@/app/actions/adminStudioActions";
import { Assignment } from "@/types/admin";
import { MockTest } from "@/types";
import { CATEGORIES } from "@/data/categories";

export default function AssignmentsAdminPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("cat-school");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priceInPaise, setPriceInPaise] = useState(0);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [asgList, tList] = await Promise.all([
        getAllAssignments(),
        fetchCanonicalTests(),
      ]);
      setAssignments(asgList);
      setAvailableTests(tList);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const openCreateModal = () => {
    setEditingAssignment(null);
    setTitle("");
    setSlug("");
    setDescription("Chapter-wise practice assignment pack.");
    setCategoryId("cat-school");
    setSelectedTests(availableTests.slice(0, 2).map((t) => t.id));
    setPriceInPaise(0);
    setPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (asg: Assignment) => {
    setEditingAssignment(asg);
    setTitle(asg.title);
    setSlug(asg.slug);
    setDescription(asg.description);
    setCategoryId(asg.categoryId);
    setSelectedTests(asg.includedTestIds);
    setPriceInPaise(asg.priceInPaise || 0);
    setPublished(asg.published);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    setSaving(true);
    const cat = CATEGORIES.find((c) => c.id === categoryId);

    const asgToSave: Assignment = {
      id: editingAssignment?.id || "asg_" + Date.now().toString(36),
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      description: description.trim(),
      categoryId,
      categoryName: cat?.name || "School Education",
      includedTestIds: selectedTests,
      priceInPaise,
      isFree: priceInPaise === 0,
      published,
      createdAt: editingAssignment?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await saveAssignmentAction(asgToSave);
    if (res.success) {
      if (editingAssignment) {
        setAssignments((prev) => prev.map((a) => (a.id === asgToSave.id ? asgToSave : a)));
        showFeedback("success", `Updated assignment "${asgToSave.title}".`);
      } else {
        setAssignments((prev) => [asgToSave, ...prev]);
        showFeedback("success", `Created assignment "${asgToSave.title}".`);
      }
      setModalOpen(false);
    } else {
      showFeedback("error", res.error || "Failed to save assignment.");
    }
    setSaving(false);
  };

  const handleDeleteAssignment = async (asg: Assignment) => {
    if (!window.confirm(`Delete assignment "${asg.title}"?`)) return;
    const res = await deleteAssignmentAction(asg.id);
    if (res.success) {
      setAssignments((prev) => prev.filter((item) => item.id !== asg.id));
      showFeedback("success", `Deleted assignment "${asg.title}".`);
    } else {
      showFeedback("error", res.error || "Failed to delete assignment.");
    }
  };

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Assignments & Curated Packs ({assignments.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Curate chapter-wise assignments, practice drills, and course homework packs.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Curate New Assignment</span>
        </Button>
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-20 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading assignments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full">
            <StudioEmptyState
              icon={FileCheck}
              title="No assignment packs created yet"
              description="Group multiple mock tests into a sequence for classroom or self-paced practice."
              action={
                <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs">
                  Create First Assignment
                </Button>
              }
            />
          </div>
        ) : (
          filtered.map((asg) => (
            <div
              key={asg.id}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <StudioBadge variant={asg.published ? "published" : "draft"} size="sm">
                    {asg.published ? "Published" : "Draft"}
                  </StudioBadge>
                  <span className="text-xs font-bold text-slate-900">
                    {asg.isFree || asg.priceInPaise === 0 ? "Free" : `₹${asg.priceInPaise / 100}`}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {asg.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {asg.description}
                </p>
                <div className="pt-1 text-xs text-slate-600 font-medium">
                  {asg.includedTestIds.length} Tests in sequence
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(asg)}
                  className="h-7 text-xs"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  <span>Configure</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteAssignment(asg)}
                  className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200"
                  title="Delete assignment"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingAssignment ? "Edit Assignment" : "New Practice Assignment"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full h-9 px-3 font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Select Mock Tests ({selectedTests.length})</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                  {availableTests.map((t) => {
                    const checked = selectedTests.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-100/70 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setSelectedTests((prev) =>
                              prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                            );
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span className="truncate flex-1 font-medium text-slate-800">{t.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save Assignment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
