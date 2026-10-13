"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MockTest, Category } from "@/types";
import { getAdminTests, saveAdminTest, deleteAdminTest, getAdminCategories } from "@/lib/admin/adminStore";
import { saveTestServerAction, deleteTestServerAction } from "@/app/actions/testActions";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(25);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const scrollTable = (direction: "left" | "right") => {
    if (tableContainerRef.current) {
      const offset = direction === "left" ? -350 : 350;
      tableContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

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

  const handleTogglePublished = async (test: MockTest) => {
    const updated: MockTest = { ...test, published: !test.published };
    saveAdminTest(updated);
    setTests((prev) => prev.map((t) => (t.id === test.id ? updated : t)));
    await saveTestServerAction(updated);
  };

  const handleToggleFeatured = async (test: MockTest) => {
    const updated: MockTest = { ...test, isFeatured: !test.isFeatured };
    saveAdminTest(updated);
    setTests((prev) => prev.map((t) => (t.id === test.id ? updated : t)));
    await saveTestServerAction(updated);
  };

  const handleDelete = async (id: string) => {
    const target = tests.find((t) => t.id === id);
    deleteAdminTest(id);
    setTests((prev) => prev.filter((t) => t.id !== id));
    setDeleteConfirmId(null);
    await deleteTestServerAction(id, target?.slug);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedStatus]);

  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(filteredTests.length / (pageSize as number)));
  const paginatedTests = useMemo(() => {
    if (pageSize === "all") return filteredTests;
    const start = (currentPage - 1) * (pageSize as number);
    return filteredTests.slice(start, start + (pageSize as number));
  }, [filteredTests, currentPage, pageSize]);

  const startCount = filteredTests.length === 0 ? 0 : pageSize === "all" ? 1 : (currentPage - 1) * (pageSize as number) + 1;
  const endCount = pageSize === "all" ? filteredTests.length : Math.min(currentPage * (pageSize as number), filteredTests.length);

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

        {/* Results Count & Reset & Table Scroll Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-3">
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

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] text-slate-400">Scroll table:</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => scrollTable("left")}
                className="p-1 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Scroll Left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollTable("right")}
                className="p-1 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Scroll Right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Tests Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div
          ref={tableContainerRef}
          className="overflow-x-auto custom-scrollbar"
        >
          <table className="w-full text-left text-xs min-w-[1050px] border-collapse">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold select-none">
              <tr>
                <th className="py-3 px-4 min-w-[220px]">Test Title</th>
                <th className="py-3 px-4 whitespace-nowrap">Category</th>
                <th className="py-3 px-4 whitespace-nowrap">Difficulty</th>
                <th className="py-3 px-4 whitespace-nowrap">Questions</th>
                <th className="py-3 px-4 whitespace-nowrap">Duration</th>
                <th className="py-3 px-4 whitespace-nowrap">Price</th>
                <th className="py-3 px-4 whitespace-nowrap text-center">Featured</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap sticky right-0 bg-slate-50/95 backdrop-blur-xs z-20 border-l border-slate-200/80 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                  Actions
                </th>
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
                paginatedTests.map((test) => (
                  <tr key={test.id} className="group hover:bg-slate-50/60 transition-colors">
                    {/* Title */}
                    <td className="py-3.5 px-4 min-w-[220px] max-w-xs">
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
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
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

                    {/* Actions - Sticky Column */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/90 transition-colors z-10 border-l border-slate-200/60 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. Edit Button - Primary Action */}
                        <Link href={`/admin/tests/${test.slug}/edit`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2.5 text-[11px] gap-1 font-medium text-slate-700 hover:text-indigo-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-2xs"
                            title="Edit Mock Test"
                          >
                            <Edit className="w-3 h-3 text-slate-500" />
                            <span>Edit</span>
                          </Button>
                        </Link>

                        {/* 2. Questions Editor */}
                        <Link href={`/admin/tests/${test.slug}/questions`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[11px] gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 shadow-2xs"
                            title="Manage Questions"
                          >
                            <FileQuestion className="w-3 h-3" />
                            <span className="hidden sm:inline">Questions</span>
                          </Button>
                        </Link>

                        {/* 3. View Public Test */}
                        <Link href={`/tests/${test.slug}`} target="_blank" title="View Public Page">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>

                        {/* 4. Delete Mock Test */}
                        {deleteConfirmId === test.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(test.id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer shadow-xs"
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

        {/* 4. Table Pagination Footer */}
        {filteredTests.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/60 border-t border-slate-200/80 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong>{startCount}</strong> to <strong>{endCount}</strong> of <strong>{filteredTests.length}</strong> tests
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === "all" ? "all" : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-2xs font-medium text-xs transition-colors"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      return (
                        <React.Fragment key={p}>
                          {prev && p - prev > 1 && (
                            <span className="px-1 text-slate-400">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded text-xs font-semibold transition-colors cursor-pointer ${
                              currentPage === p
                                ? "bg-indigo-600 text-white shadow-2xs"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-2xs font-medium text-xs transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
