import { MockTest, TestQuestion, TestSeries, Category } from "@/types";
import { MOCK_TESTS } from "@/data/tests";
import { CURATED_QUESTION_BANK, getQuestionsForTest } from "@/data/question-bank";
import { TEST_SERIES } from "@/data/test-series";
import { CATEGORIES } from "@/data/categories";

const STORAGE_KEYS = {
  TESTS: "testorbit_admin_tests",
  SERIES: "testorbit_admin_series",
  CATEGORIES: "testorbit_admin_categories",
  QUESTIONS_PREFIX: "testorbit_admin_questions_",
};

function isClient(): boolean {
  return typeof window !== "undefined";
}

function dispatchUpdateEvent() {
  if (isClient()) {
    window.dispatchEvent(new Event("testorbit_admin_data_updated"));
  }
}

/**
 * Derives clean searchable tags from test metadata when not explicitly defined
 */
export function deriveTagsForTest(test: {
  categoryName?: string;
  targetAudience?: string;
  title?: string;
  tags?: string[];
}): string[] {
  if (test.tags && Array.isArray(test.tags) && test.tags.length > 0) {
    return test.tags;
  }
  const tags: string[] = [];
  if (test.categoryName) {
    const cleaned = test.categoryName.replace(/Exams|Education|Certification|Development/gi, "").trim();
    if (cleaned) tags.push(cleaned);
  }
  if (test.targetAudience) {
    const raw = test.targetAudience
      .replace(/preparing for|students|aspirants|stream|candidates|targeting/gi, "")
      .split(/[,;&]|\band\b/i)
      .map((s) => s.trim())
      .filter((s) => s.length >= 3 && s.length <= 25);
    tags.push(...raw);
  }
  const unique = Array.from(new Set(tags.filter(Boolean))).slice(0, 4);
  return unique.length > 0 ? unique : ["Comprehensive"];
}

/**
 * -------------------------------------------------------------
 * 1. MOCK TESTS STORAGE
 * -------------------------------------------------------------
 */
export function getAdminTests(): MockTest[] {
  let list: MockTest[] = MOCK_TESTS;
  if (isClient()) {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TESTS);
      if (saved) {
        list = JSON.parse(saved);
      }
    } catch {}
  }
  return list.map((t) => ({
    ...t,
    tags: t.tags && t.tags.length > 0 ? t.tags : deriveTagsForTest(t),
  }));
}

export function getAdminTestBySlug(slug: string): MockTest | undefined {
  const tests = getAdminTests();
  return tests.find((t) => t.slug === slug);
}

export function saveAdminTest(test: MockTest): void {
  if (!isClient()) return;
  const tests = getAdminTests();
  const existingIndex = tests.findIndex((t) => t.id === test.id || t.slug === test.slug);

  let updated: MockTest[];
  if (existingIndex >= 0) {
    updated = [...tests];
    updated[existingIndex] = { ...updated[existingIndex], ...test };
  } else {
    updated = [test, ...tests];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(updated));
    dispatchUpdateEvent();
  } catch (err) {
    console.error("Failed to save test:", err);
  }
}

export function deleteAdminTest(id: string): void {
  if (!isClient()) return;
  const tests = getAdminTests();
  const updated = tests.filter((t) => t.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(updated));
    dispatchUpdateEvent();
  } catch (err) {
    console.error("Failed to delete test:", err);
  }
}

/**
 * -------------------------------------------------------------
 * 2. QUESTION BANK STORAGE
 * -------------------------------------------------------------
 */
export function getAdminTestQuestions(testSlug: string): TestQuestion[] {
  if (!isClient()) {
    return CURATED_QUESTION_BANK[testSlug] || [];
  }

  try {
    const key = STORAGE_KEYS.QUESTIONS_PREFIX + testSlug;
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  // Fallback to static question bank
  const staticQuestions = CURATED_QUESTION_BANK[testSlug];
  if (staticQuestions && staticQuestions.length > 0) {
    return staticQuestions;
  }

  // Fallback to generator
  const test = getAdminTestBySlug(testSlug);
  if (test) {
    return getQuestionsForTest(test);
  }
  return [];
}

export function saveAdminTestQuestion(testSlug: string, question: TestQuestion): void {
  if (!isClient()) return;
  const questions = getAdminTestQuestions(testSlug);
  const existingIndex = questions.findIndex((q) => q.id === question.id);

  let updated: TestQuestion[];
  if (existingIndex >= 0) {
    updated = [...questions];
    updated[existingIndex] = { ...updated[existingIndex], ...question };
  } else {
    updated = [...questions, question];
  }

  // Ensure question numbers are sequentially assigned
  updated = updated.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));

  try {
    const key = STORAGE_KEYS.QUESTIONS_PREFIX + testSlug;
    localStorage.setItem(key, JSON.stringify(updated));

    // Also update questionCount in the test if it exists
    const test = getAdminTestBySlug(testSlug);
    if (test) {
      saveAdminTest({
        ...test,
        questionCount: updated.length,
      });
    }

    dispatchUpdateEvent();
  } catch (err) {
    console.error("Failed to save question:", err);
  }
}

export function deleteAdminTestQuestion(testSlug: string, questionId: string): void {
  if (!isClient()) return;
  const questions = getAdminTestQuestions(testSlug);
  const updated = questions
    .filter((q) => q.id !== questionId)
    .map((q, idx) => ({ ...q, questionNumber: idx + 1 }));

  try {
    const key = STORAGE_KEYS.QUESTIONS_PREFIX + testSlug;
    localStorage.setItem(key, JSON.stringify(updated));

    // Also update test question count
    const test = getAdminTestBySlug(testSlug);
    if (test) {
      saveAdminTest({
        ...test,
        questionCount: updated.length,
      });
    }

    dispatchUpdateEvent();
  } catch (err) {
    console.error("Failed to delete question:", err);
  }
}

/**
 * -------------------------------------------------------------
 * 3. TEST SERIES STORAGE
 * -------------------------------------------------------------
 */
export function getAdminSeries(): TestSeries[] {
  let list: TestSeries[] = TEST_SERIES;
  if (isClient()) {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERIES);
      if (saved) {
        list = JSON.parse(saved);
      }
    } catch {}
  }
  return list.map((s) => ({
    ...s,
    tags: s.tags && s.tags.length > 0 ? s.tags : deriveTagsForTest(s),
  }));
}

export function getAdminSeriesBySlug(slug: string): TestSeries | undefined {
  const series = getAdminSeries();
  return series.find((s) => s.slug === slug);
}

export function saveAdminSeries(series: TestSeries): void {
  if (!isClient()) return;
  const list = getAdminSeries();
  const existingIndex = list.findIndex((s) => s.id === series.id || s.slug === series.slug);

  const normalized: TestSeries = {
    ...series,
    includedTestsCount: series.includedItems ? series.includedItems.length : (series.includedTestSlugs?.length || 0),
    includedTestSlugs: series.includedItems ? series.includedItems.map((i) => i.testSlug) : series.includedTestSlugs || [],
    updatedAt: new Date().toISOString(),
  };

  let updated: TestSeries[];
  if (existingIndex >= 0) {
    updated = [...list];
    updated[existingIndex] = { ...updated[existingIndex], ...normalized };
  } else {
    updated = [normalized, ...list];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(updated));
    dispatchUpdateEvent();
  } catch (err) {
    console.error("Failed to save series:", err);
  }
}

export function duplicateAdminSeries(id: string): TestSeries | undefined {
  if (!isClient()) return undefined;
  const list = getAdminSeries();
  const target = list.find((s) => s.id === id);
  if (!target) return undefined;

  const copyId = `bundle-${Date.now().toString(36)}`;
  const copySlug = `${target.slug}-copy-${Math.random().toString(36).substring(2, 5)}`;
  const duplicated: TestSeries = {
    ...target,
    id: copyId,
    slug: copySlug,
    title: `${target.title} (Copy)`,
    status: "draft",
    published: false,
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString(),
  };

  const updated = [duplicated, ...list];
  try {
    localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(updated));
    dispatchUpdateEvent();
  } catch (err) {
    console.error("Failed to duplicate series:", err);
  }
  return duplicated;
}

export function deleteAdminSeries(id: string): void {
  if (!isClient()) return;
  const list = getAdminSeries();
  const updated = list.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.SERIES, JSON.stringify(updated));
    dispatchUpdateEvent();
  } catch (err) {
    console.error("Failed to delete series:", err);
  }
}


/**
 * -------------------------------------------------------------
 * 4. CATEGORIES STORAGE
 * -------------------------------------------------------------
 */
export function getAdminCategories(): Category[] {
  if (!isClient()) return CATEGORIES;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return CATEGORIES;
}

export function saveAdminCategory(category: Category): void {
  if (!isClient()) return;
  const list = getAdminCategories();
  const existingIndex = list.findIndex((c) => c.id === category.id || c.slug === category.slug);

  let updated: Category[];
  if (existingIndex >= 0) {
    updated = [...list];
    updated[existingIndex] = { ...updated[existingIndex], ...category };
  } else {
    updated = [...list, category];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    dispatchUpdateEvent();
  } catch (err) {
    console.error("Failed to save category:", err);
  }
}

export function deleteAdminCategory(id: string): void {
  if (!isClient()) return;
  const list = getAdminCategories();
  const updated = list.filter((c) => c.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    dispatchUpdateEvent();
  } catch (err) {
    console.error("Failed to delete category:", err);
  }
}
