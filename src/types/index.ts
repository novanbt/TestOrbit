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
  targetAudience: string;
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
}

export interface TestSeries {
  id: string;
  slug: string;
  title: string;
  categoryId: string;
  categoryName: string;
  targetAudience: string;
  description: string;
  includedTestsCount: number;
  priceInPaise: number;
  originalPriceInPaise?: number;
  discountPercentage?: number;
  includedTestSlugs?: string[];
  published: boolean;
  createdAt: string;
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
