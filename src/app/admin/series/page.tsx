"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { getAllCanonicalBundles } from "@/lib/data/bundleService";
import { fetchCanonicalTests } from "@/lib/data/testService";
import { saveSeriesAction, deleteSeriesAction } from "@/app/actions/adminStudioActions";
import { TestBundle, MockTest } from "@/types";
import { CATEGORIES } from "@/data/categories";

export default function TestSeriesAdminPage() {
  const [seriesList, setSeriesList] = useState<TestBundle[]>([]);
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestBundle | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("cat-competitive");
  const [priceInPaise, setPriceInPaise] = useState(49900); // ₹499
  const [description, setDescription] = useState("");
  const [selectedTestSlugs, setSelectedTestSlugs] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        Promise.resolve(getAllCanonicalBundles()),
        fetchCanonicalTests(),
      ]);
      setSeriesList(s);
      setAvailableTests(t);
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
    setEditingSeries(null);
    setTitle("");
    setSlug("");
    setCategoryId("cat-competitive");
    setPriceInPaise(49900);
    setDescription("Comprehensive curriculum assessment series package.");
    setSelectedTestSlugs(availableTests.slice(0, 3).map((t) => t.slug));
    setPublished(true);
    setModalOpen(true);
  };

  const openEditModal = (bundle: TestBundle) => {
    setEditingSeries(bundle);
    setTitle(bundle.title);
    setSlug(bundle.slug);
    setCategoryId(bundle.categoryId);
    setPriceInPaise(bundle.priceInPaise);
    setDescription(bundle.description || "");
    const testSlugs = bundle.includedItems
      ? bundle.includedItems.map((i) => i.testSlug)
      : bundle.includedTestSlugs || [];
    setSelectedTestSlugs(testSlugs);
    setPublished(bundle.published);
    setModalOpen(true);
  };

  const handleToggleTestInclusion = (testSlug: string) => {
    setSelectedTestSlugs((prev) =>
      prev.includes(testSlug)
        ? prev.filter((s) => s !== testSlug)
        : [...prev, testSlug]
    );
  };

  const handleSaveSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;
    if (selectedTestSlugs.length === 0) {
      showFeedback("error", "A test series must include at least one mock test.");
      return;
    }

    setSaving(true);
    const catObj = CATEGORIES.find((c) => c.id === categoryId);

    const items = selectedTestSlugs.map((s, idx) => ({
      testId: s,
      testSlug: s,
      displayOrder: idx + 1,
    }));

    const bundleToSave: TestBundle = {
      id: editingSeries?.id || "bundle-" + Date.now().toString(36),
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      description: description.trim(),
      categoryId,
      categoryName: catObj?.name || "Competitive Exams",
      includedItems: items,
      includedTestsCount: items.length,
      includedTestSlugs: selectedTestSlugs,
      priceInPaise,
      published,
      status: published ? "published" : "draft",
      createdAt: editingSeries?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await saveSeriesAction(bundleToSave);
    if (res.success) {
      if (editingSeries) {
        setSeriesList((prev) => prev.map((s) => (s.id === bundleToSave.id ? bundleToSave : s)));
        showFeedback("success", `Updated test series "${bundleToSave.title}".`);
      } else {
        setSeriesList((prev) => [bundleToSave, ...prev]);
        showFeedback("success", `Created test series "${bundleToSave.title}".`);
      }
      setModalOpen(false);
    } else {
      showFeedback("error", res.error || "Failed to save test series.");
    }
    setSaving(false);
  };

  const handleDeleteSeries = async (id: string, titleStr: string) => {
    if (!confirm(`Are you sure you want to delete test series "${titleStr}"?`)) return;
    const res = await deleteSeriesAction(id);
    if (res.success) {
      setSeriesList((prev) => prev.filter((s) => s.id !== id));
      showFeedback("success", `Deleted test series "${titleStr}".`);
    } else {
      showFeedback("error", res.error || "Failed to delete test series.");
    }
  };

  const filteredSeries = seriesList.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Test Series & Bundles ({seriesList.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-test packages that grant single-purchase access across curriculums.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Create Test Series</span>
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test series titles or slugs..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* Series Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-20 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading test series...</p>
          </div>
        ) : filteredSeries.length === 0 ? (
          <div className="col-span-full">
            <StudioEmptyState
              icon={Layers}
              title="No test series found"
              description="Create a curated series bundle that includes multiple mock tests."
              action={
                <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs">
                  Create First Series
                </Button>
              }
            />
          </div>
        ) : (
          filteredSeries.map((series) => (
            <div
              key={series.id}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <StudioBadge variant={series.published ? "published" : "draft"} size="sm">
                    {series.published ? "Published" : "Draft"}
                  </StudioBadge>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{(series.priceInPaise / 100).toFixed(0)}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {series.title}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                    /series/{series.slug}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {series.description || "Curriculum bundle package."}
                </p>

                <div className="pt-2 flex items-center gap-2 text-xs text-slate-600 font-medium">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{series.includedTestsCount} Mock Tests Included</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/series/${series.slug}`} target="_blank">
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-400 hover:text-slate-700">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    <span>View Live</span>
                  </Button>
                </Link>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(series)}
                    className="h-7 text-xs px-2.5"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSeries(series.id, series.title)}
                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSeries ? "Edit Test Series" : "Create Test Series"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSeries} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Series Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="w-full h-9 px-3 font-mono bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Bundle Price in INR (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={priceInPaise / 100}
                    onChange={(e) => setPriceInPaise((parseInt(e.target.value) || 0) * 100)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
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

              {/* Mock Test Picker */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Select Included Mock Tests ({selectedTestSlugs.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
                  {availableTests.map((t) => {
                    const isChecked = selectedTestSlugs.includes(t.slug);
                    return (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100/80 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTestInclusion(t.slug)}
                          className="rounded text-indigo-600"
                        />
                        <span className="font-medium text-slate-800 flex-1 truncate">
                          {t.title}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t.durationMinutes}m
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Publish series live immediately</span>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save Test Series"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
