"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  Search,
  Filter,
  Edit,
  Trash2,
  FileQuestion,
  Eye,
  CheckCircle2,
  Star,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { MockTest, Category } from "@/types";
import { getAdminTests, saveAdminTest, deleteAdminTest, getAdminCategories } from "@/lib/admin/adminStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDuration } from "@/lib/utils";

export default function AdminTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadData = () => {
    setTests(getAdminTests());
    setCategories(getAdminCategories());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("testorbit_admin_data_updated", handleUpdate);
    return () => window.removeEventListener("testorbit_admin_data_updated", handleUpdate);
  }, []);

  const handleTogglePublished = (test: MockTest) => {
    const updated: MockTest = { ...test, published: !test.published };
    saveAdminTest(updated);
  };

  const handleToggleFeatured = (test: MockTest) => {
    const updated: MockTest = { ...test, isFeatured: !test.isFeatured };
    saveAdminTest(updated);
  };

  const handleDelete = (id: string) => {
    deleteAdminTest(id);
    setDeleteConfirmId(null);
  };

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesSlug = t.slug.toLowerCase().includes(query);
        const matchesCategory = t.categoryName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSlug && !matchesCategory) return false;
      }

      // Category filter
      if (selectedCategory !== "all" && t.categoryId !== selectedCategory) {
        return false;
      }

      // Difficulty filter
      if (selectedDifficulty !== "all" && t.difficulty !== selectedDifficulty) {
        return false;
      }

      // Status filter
      if (selectedStatus === "published" && !t.published) return false;
      if (selectedStatus === "draft" && t.published) return false;
      if (selectedStatus === "featured" && !t.isFeatured) return false;

      return true;
    });
  }, [tests, searchQuery, selectedCategory, selectedDifficulty, selectedStatus]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Mock Tests Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage assessment titles, question banks, pricing, and curriculum publication.
          </p>
        </div>

        <Link href="/admin/tests/create">
          <Button variant="primary" size="md" className="gap-2 shadow-xs">
            <PlusCircle className="w-4 h-4" />
            Create New Test
          </Button>
        </Link>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search tests, topics, or slugs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="all">All Curriculum Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Dropdown */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="all">All Difficulty Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published Only</option>
              <option value="draft">Drafts Only</option>
              <option value="featured">Featured On Homepage</option>
            </select>
          </div>
        </div>

        {/* Results Count & Reset */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong>{filteredTests.length}</strong> of <strong>{tests.length}</strong> mock tests
          </span>

          {(searchQuery || selectedCategory !== "all" || selectedDifficulty !== "all" || selectedStatus !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedDifficulty("all");
                setSelectedStatus("all");
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Tests Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Test Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Difficulty</th>
                <th className="py-3 px-4">Questions</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Featured</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No mock tests found matching criteria</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting search filters or create a new test</p>
                  </td>
                </tr>
              ) : (
                filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Title */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 line-clamp-1">{test.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                        /{test.slug}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {test.categoryName}
                    </td>

                    {/* Difficulty */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        test.difficulty === "Beginner"
                          ? "bg-emerald-50 text-emerald-700"
                          : test.difficulty === "Intermediate"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      }`}>
                        {test.difficulty}
                      </span>
                    </td>

                    {/* Questions */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/admin/tests/${test.slug}/questions`}
                        className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <FileQuestion className="w-3.5 h-3.5" />
                        <span>{test.questionCount} MCQs</span>
                      </Link>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {formatDuration(test.durationMinutes)}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-900">
                      {test.isFree ? (
                        <span className="text-emerald-600 font-bold">FREE</span>
                      ) : (
                        formatCurrency(test.priceInPaise)
                      )}
                    </td>

                    {/* Featured Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFeatured(test)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          test.isFeatured
                            ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
                            : "text-slate-300 hover:text-slate-400 hover:bg-slate-100"
                        }`}
                        title={test.isFeatured ? "Featured on Home" : "Not Featured"}
                      >
                        <Star className={`w-4 h-4 ${test.isFeatured ? "fill-amber-400" : ""}`} />
                      </button>
                    </td>

                    {/* Published Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublished(test)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                          test.published
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${test.published ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <span>{test.published ? "Published" : "Draft"}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/tests/${test.slug}/questions`}>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                            <FileQuestion className="w-3 h-3" />
                            Questions
                          </Button>
                        </Link>
                        <Link href={`/admin/tests/${test.slug}/edit`}>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-[11px] gap-1">
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/tests/${test.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
                            <Eye className="w-3 h-3 text-slate-500" />
                          </Button>
                        </Link>
                        {deleteConfirmId === test.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(test.id)}
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
                            onClick={() => setDeleteConfirmId(test.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Mock Test"
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
    </div>
  );
}
