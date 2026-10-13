"use client";

import React, { useState } from "react";
import { FolderTree, Plus, Edit2, Trash2, CheckCircle, Tag, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CATEGORIES } from "@/data/categories";
import { saveCategoryAction } from "@/app/actions/adminStudioActions";
import { Category } from "@/types";

export default function CategoriesAdminPage() {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("Target");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCat(null);
    setName("");
    setSlug("");
    setDescription("");
    setIconName("Target");
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setIconName(cat.iconName);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setSaving(true);
    const catToSave: Category = {
      id: editingCat?.id || "cat-" + Date.now().toString(36),
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim(),
      iconName,
      testCount: editingCat?.testCount || 0,
    };

    const res = await saveCategoryAction(catToSave);
    if (res.success) {
      if (editingCat) {
        setCategories((prev) => prev.map((c) => (c.id === catToSave.id ? catToSave : c)));
        setFeedback(`Updated category "${catToSave.name}".`);
      } else {
        setCategories((prev) => [...prev, catToSave]);
        setFeedback(`Created category "${catToSave.name}".`);
      }
      setModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Curriculum Categories ({categories.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage overarching taxonomy classifications used on the public storefront.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={openCreateModal} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Add Category</span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-slate-400">/{cat.slug}</span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                  {cat.testCount || 0} Tests
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{cat.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => openEditModal(cat)} className="h-7 text-xs">
                <Edit2 className="w-3 h-3 mr-1" />
                <span>Edit Category</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingCat ? "Edit Category" : "New Category"}
            </h3>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Slug *</label>
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

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? "Saving..." : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
