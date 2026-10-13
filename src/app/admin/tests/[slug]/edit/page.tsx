"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  BookOpen,
  Plus,
  X,
  FileQuestion,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { MockTest, DifficultyLevel, Category } from "@/types";
import {
  getAdminTestBySlug,
  saveAdminTest,
  getAdminCategories,
  deriveTagsForTest,
} from "@/lib/admin/adminStore";
import { saveTestServerAction, getTestBySlugServerAction } from "@/app/actions/testActions";
import { Button } from "@/components/ui/Button";

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const slugParam = (params?.slug as string) || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [existingTest, setExistingTest] = useState<MockTest | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [questionCount, setQuestionCount] = useState(25);
  const [maxMarks, setMaxMarks] = useState(100);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Intermediate");
  const [language, setLanguage] = useState("English");
  const [priceInRupees, setPriceInRupees] = useState(299);
  const [isFree, setIsFree] = useState(false);
  const [published, setPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [expectations, setExpectations] = useState<string[]>([]);
  const [newExpectation, setNewExpectation] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const populateFields = (test: MockTest) => {
    setExistingTest(test);
    setTitle(test.title);
    setCategoryId(test.categoryId);
    if (test.tags && test.tags.length > 0) {
      setTags(test.tags);
    } else {
      setTags(deriveTagsForTest(test));
    }
    setDescription(test.description);
    setDurationMinutes(test.durationMinutes);
    setQuestionCount(test.questionCount);
    setMaxMarks(test.maxMarks);
    setDifficulty(test.difficulty);
    setLanguage(test.language || "English");
    setPriceInRupees(Math.round((test.priceInPaise || 0) / 100));
    setIsFree(Boolean(test.isFree));
    setPublished(test.published);
    setIsFeatured(Boolean(test.isFeatured));
    setTopics(test.topics || []);
    setExpectations(test.expectations || []);
    setErrorMessage(null);
  };

  useEffect(() => {
    const cats = getAdminCategories();
    setCategories(cats);

    const test = getAdminTestBySlug(slugParam);
    if (test) {
      populateFields(test);
    } else {
      // Async fallback to server action
      getTestBySlugServerAction(slugParam).then((res) => {
        if (res.success && res.data) {
          saveAdminTest(res.data);
          populateFields(res.data);
        } else {
          setErrorMessage(`Mock test with slug "${slugParam}" not found.`);
        }
      });
    }
  }, [slugParam]);

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

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const handleAddExpectation = () => {
    if (newExpectation.trim() && !expectations.includes(newExpectation.trim())) {
      setExpectations([...expectations, newExpectation.trim()]);
      setNewExpectation("");
    }
  };

  const handleRemoveExpectation = (index: number) => {
    setExpectations(expectations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingTest) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!title.trim()) {
      setErrorMessage("Please enter a test title.");
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);
    const categoryName = selectedCat ? selectedCat.name : existingTest.categoryName;

    setIsSubmitting(true);

    const updatedTest: MockTest = {
      ...existingTest,
      title: title.trim(),
      categoryId: categoryId || existingTest.categoryId,
      categoryName,
      tags: tags.length > 0 ? tags : ["General"],
      targetAudience: tags.join(", ") || "All Students",
      description: description.trim(),
      questionCount: Number(questionCount) || existingTest.questionCount,
      durationMinutes: Number(durationMinutes) || existingTest.durationMinutes,
      maxMarks: Number(maxMarks) || existingTest.maxMarks,
      difficulty,
      language,
      priceInPaise: isFree ? 0 : Math.round(priceInRupees * 100),
      isFree,
      topics,
      expectations,
      published,
      isFeatured,
    };

    try {
      saveAdminTest(updatedTest);
      const result = await saveTestServerAction(updatedTest);
      if (!result.success) {
        setErrorMessage(result.error || "Failed to update mock test in database.");
      } else {
        setExistingTest(updatedTest);
        setSuccessMessage("Mock test updated and synchronized successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || "An unexpected error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!existingTest && !errorMessage) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/tests"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Mock Tests
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Edit Mock Test
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Slug: /tests/{slugParam}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href={`/admin/tests/${slugParam}/questions`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
              <FileQuestion className="w-4 h-4" />
              Manage Questions ({questionCount})
            </Button>
          </Link>
          <Link href={`/tests/${slugParam}`} target="_blank">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Eye className="w-4 h-4" />
              Preview Live
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
        {/* Section 1 */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            General Information
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
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
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Search & Discovery Tags
              </label>
              <span className="text-[11px] text-slate-400">Press Enter or comma to add</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 min-h-[46px] bg-slate-50/50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-indigo-900 ml-0.5 cursor-pointer text-indigo-400 hover:text-indigo-700"
                    title="Remove tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length === 0 ? "Type tag (e.g. CBSE, Class 10, JEE) and press Enter..." : "Add more tags..."}
                className="flex-1 min-w-[140px] bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none py-1"
              />
              {tagInput.trim() && (
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-2 py-1 rounded bg-indigo-600 text-white text-xs font-medium cursor-pointer"
                >
                  Add
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-400">Popular:</span>
              {["Class 10", "Class 12", "CBSE", "JEE Main", "NEET", "Board Exam", "Mathematics", "Science", "PYQ"].map(
                (suggested) => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => handleAddTag(suggested)}
                    disabled={tags.some((t) => t.toLowerCase() === suggested.toLowerCase())}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    +{suggested}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Section 2 */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Examination Parameters & Pricing
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                min={5}
                max={360}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Questions
              </label>
              <input
                type="number"
                min={1}
                max={300}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Marks
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={maxMarks}
                onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                disabled={isFree}
                value={isFree ? 0 : priceInRupees}
                onChange={(e) => setPriceInRupees(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-50"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-6 border-t border-slate-100">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Free Assessment</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Published</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-700">Featured On Homepage</span>
            </label>
          </div>
        </div>

        {/* Section 3 */}
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Topics & Expectations
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Covered Topics
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {topics.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(idx)}
                    className="hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTopic())}
                placeholder="Add a syllabus topic and press enter..."
                className="flex-1 px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddTopic} className="text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              What Students Can Expect
            </label>
            <div className="space-y-1.5 mb-2">
              {expectations.map((exp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{exp}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExpectation(idx)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExpectation}
                onChange={(e) => setNewExpectation(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExpectation())}
                placeholder="Add expectation..."
                className="flex-1 px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddExpectation} className="text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            className="gap-2 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Update Mock Test</span>
          </Button>
          <Link href="/admin/tests">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
