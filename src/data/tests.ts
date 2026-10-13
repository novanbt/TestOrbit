import { MockTest } from "@/types";
import { MOCK_TESTS, FEATURED_TEST_SLUGS } from "./baseTests";

export { MOCK_TESTS, FEATURED_TEST_SLUGS };

export function getAllTests(): MockTest[] {
  return MOCK_TESTS.filter((t) => t.published);
}


export function getFeaturedTests(): MockTest[] {
  const featured = MOCK_TESTS.filter((t) => t.published && t.isFeatured);
  return featured.sort((a, b) => {
    const aIndex = FEATURED_TEST_SLUGS.indexOf(a.slug);
    const bIndex = FEATURED_TEST_SLUGS.indexOf(b.slug);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
}

export function getTestBySlug(slug: string): MockTest | undefined {
  return MOCK_TESTS.find((t) => t.slug === slug && t.published);
}

export function getTestsByCategory(categorySlug: string): MockTest[] {
  return MOCK_TESTS.filter(
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
} from "@/lib/data/testService";


