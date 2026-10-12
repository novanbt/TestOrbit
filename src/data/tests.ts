import { MockTest } from "@/types";
import { schoolTests } from "./tests/school";
import { competitiveTests } from "./tests/competitive";
import { collegeTests } from "./tests/college";
import { programmingTests } from "./tests/programming";
import { languagesTests } from "./tests/languages";
import { professionalTests } from "./tests/professional";

export const MOCK_TESTS: MockTest[] = [
  ...schoolTests,
  ...competitiveTests,
  ...collegeTests,
  ...programmingTests,
  ...languagesTests,
  ...professionalTests,
];

export function getAllTests(): MockTest[] {
  return MOCK_TESTS.filter((t) => t.published);
}

// Curated display order to complete exactly 2 rows of 4 columns (8 tests total)
const FEATURED_TEST_SLUGS = [
  "class-10-mathematics-full-syllabus",
  "jee-main-physics-practice",
  "ssc-cgl-quantitative-aptitude",
  "python-programming-fundamentals",
  "hindi-bhasha-vyakarana-mock",
  "neet-biology-high-yield",
  "cloud-architecture-devops-foundations",
  "financial-accounting-basics",
];

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
