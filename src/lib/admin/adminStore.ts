import { MockTest, TestQuestion, TestSeries, Category } from "@/types";
import { MOCK_TESTS } from "@/data/tests";
import { CATEGORIES } from "@/data/categories";
import { TEST_SERIES } from "@/data/test-series";
import { CURATED_QUESTION_BANK } from "@/data/question-bank";

const STORAGE_CUSTOM_TESTS = "testorbit_admin_tests";
const STORAGE_CUSTOM_SERIES = "testorbit_admin_series";
const STORAGE_CUSTOM_QUESTIONS = "testorbit_admin_questions";
const STORAGE_CUSTOM_CATEGORIES = "testorbit_admin_categories";

export const ADMIN_CREDENTIALS = {
  email: "testorbit@ellipse.com",
  password: "tdSUi4rqJ_NN3n4",
};

export const ADMIN_AUTH_STORAGE_KEY = "testorbit_admin_session";

export function checkAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const session = sessionStorage.getItem(ADMIN_AUTH_STORAGE_KEY) || localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    return session === "true";
  } catch {
    return false;
  }
}

export function setAdminSession(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      sessionStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
      localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, "true");
    } else {
      sessionStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    }
  } catch {}
}

export function loadAllAdminTests(): MockTest[] {
  if (typeof window === "undefined") return MOCK_TESTS;
  try {
    const customStr = localStorage.getItem(STORAGE_CUSTOM_TESTS);
    const custom: MockTest[] = customStr ? JSON.parse(customStr) : [];
    // Custom tests override or append to base tests
    const customSlugs = new Set(custom.map((t) => t.slug));
    const baseRemaining = MOCK_TESTS.filter((t) => !customSlugs.has(t.slug));
    return [...custom, ...baseRemaining];
  } catch {
    return MOCK_TESTS;
  }
}

export function saveAdminTests(tests: MockTest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_CUSTOM_TESTS, JSON.stringify(tests));
  } catch {}
}

export function loadAllAdminSeries(): TestSeries[] {
  if (typeof window === "undefined") return TEST_SERIES;
  try {
    const customStr = localStorage.getItem(STORAGE_CUSTOM_SERIES);
    const custom: TestSeries[] = customStr ? JSON.parse(customStr) : [];
    const customSlugs = new Set(custom.map((s) => s.slug));
    const baseRemaining = TEST_SERIES.filter((s) => !customSlugs.has(s.slug));
    return [...custom, ...baseRemaining];
  } catch {
    return TEST_SERIES;
  }
}

export function saveAdminSeries(series: TestSeries[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_CUSTOM_SERIES, JSON.stringify(series));
  } catch {}
}

export function loadAllAdminCategories(): Category[] {
  if (typeof window === "undefined") return CATEGORIES;
  try {
    const customStr = localStorage.getItem(STORAGE_CUSTOM_CATEGORIES);
    const custom: Category[] = customStr ? JSON.parse(customStr) : [];
    const customSlugs = new Set(custom.map((c) => c.slug));
    const baseRemaining = CATEGORIES.filter((c) => !customSlugs.has(c.slug));
    return [...custom, ...baseRemaining];
  } catch {
    return CATEGORIES;
  }
}

export function saveAdminCategories(categories: Category[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_CUSTOM_CATEGORIES, JSON.stringify(categories));
  } catch {}
}

export function loadQuestionsForTest(testSlug: string): TestQuestion[] {
  if (typeof window === "undefined") return CURATED_QUESTION_BANK[testSlug] || [];
  try {
    const customStr = localStorage.getItem(STORAGE_CUSTOM_QUESTIONS);
    const customBank: Record<string, TestQuestion[]> = customStr ? JSON.parse(customStr) : {};
    if (customBank[testSlug]) {
      return customBank[testSlug];
    }
  } catch {}
  return CURATED_QUESTION_BANK[testSlug] || [];
}

export function saveQuestionsForTest(testSlug: string, questions: TestQuestion[]): void {
  if (typeof window === "undefined") return;
  try {
    const customStr = localStorage.getItem(STORAGE_CUSTOM_QUESTIONS);
    const customBank: Record<string, TestQuestion[]> = customStr ? JSON.parse(customStr) : {};
    customBank[testSlug] = questions;
    localStorage.setItem(STORAGE_CUSTOM_QUESTIONS, JSON.stringify(customBank));
  } catch {}
}
