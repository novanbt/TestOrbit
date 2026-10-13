export type DifficultyLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  testCount: number;
}

export interface MockTest {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  categoryName: string;
  targetAudience?: string;
  tags?: string[];
  description: string;
  questionCount: number;
  durationMinutes: number;
  maxMarks: number;
  difficulty: DifficultyLevel;
  language: string;
  priceInPaise: number;
  isFree?: boolean;
  topics: string[];
  expectations: string[];
  published: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface BundleIncludedTestItem {
  testId: string;
  testSlug: string;
  testTitle?: string;
  displayOrder: number;
  sectionHeading?: string;
  note?: string;
  previewPolicy?: "none" | "free_sample" | "preview_only";
}

export type BundleStatus = "draft" | "published" | "archived";

export interface TestBundle {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  description: string;
  coverImage?: string;
  categoryId: string;
  categoryName: string;
  subcategory?: string;
  targetAudience?: string;
  targetClassOrExam?: string;
  difficulty?: DifficultyLevel;
  language?: string;
  tags?: string[];
  author?: string;
  includedItems: BundleIncludedTestItem[];
  includedTestsCount: number; // strictly derived from includedItems.length
  includedTestSlugs?: string[]; // for quick indexing & backward compatibility
  priceInPaise: number;
  originalPriceInPaise?: number; // strictly derived from sum of test prices or configured reference
  discountPercentage?: number; // strictly derived
  isFree?: boolean;
  status: BundleStatus;
  published: boolean;
  accessDurationDays?: number;
  attemptLimit?: number;
  isFeatured?: boolean;
  salesCount?: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Backwards compatibility alias
export type TestSeries = TestBundle;

export interface UserBundleEnrollment {
  id: string;
  userId: string;
  bundleId: string;
  bundleSlug: string;
  bundleTitle: string;
  orderId: string;
  purchasedAt: string;
  accessExpiresAt?: string;
  pricePaidInPaise: number;
  includedTestIds: string[];
  includedTestSlugs: string[];
  status: "active" | "expired";
}

export interface UserTestEntitlement {
  id: string;
  userId: string;
  testId: string;
  testSlug: string;
  source: "individual" | "bundle";
  bundleId?: string;
  grantedAt: string;
  expiresAt?: string;
  status: "active" | "expired";
}


export type ProductTypeFilter = "all" | "tests" | "series";
export type SortOption = "relevance" | "price-asc" | "price-desc" | "duration" | "newest";

export interface FilterState {
  searchQuery: string;
  category: string; // 'all' or category slug
  difficulty: string; // 'all' or DifficultyLevel
  priceRange: string; // 'all' | 'free' | 'under-299' | '299-499' | '500-plus'
  productType: ProductTypeFilter;
  sortBy: SortOption;
}

export interface QuestionOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface TestQuestion {
  id: string;
  questionNumber: number;
  text: string;
  codeSnippet?: string;
  options: QuestionOption[];
  correctOptionId: "A" | "B" | "C" | "D";
  marks: number;
  negativeMarks?: number;
  topic: string;
  explanation: string;
}

export type QuestionAttemptStatus =
  | "not-visited"
  | "not-answered"
  | "answered"
  | "marked"
  | "answered-and-marked";

export interface UserResponse {
  questionId: string;
  selectedOption?: "A" | "B" | "C" | "D";
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
}

export interface TestAttemptScorecard {
  totalQuestions: number;
  attemptedCount: number;
  unattemptedCount: number;
  markedForReviewCount: number;
  correctCount: number;
  incorrectCount: number;
  totalMarksScored: number;
  maxMarks: number;
  accuracyPercentage: number;
  timeTakenSeconds: number;
  topicScores: Record<string, { total: number; correct: number }>;
}
