import { TestSeries } from "@/types";

export const TEST_SERIES: TestSeries[] = [
  {
    id: "series-001",
    slug: "jee-main-full-spectrum-bundle",
    title: "JEE Main Complete Mock Series (10 Tests)",
    categoryId: "cat-competitive",
    categoryName: "Competitive Exams",
    targetAudience: "Serious JEE Main 2025/2026 aspirants targeting 99+ percentile in NTA CBT format",
    description: "Curated bundle of 10 full-length Physics, Chemistry, and Mathematics tests designed to mirror real exam difficulty, timing constraints, and percentile normalization.",
    includedTestsCount: 10,
    priceInPaise: 149900,
    originalPriceInPaise: 299000,
    discountPercentage: 50,
    includedTestSlugs: ["jee-main-physics-practice"],
    published: true,
    createdAt: "2026-03-02",
  },
  {
    id: "series-002",
    slug: "class-10-board-excellence-pack",
    title: "Class X All-Subjects Board Exam Power Pack (6 Tests)",
    categoryId: "cat-school",
    categoryName: "School Education",
    targetAudience: "Class X CBSE & State Board students aiming for top marks in final board assessments",
    description: "Full syllabus simulation papers for Mathematics, Science, and Social Science, featuring standard marking keys, model answers, and error prevention guidelines.",
    includedTestsCount: 6,
    priceInPaise: 79900,
    originalPriceInPaise: 119900,
    discountPercentage: 33,
    includedTestSlugs: ["class-10-mathematics-full-syllabus"],
    published: true,
    createdAt: "2026-03-08",
  },
  {
    id: "series-003",
    slug: "full-stack-swe-placement-suite",
    title: "Full-Stack Software Engineer Placement Suite (8 Tests)",
    categoryId: "cat-programming",
    categoryName: "Programming & Technology",
    targetAudience: "Undergraduate CS students, Bootcamp graduates, and engineers preparing for tech interviews",
    description: "Complete pre-interview assessment package covering Core Python, Data Structures & Algorithms, System Design basics, Cloud Architecture, and Database optimization.",
    includedTestsCount: 8,
    priceInPaise: 129900,
    originalPriceInPaise: 249900,
    discountPercentage: 48,
    includedTestSlugs: [
      "python-programming-fundamentals",
      "data-structures-algorithms-core",
      "cloud-architecture-devops-foundations",
    ],
    published: true,
    createdAt: "2026-03-15",
  },
  {
    id: "series-004",
    slug: "global-languages-fluency-pack",
    title: "Global Languages & Multilingual Proficiency Pack (5 Tests)",
    categoryId: "cat-languages",
    categoryName: "Languages",
    targetAudience: "School learners, study-abroad aspirants, and competitive foreign & Indian language test takers",
    description: "Multilingual mock test bundle featuring Hindi, French, German, Spanish, and English language proficiency evaluations.",
    includedTestsCount: 5,
    priceInPaise: 69900,
    originalPriceInPaise: 119900,
    discountPercentage: 42,
    includedTestSlugs: [
      "hindi-bhasha-vyakarana-mock",
      "french-language-delf-proficiency",
      "german-language-a1-a2-certification",
      "spanish-language-dele-preparation",
      "verbal-ability-reading-comprehension",
    ],
    published: true,
    createdAt: "2026-03-20",
  },
];

export function getAllTestSeries(): TestSeries[] {
  return TEST_SERIES.filter((s) => s.published);
}

export function getTestSeriesBySlug(slug: string): TestSeries | undefined {
  return TEST_SERIES.find((s) => s.slug === slug && s.published);
}
