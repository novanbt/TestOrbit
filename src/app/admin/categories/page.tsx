"use client";

import React, { useState, useEffect } from "react";
import { Grid, PlusCircle, Edit, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Category } from "@/types";
import { getAdminCategories, saveAdminCategory, deleteAdminCategory } from "@/lib/admin/adminStore";
import { Button } from "@/components/ui/Button";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("BookOpen");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = () => {
    setCategories(getAdminCategories());
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener("testorbit_admin_data_updated", handleUpdate);
    return () => window.removeEventListener("testorbit_admin_data_updated", handleUpdate);
  }, []);

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setIconName(cat.iconName || "BookOpen");
    setFormError(null);
  };

  const handleReset = () => {
    setEditingId(null);
    setName("");
    setSlug("");
    setDescription("");
    setIconName("BookOpen");
    setFormError(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    const cleanSlug =
      slug.trim() ||
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-");

    const categoryItem: Category = {
      id: editingId || `cat-${Date.now().toString(36)}`,
      name: name.trim(),
      slug: cleanSlug,
      iconName,
      description: description.trim() || `Assessments and courses for ${name.trim()}.`,
      testCount: editingId ? categories.find((c) => c.id === editingId)?.testCount || 0 : 0,
    };

    saveAdminCategory(categoryItem);
    setSuccessMessage(editingId ? "Category updated!" : "New category created!");
    setTimeout(() => setSuccessMessage(null), 3000);
    handleReset();
  };

  const handleDelete = (id: string) => {
    deleteAdminCategory(id);
    setDeleteConfirmId(null);
    setSuccessMessage("Category removed.");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Curriculum Categories
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Organize mock assessments into high-level subject disciplines and educational boards.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Table of Categories (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Active Domains ({categories.length})
            </span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-4">Slug</th>
                <th className="py-3 px-4">Tests</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{c.name}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{c.description}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{c.slug}</td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{c.testCount} tests</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(c)}
                        className="h-7 px-2 text-[11px] gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                      {deleteConfirmId === c.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(c.id)}
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
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create / Edit Form (1 col) */}
        <div className="lg:col-span-1 p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {editingId ? "Edit Category" : "Add New Category"}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) {
                    setSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));
                  }
                }}
                placeholder="e.g. Aerospace Engineering"
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                placeholder="aerospace-engineering"
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
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
                placeholder="Brief curriculum scope description..."
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" className="w-full text-xs shadow-xs">
                {editingId ? "Update Category" : "Save Category"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
