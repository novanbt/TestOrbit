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

export const FEATURED_TEST_SLUGS = [
  "class-10-mathematics-full-syllabus",
  "jee-main-physics-practice",
  "ssc-cgl-quantitative-aptitude",
  "python-programming-fundamentals",
  "hindi-bhasha-vyakarana-mock",
  "neet-biology-high-yield",
  "cloud-architecture-devops-foundations",
  "financial-accounting-basics",
];
