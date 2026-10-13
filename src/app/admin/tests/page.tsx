"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  PlusCircle,
  Filter,
  CheckCircle,
  Eye,
  Edit2,
  Copy,
  Archive,
  Trash2,
  ExternalLink,
  MoreVertical,
  AlertTriangle,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { saveMockTestAction, deleteMockTestAction, bulkDeleteMockTestsAction } from "@/app/actions/adminStudioActions";
import { MockTest } from "@/types";
import { CATEGORIES } from "@/data/categories";

export default function AllTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");

  // Selection & Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [testToDelete, setTestToDelete] = useState<MockTest | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadTests = async () => {
    setLoading(true);
    try {
      const data = await fetchCanonicalTests();
      setTests(data);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, []);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesSlug = t.slug.toLowerCase().includes(q);
        const matchesCat = t.categoryName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSlug && !matchesCat) return false;
      }
      if (categoryFilter !== "all" && t.categoryId !== categoryFilter) {
        return false;
      }
      if (statusFilter === "published" && !t.published) return false;
      if (statusFilter === "draft" && t.published) return false;
      if (priceFilter === "free" && !t.isFree && t.priceInPaise > 0) return false;
      if (priceFilter === "paid" && (t.isFree || t.priceInPaise === 0)) return false;
      return true;
    });
  }, [tests, searchQuery, categoryFilter, statusFilter, priceFilter]);

  // Toggle Publish / Unpublish
  const handleTogglePublish = async (test: MockTest) => {
    setActionInProgress(test.id);
    const updated: MockTest = {
      ...test,
      published: !test.published,
      updatedAt: new Date().toISOString(),
    };
    const res = await saveMockTestAction(updated);
    if (res.success) {
      setTests((prev) => prev.map((t) => (t.id === test.id ? updated : t)));
      showFeedback(
        "success",
        `Mock test "${test.title}" is now ${updated.published ? "Live / Published" : "saved as Draft"}.`
      );
    } else {
      showFeedback("error", res.error || "Failed to update publication status.");
    }
    setActionInProgress(null);
  };

  // Duplicate Test
  const handleDuplicate = async (test: MockTest) => {
    setActionInProgress(test.id);
    const newSlug = `${test.slug}-copy-${Math.random().toString(36).substring(2, 6)}`;
    const duplicated: MockTest = {
      ...test,
      id: "test-" + Date.now().toString(36),
      slug: newSlug,
      title: `${test.title} (Copy)`,
      published: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const res = await saveMockTestAction(duplicated);
    if (res.success) {
      setTests((prev) => [duplicated, ...prev]);
      showFeedback("success", `Duplicated as "${duplicated.title}". Saved as draft.`);
    } else {
      showFeedback("error", res.error || "Failed to duplicate test.");
    }
    setActionInProgress(null);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!testToDelete) return;
    setActionInProgress(testToDelete.id);
    const res = await deleteMockTestAction(testToDelete.id, testToDelete.slug);
    if (res.success) {
      setTests((prev) => prev.filter((t) => t.id !== testToDelete.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(testToDelete.id);
        return next;
      });
      showFeedback("success", `Permanently deleted "${testToDelete.title}".`);
    } else {
      showFeedback("error", res.error || "Failed to delete test.");
    }
    setTestToDelete(null);
    setActionInProgress(null);
  };

  // Confirm Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);

    const itemsToDelete = tests
      .filter((t) => selectedIds.has(t.id))
      .map((t) => ({ id: t.id, slug: t.slug }));

    const res = await bulkDeleteMockTestsAction(itemsToDelete);
    if (res.success) {
      const deletedCount = res.data ?? itemsToDelete.length;
      setTests((prev) => prev.filter((t) => !selectedIds.has(t.id)));
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      showFeedback("success", `Permanently deleted ${deletedCount} selected mock test${deletedCount > 1 ? "s" : ""}.`);
    } else {
      showFeedback("error", res.error || "Failed to delete selected tests.");
    }

    setBulkDeleting(false);
  };

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredTests.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Mock Test Catalogue ({tests.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage assessment content, pricing, question banks, and live visibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTests}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/admin/tests/create">
            <Button variant="primary" size="sm" className="text-xs">
              <PlusCircle className="w-3.5 h-3.5 mr-1" />
              <span>Create New Test</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border flex items-center justify-between animate-in fade-in ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, slug..."
              className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">All Categories ({CATEGORIES.length})</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Publication Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "published" | "draft")}
            className="h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published Only</option>
            <option value="draft">Drafts Only</option>
          </select>

          {/* Price Filter */}
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as "all" | "free" | "paid")}
            className="h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
          >
            <option value="all">All Price Types</option>
            <option value="free">Free Access</option>
            <option value="paid">Paid Content</option>
          </select>
        </div>

        {/* Selected Counter & Bulk Bar */}
        {selectedIds.size > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-700 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 animate-in fade-in">
            <span className="font-semibold text-indigo-900">
              {selectedIds.size} test{selectedIds.size > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs h-8 bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
              >
                Clear Selection
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={bulkDeleting}
                className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white border-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.size})</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">Loading live catalogue...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <StudioEmptyState
            icon={BookOpen}
            title="No matching mock tests found"
            description="Try clearing your filters or create a new mock test assessment."
            action={
              <Link href="/admin/tests/create">
                <Button variant="primary" size="sm" className="text-xs">
                  Create First Test
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredTests.length > 0 &&
                        selectedIds.size === filteredTests.length
                      }
                      onChange={handleSelectAll}
                      className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Test Title & Curriculum</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Specs</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.map((test) => {
                  const isSelected = selectedIds.has(test.id);

                  return (
                    <tr
                      key={test.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(test.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Title & Slug */}
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 truncate">
                          {test.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate">
                          /tests/{test.slug}
                        </div>
                        {test.targetAudience && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">
                            Target: {test.targetAudience}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700">
                          {test.categoryName || test.categoryId}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {test.difficulty}
                        </span>
                      </td>

                      {/* Specs */}
                      <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                        <div>
                          <strong>{test.questionCount}</strong> Questions
                        </div>
                        <div className="text-slate-400">
                          {test.durationMinutes} mins • {test.maxMarks} marks
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {test.isFree || test.priceInPaise === 0 ? (
                          <StudioBadge variant="free" size="sm">
                            Free
                          </StudioBadge>
                        ) : (
                          <span className="font-bold text-slate-900">
                            ₹{(test.priceInPaise / 100).toFixed(0)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(test)}
                          disabled={actionInProgress === test.id}
                          className="cursor-pointer group"
                          title="Click to toggle publication"
                        >
                          <StudioBadge
                            variant={test.published ? "published" : "draft"}
                            size="sm"
                            className="group-hover:opacity-80 transition-opacity"
                          >
                            {test.published ? "Published" : "Draft"}
                          </StudioBadge>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/tests/${test.slug}`} target="_blank">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                              title="Preview on public site"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          <Link href={`/admin/tests/${test.slug}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600"
                              title="Edit test and questions"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(test)}
                            disabled={actionInProgress === test.id}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
                            title="Duplicate test"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setTestToDelete(test)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                            title="Delete test"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single Delete Confirmation Modal */}
      {testToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Permanently Delete Mock Test?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete{" "}
                <strong className="text-slate-900">&ldquo;{testToDelete.title}&rdquo;</strong>?
                This will remove the test and associated questions from the canonical database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTestToDelete(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-xs"
              >
                Delete Test
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                Permanently Delete {selectedIds.size} Selected Mock Test{selectedIds.size > 1 ? "s" : ""}?
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Are you sure you want to delete the <strong className="text-slate-900 font-semibold">{selectedIds.size} selected test{selectedIds.size > 1 ? "s" : ""}</strong>? 
                This will permanently remove these tests and their associated questions from the canonical database. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={bulkDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={bulkDeleting}
                onClick={handleConfirmBulkDelete}
                className="bg-rose-600 hover:bg-rose-700 text-xs flex items-center gap-1.5 text-white"
              >
                {bulkDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete {selectedIds.size} Tests</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
