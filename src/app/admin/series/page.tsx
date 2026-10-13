"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ArrowUp,
  ArrowDown,
  Plus,
  X,
  Search,
  Copy,
  Archive,
  Clock,
  Sparkles,
  HelpCircle,
  Tag,
  DollarSign,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  TestBundle,
  MockTest,
  Category,
  BundleIncludedTestItem,
  BundleStatus,
  DifficultyLevel,
} from "@/types";
import {
  getAdminSeries,
  saveAdminSeries,
  deleteAdminSeries,
  duplicateAdminSeries,
  getAdminTests,
  getAdminCategories,
} from "@/lib/admin/adminStore";
import {
  saveBundleServerAction,
  deleteBundleServerAction,
} from "@/app/actions/bundleActions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDuration, formatPriceInRupees } from "@/lib/utils";

export default function AdminBundleBuilderPage() {
  const [bundlesList, setBundlesList] = useState<TestBundle[]>([]);
  const [availableTests, setAvailableTests] = useState<MockTest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Table Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Wizard / Builder State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Step 1: Basic Information
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [targetClassOrExam, setTargetClassOrExam] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediate");
  const [tags, setTags] = useState<string[]>(["CBSE", "Full Bundle"]);
  const [tagInput, setTagInput] = useState("");

  // Step 2: Included Tests
  const [includedItems, setIncludedItems] = useState<BundleIncludedTestItem[]>([]);
  const [testSearchQuery, setTestSearchQuery] = useState("");
  const [testCategoryFilter, setTestCategoryFilter] = useState("all");

  // Step 3: Bundle Pricing
  const [sellingPriceInRupees, setSellingPriceInRupees] = useState<number>(799);
  const [customReferencePriceInRupees, setCustomReferencePriceInRupees] = useState<number>(0);

  // Step 4: Access Rules
  const [accessDurationDays, setAccessDurationDays] = useState<number>(365);
  const [attemptLimit, setAttemptLimit] = useState<number>(0); // 0 = unlimited
  const [bundleStatus, setBundleStatus] = useState<BundleStatus>("published");
  const [previewPolicy, setPreviewPolicy] = useState<"none" | "free_sample">("none");

  const wizardRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    const series = getAdminSeries();
    setBundlesList(series);
    const tests = getAdminTests();
    setAvailableTests(tests);
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

  // Filtered Bundles for Table
  const filteredBundles = useMemo(() => {
    return bundlesList.filter((b) => {
      const matchesSearch =
        searchQuery === "" ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.targetClassOrExam && b.targetClassOrExam.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && b.published && b.status !== "archived") ||
        (statusFilter === "draft" && !b.published && b.status !== "archived") ||
        (statusFilter === "archived" && b.status === "archived");

      const matchesCategory =
        categoryFilter === "all" || b.categoryId === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [bundlesList, searchQuery, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredBundles.length / pageSize) || 1;
  const paginatedBundles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBundles.slice(start, start + pageSize);
  }, [filteredBundles, currentPage]);

  // Pricing calculations for Wizard
  const selectedTestObjects = useMemo(() => {
    const testMap = new Map<string, MockTest>();
    for (const t of availableTests) {
      testMap.set(t.slug, t);
      testMap.set(t.id, t);
    }
    return includedItems
      .map((item) => {
        const test = testMap.get(item.testSlug) || testMap.get(item.testId);
        return { item, test };
      })
      .filter((pair): pair is { item: BundleIncludedTestItem; test: MockTest } => Boolean(pair.test));
  }, [includedItems, availableTests]);

  const calculatedCombinedReferencePriceInRupees = useMemo(() => {
    const sumPaise = selectedTestObjects.reduce((acc, pair) => acc + (pair.test.priceInPaise || 0), 0);
    return Math.round(sumPaise / 100);
  }, [selectedTestObjects]);

  const effectiveReferencePriceInRupees = useMemo(() => {
    if (customReferencePriceInRupees > 0) return customReferencePriceInRupees;
    return calculatedCombinedReferencePriceInRupees;
  }, [customReferencePriceInRupees, calculatedCombinedReferencePriceInRupees]);

  const savingsInRupees = useMemo(() => {
    return effectiveReferencePriceInRupees > sellingPriceInRupees
      ? effectiveReferencePriceInRupees - sellingPriceInRupees
      : 0;
  }, [effectiveReferencePriceInRupees, sellingPriceInRupees]);

  const discountPercentage = useMemo(() => {
    if (effectiveReferencePriceInRupees > 0 && savingsInRupees > 0) {
      return Math.round((savingsInRupees / effectiveReferencePriceInRupees) * 100);
    }
    return 0;
  }, [effectiveReferencePriceInRupees, savingsInRupees]);

  // Handler for Slug Autogeneration
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  };

  // Tag Handlers
  const handleAddTag = (tagToAdd?: string) => {
    const val = (tagToAdd || tagInput).trim().replace(/^#/, "");
    if (!val) return;
    if (!tags.some((t) => t.toLowerCase() === val.toLowerCase())) {
      setTags([...tags, val]);
    }
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Tests Selection & Reordering
  const handleAddTest = (test: MockTest) => {
    if (includedItems.some((i) => i.testSlug === test.slug || i.testId === test.id)) return;
    const newItem: BundleIncludedTestItem = {
      testId: test.id,
      testSlug: test.slug,
      testTitle: test.title,
      displayOrder: includedItems.length + 1,
      sectionHeading: test.categoryName || "Core Tests",
      note: `${test.questionCount} Questions • ${test.durationMinutes} mins`,
    };
    setIncludedItems([...includedItems, newItem]);
  };

  const handleRemoveTest = (index: number) => {
    const updated = includedItems.filter((_, idx) => idx !== index).map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));
    setIncludedItems(updated);
  };

  const handleMoveTest = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === includedItems.length - 1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...includedItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setIncludedItems(
      updated.map((item, idx) => ({
        ...item,
        displayOrder: idx + 1,
      }))
    );
  };

  const handleUpdateSectionHeading = (index: number, heading: string) => {
    const updated = [...includedItems];
    updated[index] = { ...updated[index], sectionHeading: heading };
    setIncludedItems(updated);
  };

  // Reset Builder Form
  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setShortDescription("");
    setDescription("");
    setCoverImage("");
    setSubcategory("");
    setTargetClassOrExam("");
    setTargetAudience("");
    setDifficulty("Intermediate");
    setTags(["CBSE", "Full Bundle"]);
    setTagInput("");
    setIncludedItems([]);
    setSellingPriceInRupees(799);
    setCustomReferencePriceInRupees(0);
    setAccessDurationDays(365);
    setAttemptLimit(0);
    setBundleStatus("published");
    setPreviewPolicy("none");
    setCurrentStep(1);
    setIsBuilderOpen(false);
    setErrorMessage(null);
  };

  // Edit Existing Bundle
  const startEditing = (bundle: TestBundle) => {
    setEditingId(bundle.id);
    setTitle(bundle.title);
    setSlug(bundle.slug);
    setShortDescription(bundle.shortDescription || "");
    setDescription(bundle.description || "");
    setCoverImage(bundle.coverImage || "");
    setCategoryId(bundle.categoryId || (categories[0]?.id || ""));
    setSubcategory(bundle.subcategory || "");
    setTargetClassOrExam(bundle.targetClassOrExam || "");
    setTargetAudience(bundle.targetAudience || "");
    setDifficulty(bundle.difficulty || "Intermediate");
    setTags(bundle.tags && bundle.tags.length > 0 ? bundle.tags : ["Bundle"]);
    setIncludedItems(bundle.includedItems || []);
    setSellingPriceInRupees(Math.round(bundle.priceInPaise / 100));
    setCustomReferencePriceInRupees(
      bundle.originalPriceInPaise ? Math.round(bundle.originalPriceInPaise / 100) : 0
    );
    setAccessDurationDays(bundle.accessDurationDays || 365);
    setAttemptLimit(bundle.attemptLimit || 0);
    setBundleStatus(bundle.status || (bundle.published ? "published" : "draft"));
    setPreviewPolicy((bundle.includedItems?.[0]?.previewPolicy as "none" | "free_sample") || "none");
    setCurrentStep(1);
    setIsBuilderOpen(true);
    setErrorMessage(null);
    wizardRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Duplicate Action
  const handleDuplicate = (id: string) => {
    const duplicated = duplicateAdminSeries(id);
    if (duplicated) {
      setSuccessMessage(`Duplicated bundle created: "${duplicated.title}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
      loadData();
    }
  };

  // Delete Action
  const handleDelete = async (id: string, slugToDelete?: string) => {
    setIsSubmitting(true);
    deleteAdminSeries(id);
    await deleteBundleServerAction(id, slugToDelete);
    setDeleteConfirmId(null);
    setIsSubmitting(false);
    setSuccessMessage("Test bundle deleted successfully.");
    setTimeout(() => setSuccessMessage(null), 3000);
    loadData();
  };

  // Save / Publish Action
  const handleSaveBundle = async (publishImmediate = false) => {
    setErrorMessage(null);

    // Validation
    if (!title.trim()) {
      setErrorMessage("Bundle title is required.");
      setCurrentStep(1);
      return;
    }
    const finalSlug = slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!finalSlug) {
      setErrorMessage("Bundle URL slug is required.");
      setCurrentStep(1);
      return;
    }
    if (includedItems.length === 0) {
      setErrorMessage("You must select at least one mock test to create a bundle.");
      setCurrentStep(2);
      return;
    }
    if (sellingPriceInRupees <= 0) {
      setErrorMessage("Selling price must be greater than zero.");
      setCurrentStep(3);
      return;
    }

    const cat = categories.find((c) => c.id === categoryId);
    const categoryName = cat ? cat.name : "Curated Bundles";

    const finalStatus: BundleStatus = publishImmediate ? "published" : bundleStatus;
    const isPublished = finalStatus === "published";

    const newBundle: TestBundle = {
      id: editingId || `bundle-${Date.now().toString(36)}`,
      slug: finalSlug,
      title: title.trim(),
      shortDescription: shortDescription.trim() || `Complete package with ${includedItems.length} curated mock tests.`,
      description: description.trim() || `Comprehensive curriculum-aligned mock test bundle for ${title.trim()}.`,
      coverImage: coverImage.trim() || undefined,
      categoryId: categoryId || "cat-school",
      categoryName,
      subcategory: subcategory.trim() || undefined,
      targetClassOrExam: targetClassOrExam.trim() || undefined,
      targetAudience: targetAudience.trim() || `${targetClassOrExam || categoryName} students`,
      difficulty,
      tags: tags.length > 0 ? tags : ["Bundle"],
      includedItems: includedItems.map((item, idx) => ({
        ...item,
        displayOrder: idx + 1,
        previewPolicy,
      })),
      includedTestsCount: includedItems.length,
      includedTestSlugs: includedItems.map((i) => i.testSlug),
      priceInPaise: Math.round(sellingPriceInRupees * 100),
      originalPriceInPaise: effectiveReferencePriceInRupees > 0
        ? Math.round(effectiveReferencePriceInRupees * 100)
        : undefined,
      discountPercentage,
      status: finalStatus,
      published: isPublished,
      accessDurationDays: Number(accessDurationDays) || 365,
      attemptLimit: Number(attemptLimit) || 0,
      createdAt: editingId ? (bundlesList.find((b) => b.id === editingId)?.createdAt || new Date().toISOString().split("T")[0]) : new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    // 1. Client cache save
    saveAdminSeries(newBundle);

    // 2. Server save with route revalidation
    const res = await saveBundleServerAction(newBundle);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(
        editingId
          ? `Bundle "${newBundle.title}" updated successfully!`
          : `New bundle "${newBundle.title}" created & ${isPublished ? "published" : "saved as draft"}!`
      );
      setTimeout(() => setSuccessMessage(null), 3500);
      resetForm();
      loadData();
    } else {
      setErrorMessage(res.error || "Failed to persist bundle. Please review required fields.");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header & Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Assignments & Products
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-medium text-slate-500">Test Bundles Builder</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Curated Test Series & Bundles
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Select existing mock tests, combine them into multi-test packages, configure genuine discounts, and let students purchase once to access all included assessments.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            resetForm();
            setIsBuilderOpen(true);
            wizardRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
          className="gap-1.5 shadow-xs text-xs font-semibold shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Create Test Bundle
        </Button>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* 2. Bundle Wizard / Builder Modal or Panel */}
      {isBuilderOpen && (
        <div
          ref={wizardRef}
          className="bg-white border-2 border-indigo-200/80 rounded-2xl shadow-md overflow-hidden transition-all"
        >
          {/* Wizard Header & Steps Progress Bar */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {editingId ? `Editing: ${title || "Test Bundle"}` : "Create New Test Bundle"}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Step-by-step bundle composer with live pricing & multi-test selector
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  className="text-xs text-slate-300 hover:text-white border-slate-700 bg-slate-800/80 hover:bg-slate-800"
                >
                  Close Wizard
                </Button>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-5 gap-2 mt-6 pt-4 border-t border-slate-800/80">
              {[
                { num: 1, label: "1. Basic Info" },
                { num: 2, label: "2. Select Tests" },
                { num: 3, label: "3. Pricing" },
                { num: 4, label: "4. Access Rules" },
                { num: 5, label: "5. Review & Publish" },
              ].map((step) => {
                const isActive = currentStep === step.num;
                const isPassed = currentStep > step.num;
                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => setCurrentStep(step.num as 1 | 2 | 3 | 4 | 5)}
                    className={`flex flex-col items-start p-2 rounded-lg text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600/30 border border-indigo-500 text-white font-semibold"
                        : isPassed
                        ? "text-indigo-300 hover:bg-slate-800/60"
                        : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/40"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {isPassed ? "✓ Done" : `Step ${step.num}`}
                    </span>
                    <span className="text-xs truncate w-full mt-0.5">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wizard Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* ================= STEP 1: BASIC INFORMATION ================= */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Step 1: Basic Information</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define the bundle title, URL slug, target audience, and curriculum category.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bundle Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. Class 10 All-Subjects Board Exam Power Pack"
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL Slug * (Unique)
                    </label>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white overflow-hidden">
                      <span className="px-3 py-2 text-xs text-slate-400 font-mono bg-slate-100 border-r border-slate-200 select-none">
                        /series/
                      </span>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="class-10-board-power-pack"
                        className="w-full px-3 py-2.5 text-xs font-mono focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Curriculum Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                      Target Class, Exam, or Skill
                    </label>
                    <input
                      type="text"
                      value={targetClassOrExam}
                      onChange={(e) => setTargetClassOrExam(e.target.value)}
                      placeholder="e.g. Class 10 CBSE, JEE Main, Full-Stack"
                      className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                      className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Audience / Who This Is For
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="e.g. Class X CBSE & State Board students preparing for final examinations"
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Short Description (Summary Card)
                  </label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="e.g. Complete all-subjects board exam bundle with 5 full-length mock papers."
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the structure of the bundle, syllabus coverage, marking keys, and benefits for students..."
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Tags Chip Editor */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Search & Filter Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-rose-600 cursor-pointer ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder="Type tag and press Enter..."
                      className="flex-1 min-w-[140px] px-2 py-1 text-xs bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      if (!title.trim()) {
                        setErrorMessage("Please enter a bundle title before proceeding.");
                        return;
                      }
                      setErrorMessage(null);
                      setCurrentStep(2);
                    }}
                    className="gap-2 font-semibold"
                  >
                    <span>Next: Select Included Mock Tests</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ================= STEP 2: SELECT INCLUDED MOCK TESTS ================= */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Step 2: Select Included Mock Tests
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Search and attach real existing mock tests. Reorder them and configure custom section headings.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="accent" size="sm">
                      {includedItems.length} Tests Selected
                    </Badge>
                    <Badge variant="primary" size="sm">
                      Reference Value: {formatPriceInRupees(calculatedCombinedReferencePriceInRupees * 100)}
                    </Badge>
                  </div>
                </div>

                {/* Split Panes: Available Tests on Left, Selected Tests on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Pane: Available Tests Repository */}
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Available Mock Tests Database
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {availableTests.length} tests in catalog
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                        <input
                          type="text"
                          value={testSearchQuery}
                          onChange={(e) => setTestSearchQuery(e.target.value)}
                          placeholder="Search tests by title or topic..."
                          className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <select
                        value={testCategoryFilter}
                        onChange={(e) => setTestCategoryFilter(e.target.value)}
                        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Scrollable list of available tests */}
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                      {availableTests
                        .filter((t) => {
                          const matchesQ =
                            testSearchQuery === "" ||
                            t.title.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                            t.topics?.some((top) => top.toLowerCase().includes(testSearchQuery.toLowerCase()));
                          const matchesCat =
                            testCategoryFilter === "all" || t.categoryId === testCategoryFilter;
                          return matchesQ && matchesCat;
                        })
                        .map((test) => {
                          const isAlreadyAdded = includedItems.some(
                            (i) => i.testSlug === test.slug || i.testId === test.id
                          );
                          return (
                            <div
                              key={test.id}
                              className={`p-3 bg-white border rounded-lg flex items-center justify-between gap-3 transition-colors ${
                                isAlreadyAdded
                                  ? "border-emerald-200 bg-emerald-50/30"
                                  : "border-slate-200 hover:border-indigo-300"
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-semibold text-slate-900 truncate">
                                  {test.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                                  <span>{test.categoryName}</span>
                                  <span>•</span>
                                  <span>{test.questionCount} Qs</span>
                                  <span>•</span>
                                  <span>{test.durationMinutes}m</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700">
                                    {test.isFree ? "Free" : formatPriceInRupees(test.priceInPaise)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <Link
                                  href={`/tests/${test.slug}`}
                                  target="_blank"
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                  title="Preview Test"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>
                                <Button
                                  variant={isAlreadyAdded ? "outline" : "primary"}
                                  size="sm"
                                  disabled={isAlreadyAdded}
                                  onClick={() => handleAddTest(test)}
                                  className="h-7 px-2.5 text-xs"
                                >
                                  {isAlreadyAdded ? "Added" : "+ Add"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Right Pane: Selected Tests in Bundle (Reorderable) */}
                  <div className="space-y-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Tests Included in This Bundle ({includedItems.length})
                      </span>
                      <span className="text-[11px] text-indigo-700 font-semibold">
                        Drag or use ↑ / ↓ arrows
                      </span>
                    </div>

                    {includedItems.length === 0 ? (
                      <div className="p-8 text-center bg-white border border-dashed border-indigo-200 rounded-xl space-y-2">
                        <BookOpen className="w-7 h-7 text-indigo-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700">
                          No tests added to this bundle yet
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                          Click &quot;+ Add&quot; on any test from the left list to attach it to this curriculum package.
                        </p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                        {includedItems.map((item, index) => {
                          const matchingTest = availableTests.find(
                            (t) => t.slug === item.testSlug || t.id === item.testId
                          );
                          return (
                            <div
                              key={item.testSlug || index}
                              className="p-3 bg-white border border-indigo-100 rounded-xl shadow-2xs space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                    {item.displayOrder}
                                  </span>
                                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                                    {matchingTest?.title || item.testTitle || item.testSlug}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTest(index, "up")}
                                    disabled={index === 0}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTest(index, "down")}
                                    disabled={index === includedItems.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTest(index)}
                                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                    title="Remove from bundle"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400 font-medium">Section:</span>
                                <input
                                  type="text"
                                  value={item.sectionHeading || ""}
                                  onChange={(e) => handleUpdateSectionHeading(index, e.target.value)}
                                  placeholder="e.g. Core STEM, Languages, Chapter Mocks"
                                  className="flex-1 px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none"
                                />
                                {matchingTest && (
                                  <span className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                                    {matchingTest.isFree ? "Free" : formatPriceInRupees(matchingTest.priceInPaise)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setCurrentStep(1)}>
                    Back to Basic Info
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      if (includedItems.length === 0) {
                        setErrorMessage("Please select at least one test before proceeding.");
                        return;
                      }
                      setErrorMessage(null);
                      setCurrentStep(3);
                    }}
                    className="gap-2 font-semibold"
                  >
                    <span>Next: Bundle Pricing & Savings</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: BUNDLE PRICING ================= */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Step 3: Bundle Pricing & Discount Calculation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure the actual selling price. The system automatically derives combined reference price, savings amount, and genuine discount percentage.
                  </p>
                </div>

                {/* Live Value Card */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl">
                  <div>
                    <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider block">
                      Sum of Individual Tests
                    </span>
                    <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                      ₹{calculatedCombinedReferencePriceInRupees}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Calculated from {includedItems.length} mock tests
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider block">
                      Bundle Selling Price
                    </span>
                    <span className="text-2xl font-extrabold text-indigo-700 mt-1 block">
                      ₹{sellingPriceInRupees}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Single purchase unlocks all tests
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider block">
                      Customer Savings
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                      ₹{savingsInRupees}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Genuine discount in INR
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider block">
                      Discount Percentage
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
                      {discountPercentage}% OFF
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Derived from valid reference price
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bundle Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={sellingPriceInRupees}
                      onChange={(e) => setSellingPriceInRupees(Number(e.target.value))}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      This is the final price students will pay for the entire package.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Custom Reference Price (₹) (Optional Override)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={customReferencePriceInRupees || ""}
                      onChange={(e) => setCustomReferencePriceInRupees(Number(e.target.value))}
                      placeholder={`Default: ₹${calculatedCombinedReferencePriceInRupees} (Auto-calculated)`}
                      className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Leave empty to use the auto-summed price of all included tests (₹{calculatedCombinedReferencePriceInRupees}).
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setCurrentStep(2)}>
                    Back to Select Tests
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      if (sellingPriceInRupees <= 0) {
                        setErrorMessage("Please enter a valid bundle price.");
                        return;
                      }
                      setErrorMessage(null);
                      setCurrentStep(4);
                    }}
                    className="gap-2 font-semibold"
                  >
                    <span>Next: Access Rules</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ================= STEP 4: ACCESS RULES ================= */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Step 4: Access & Entitlement Rules
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure access duration after purchase, attempt restrictions, and publication status.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Access Duration (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1825}
                      value={accessDurationDays}
                      onChange={(e) => setAccessDurationDays(Number(e.target.value))}
                      className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      e.g. 365 = 1 year from the date of enrollment.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Attempt Limits Per Test
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={attemptLimit}
                      onChange={(e) => setAttemptLimit(Number(e.target.value))}
                      placeholder="0 for Unlimited"
                      className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      0 allows unlimited test attempts.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Publication Status
                    </label>
                    <select
                      value={bundleStatus}
                      onChange={(e) => setBundleStatus(e.target.value as BundleStatus)}
                      className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="published">Published (Live in Marketplace)</option>
                      <option value="draft">Draft (Hidden from Public)</option>
                      <option value="archived">Archived (Purchasers retain access)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800 block">
                        Idempotent Single-Purchase Guarantee:
                      </span>
                      <span>
                        When a learner purchases this bundle, a single payment grants access to all {includedItems.length} included tests. If a student already individually owns any included test, their individual entitlement is preserved without conflict.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setCurrentStep(3)}>
                    Back to Pricing
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(5)}
                    className="gap-2 font-semibold"
                  >
                    <span>Next: Review & Publish</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ================= STEP 5: REVIEW & PUBLISH ================= */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    Step 5: Review & Publish Bundle
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review your complete bundle specification before making it live in the marketplace.
                  </p>
                </div>

                {/* Final Overview Card */}
                <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge variant="accent" size="sm">
                          <Layers className="w-3 h-3 mr-1" />
                          {includedItems.length} Tests Included
                        </Badge>
                        {discountPercentage > 0 && (
                          <Badge variant="success" size="sm">
                            {discountPercentage}% Discount
                          </Badge>
                        )}
                        <Badge
                          variant={bundleStatus === "published" ? "success" : "default"}
                          size="sm"
                        >
                          Status: {bundleStatus.toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{title}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">/series/{slug}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block font-normal">Selling Price</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">
                          ₹{sellingPriceInRupees}
                        </span>
                        {effectiveReferencePriceInRupees > sellingPriceInRupees && (
                          <span className="text-sm text-slate-400 line-through">
                            ₹{effectiveReferencePriceInRupees}
                          </span>
                        )}
                      </div>
                      {savingsInRupees > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Save ₹{savingsInRupees}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{description}</p>

                  {/* Included Tests Summary */}
                  <div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                      Included Mock Tests Blueprint:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {includedItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">
                              {item.testTitle || item.testSlug}
                            </span>
                          </div>
                          {item.sectionHeading && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 shrink-0 ml-2">
                              {item.sectionHeading}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <Button variant="outline" size="md" onClick={() => setCurrentStep(4)}>
                    Back to Access Rules
                  </Button>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="md"
                      disabled={isSubmitting}
                      onClick={() => handleSaveBundle(false)}
                      className="text-xs font-semibold"
                    >
                      Save as Draft
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      disabled={isSubmitting}
                      onClick={() => handleSaveBundle(true)}
                      className="gap-2 font-semibold shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSubmitting ? "Publishing..." : "Publish Bundle to Website"}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Filterable Bundles Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Published Bundles Catalog</h3>
            <p className="text-xs text-slate-500">
              {filteredBundles.length} test bundles configured in the database
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or exam..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Bundle Title & Target</th>
                <th className="py-3 px-4">Included Tests</th>
                <th className="py-3 px-4">Price / Savings</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBundles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No matching test bundles found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Create a new bundle using the builder wizard above.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedBundles.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-slate-900">{b.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {b.categoryName} • /{b.slug}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <BookOpen className="w-3 h-3" />
                        {b.includedTestsCount} Mocks
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(b.priceInPaise)}
                        </span>
                        {b.originalPriceInPaise && (
                          <span className="text-[11px] text-slate-400 line-through">
                            {formatCurrency(b.originalPriceInPaise)}
                          </span>
                        )}
                      </div>
                      {b.discountPercentage && b.discountPercentage > 0 ? (
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          Save {b.discountPercentage}%
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          b.published && b.status !== "archived"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : b.status === "archived"
                            ? "bg-slate-100 text-slate-600 border border-slate-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.published && b.status !== "archived"
                              ? "bg-emerald-500"
                              : b.status === "archived"
                              ? "bg-slate-400"
                              : "bg-amber-500"
                          }`}
                        />
                        {b.status === "archived"
                          ? "Archived"
                          : b.published
                          ? "Published"
                          : "Draft"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {b.createdAt}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(b)}
                          className="h-7 px-2 text-[11px] gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(b.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          title="Duplicate Bundle"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <Link href={`/series/${b.slug}`} target="_blank">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            title="Preview Public Page"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                          </Button>
                        </Link>

                        {deleteConfirmId === b.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(b.id, b.slug)}
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
                            onClick={() => setDeleteConfirmId(b.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete Bundle"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2.5 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
