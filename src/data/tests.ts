import { MockTest } from "@/types";
import { MOCK_TESTS, FEATURED_TEST_SLUGS } from "./baseTests";
import {
  getAllCanonicalPublishedTests,
  getCanonicalFeaturedTests,
  getCanonicalTestBySlug,
} from "@/lib/data/testService";

export { MOCK_TESTS, FEATURED_TEST_SLUGS };

export function getAllTests(): MockTest[] {
  return getAllCanonicalPublishedTests();
}

export function getFeaturedTests(): MockTest[] {
  return getCanonicalFeaturedTests();
}

export function getTestBySlug(slug: string): MockTest | undefined {
  return getCanonicalTestBySlug(slug, true);
}

export function getTestsByCategory(categorySlug: string): MockTest[] {
  const all = getAllCanonicalPublishedTests();
  return all.filter(
    (t) => t.published && (categorySlug === "all" || t.categoryId === categorySlug)
  );
}

// Re-export canonical database methods for dynamic pages
export {
  getCanonicalTestBySlug,
  getCanonicalFeaturedTests,
  getAllCanonicalPublishedTests,
  fetchCanonicalTests,
  fetchCanonicalPublishedTests,
  fetchCanonicalFeaturedTests,
  fetchCanonicalTestBySlug,
  saveCanonicalTest,
  deleteCanonicalTest,
  purgeCanonicalTesterTests,
  saveCanonicalQuestions,
  fetchCanonicalQuestionsForTest,
} from "@/lib/data/testService";
