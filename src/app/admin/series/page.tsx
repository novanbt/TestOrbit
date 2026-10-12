"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Layers,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  BookOpen,
  ArrowRight,
  Plus,
} from "lucide-react";
import { TestSeries, MockTest, Category } from "@/types";
import {
  getAdminSeries,
  saveAdminSeries,
  deleteAdminSeries,
  getAdminTests,
  getAdminCategories,
} from "@/lib/admin/adminStore";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export default function AdminSeriesPage() {
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [description, setDescription] = useState("");
  const [includedCount, setIncludedCount] = useState(5);
  const [priceInRupees, setPriceInRupees] = useState(999);
  const [originalPriceInRupees, setOriginalPriceInRupees] = useState(1999);
  const [selectedTestSlugs, setSelectedTestSlugs] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    setSeriesList(getAdminSeries());
    setAvailableTests(getAdminTests());
    const cats = getAdminCategories();
    setCategories(cats);
    if (cats.length > 0 && !categoryId) {
      setCategoryId(cats[0].id);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("testorbit_admin_data_updated", handleUpdate);
    return () => window.removeEventListener("testorbit_admin_data_updated", handleUpdate);
  }, []);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId) {
      const genSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(genSlug);
    }
  };

  const handleToggleTestSlug = (testSlug: string) => {
    if (selectedTestSlugs.includes(testSlug)) {
      setSelectedTestSlugs(selectedTestSlugs.filter((s) => s !== testSlug));
    } else {
      setSelectedTestSlugs([...selectedTestSlugs, testSlug]);
    }
  };

  const handleStartEdit = (s: TestSeries) => {
    setEditingId(s.id);
    setTitle(s.title);
    setSlug(s.slug);
    setCategoryId(s.categoryId);
    setTargetAudience(s.targetAudience);
    setDescription(s.description);
    setIncludedCount(s.includedTestsCount);
    setPriceInRupees(Math.round(s.priceInPaise / 100));
    setOriginalPriceInRupees(s.originalPriceInPaise ? Math.round(s.originalPriceInPaise / 100) : Math.round(s.priceInPaise / 100) * 2);
    setSelectedTestSlugs(s.includedTestSlugs || []);
    setPublished(s.published);
    setFormError(null);

    editorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setTargetAudience("");
    setDescription("");
    setIncludedCount(5);
    setPriceInRupees(999);
    setOriginalPriceInRupees(1999);
    setSelectedTestSlugs([]);
    setPublished(true);
    setFormError(null);
  };

  const handleSaveSeries = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Series title is required.");
      return;
    }
    const cleanSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const cat = categories.find((c) => c.id === categoryId);
    const categoryName = cat ? cat.name : "Competitive Exams";

    const discountPercentage =
      originalPriceInRupees > priceInRupees
        ? Math.round(((originalPriceInRupees - priceInRupees) / originalPriceInRupees) * 100)
        : 0;

    const newSeries: TestSeries = {
      id: editingId || `series-${Date.now().toString(36)}`,
      slug: cleanSlug,
      title: title.trim(),
      categoryId: categoryId || "cat-competitive",
      categoryName,
      targetAudience: targetAudience.trim() || "Students targeting comprehensive preparation",
      description: description.trim() || `Comprehensive test series package for ${title.trim()}.`,
      includedTestsCount: Number(includedCount) || selectedTestSlugs.length || 5,
      priceInPaise: Math.round(priceInRupees * 100),
      originalPriceInPaise: Math.round(originalPriceInRupees * 100),
      discountPercentage,
      includedTestSlugs: selectedTestSlugs,
      published,
      createdAt: new Date().toISOString().split("T")[0],
    };

    saveAdminSeries(newSeries);
    setSuccessMessage(editingId ? "Test series bundle updated!" : "New test series bundle created!");
    setTimeout(() => setSuccessMessage(null), 3000);

    handleResetForm();
  };

  const handleDelete = (id: string) => {
    deleteAdminSeries(id);
    setDeleteConfirmId(null);
    setSuccessMessage("Test series removed.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Test Series Packages
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bundle multiple mock tests into discounted high-value curriculum packages.
          </p>
        </div>

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
          Create New Series Bundle
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 2. Series List Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Series Title & Category</th>
                <th className="py-3 px-4">Tests Count</th>
                <th className="py-3 px-4">Discount</th>
                <th className="py-3 px-4">Pricing</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {seriesList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No test series packages configured yet</p>
                  </td>
                </tr>
              ) : (
                seriesList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-semibold text-slate-900">{s.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {s.categoryName} • /{s.slug}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {s.includedTestsCount} Tests
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {s.discountPercentage ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                          {s.discountPercentage}% OFF
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{formatCurrency(s.priceInPaise)}</span>
                      {s.originalPriceInPaise && (
                        <span className="text-[11px] text-slate-400 line-through ml-1.5">
                          {formatCurrency(s.originalPriceInPaise)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        s.published
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.published ? "bg-emerald-500" : "bg-amber-500"}`} />
                        {s.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartEdit(s)}
                          className="h-7 px-2 text-[11px] gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Link href={`/series/${s.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
                            <Eye className="w-3 h-3 text-slate-500" />
                          </Button>
                        </Link>
                        {deleteConfirmId === s.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(s.id)}
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
                            onClick={() => setDeleteConfirmId(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Series"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Dedicated Series Builder / Editor Form */}
      <div
        ref={editorRef}
        className="p-6 sm:p-8 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingId ? "Edit Test Series Bundle" : "Create New Test Series Bundle"}
              </h3>
              <p className="text-xs text-slate-500">
                Group existing assessments into high-converting curriculum bundles.
              </p>
            </div>
          </div>

          {editingId && (
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

        <form onSubmit={handleSaveSeries} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Series Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. JEE Main Complete Mock Series (10 Tests)"
                className="block w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                URL Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="jee-main-complete-series"
                className="block w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Curriculum Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="block w-full px-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Included Tests Count
              </label>
              <input
                type="number"
                min={2}
                max={50}
                value={includedCount}
                onChange={(e) => setIncludedCount(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bundle Price (₹) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={priceInRupees}
                onChange={(e) => setPriceInRupees(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Original Price (₹) before discount
              </label>
              <input
                type="number"
                min={1}
                value={originalPriceInRupees}
                onChange={(e) => setOriginalPriceInRupees(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. Serious JEE Main aspirants targeting 99+ percentile"
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Select Included Mock Tests */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Mock Tests Included in this Bundle ({selectedTestSlugs.length} selected)
            </label>
            <div className="max-h-52 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
              {availableTests.map((t) => {
                const isSelected = selectedTestSlugs.includes(t.slug);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected ? "bg-indigo-50 border border-indigo-200 text-indigo-900" : "hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleTestSlug(t.slug)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="font-medium">{t.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{t.categoryName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="checkbox"
              id="series-published"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="series-published" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Publish Series to Marketplace
            </label>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button type="submit" variant="primary" size="md" className="gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingId ? "Update Test Series" : "Create Test Series"}</span>
            </Button>
            {editingId && (
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
