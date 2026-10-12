import { Category } from "@/types";

export const CATEGORIES: Category[] = [
  {
    id: "cat-school",
    name: "School Education",
    slug: "school-education",
    iconName: "GraduationCap",
    description: "Curriculum-aligned mock assessments for Classes V–XII (CBSE, ICSE, State Boards).",
    testCount: 15,
  },
  {
    id: "cat-competitive",
    name: "Competitive Exams",
    slug: "competitive-exams",
    iconName: "Target",
    description: "Standardized practice simulations for JEE, NEET, UPSC, SSC CGL, Banking & Railways.",
    testCount: 29,
  },
  {
    id: "cat-college",
    name: "College & University",
    slug: "college-university",
    iconName: "Building2",
    description: "Undergraduate course mocks, semester finals, engineering fundamentals, and GATE prep.",
    testCount: 16,
  },
  {
    id: "cat-programming",
    name: "Programming & Technology",
    slug: "programming-technology",
    iconName: "Code2",
    description: "Technical evaluations in Python, DSA, Web Development, Cloud Computing, and AI/ML.",
    testCount: 23,
  },
  {
    id: "cat-languages",
    name: "Languages",
    slug: "languages",
    iconName: "Languages",
    description: "Evaluations across Hindi, French, German, Spanish, Sanskrit, Japanese, and English communication.",
    testCount: 25,
  },
  {
    id: "cat-professional",
    name: "Professional Skills",
    slug: "professional-skills",
    iconName: "Briefcase",
    description: "Industry readiness tests, financial analysis, business acumen, and workplace tooling.",
    testCount: 11,
  },
];

export function getCategories(): Category[] {
  return CATEGORIES;
}

export function getCategoryBySlug(slug: string): Category | undefined {
  if (slug === "aptitude-reasoning") {
    return CATEGORIES.find((cat) => cat.slug === "languages");
  }
  return CATEGORIES.find((cat) => cat.slug === slug);
}
