import { MockTest, TestSeries, FilterState, Category } from "@/types";
import { getAllTests } from "./tests";
import { getAllTestSeries } from "./test-series";
import { getCategories } from "./categories";

export interface MarketplaceItem {
  id: string;
  slug: string;
  type: "test" | "series";
  title: string;
  categoryId: string;
  categoryName: string;
  targetAudience: string;
  description: string;
  priceInPaise: number;
  originalPriceInPaise?: number;
  discountPercentage?: number;
  isFree?: boolean;
  questionCount?: number;
  durationMinutes?: number;
  maxMarks?: number;
  difficulty?: string;
  language?: string;
  includedTestsCount?: number;
  isFeatured?: boolean;
  createdAt: string;
}

export function getAllMarketplaceItems(): MarketplaceItem[] {
  const tests: MarketplaceItem[] = getAllTests().map((t) => ({
    id: t.id,
    slug: t.slug,
    type: "test",
    title: t.title,
    categoryId: t.categoryId,
    categoryName: t.categoryName,
    targetAudience: t.targetAudience,
    description: t.description,
    priceInPaise: t.priceInPaise,
    isFree: t.isFree || t.priceInPaise === 0,
    questionCount: t.questionCount,
    durationMinutes: t.durationMinutes,
    maxMarks: t.maxMarks,
    difficulty: t.difficulty,
    language: t.language,
    isFeatured: t.isFeatured,
    createdAt: t.createdAt,
  }));

  const series: MarketplaceItem[] = getAllTestSeries().map((s) => ({
    id: s.id,
    slug: s.slug,
    type: "series",
    title: s.title,
    categoryId: s.categoryId,
    categoryName: s.categoryName,
    targetAudience: s.targetAudience,
    description: s.description,
    priceInPaise: s.priceInPaise,
    originalPriceInPaise: s.originalPriceInPaise,
    discountPercentage: s.discountPercentage,
    isFree: s.priceInPaise === 0,
    includedTestsCount: s.includedTestsCount,
    createdAt: s.createdAt,
  }));

  return [...tests, ...series];
}

export function filterMarketplaceItems(filters: FilterState): MarketplaceItem[] {
  let items = getAllMarketplaceItems();

  // 1. Product Type
  if (filters.productType === "tests") {
    items = items.filter((i) => i.type === "test");
  } else if (filters.productType === "series") {
    items = items.filter((i) => i.type === "series");
  }

  // 2. Category
  if (filters.category && filters.category !== "all") {
    // category might be slug or id
    const categories = getCategories();
    const matchedCategory = categories.find(
      (c) => c.slug === filters.category || c.id === filters.category
    );
    const targetId = matchedCategory ? matchedCategory.id : filters.category;
    items = items.filter((i) => i.categoryId === targetId);
  }

  // 3. Difficulty (filters strictly to matching difficulty)
  if (filters.difficulty && filters.difficulty !== "all") {
    items = items.filter((i) => i.difficulty && i.difficulty.toLowerCase() === filters.difficulty.toLowerCase());
  }

  // 4. Price Range
  if (filters.priceRange && filters.priceRange !== "all") {
    if (filters.priceRange === "free") {
      items = items.filter((i) => i.priceInPaise === 0 || i.isFree);
    } else if (filters.priceRange === "under-299") {
      items = items.filter((i) => i.priceInPaise > 0 && i.priceInPaise < 29900);
    } else if (filters.priceRange === "299-499") {
      items = items.filter((i) => i.priceInPaise >= 29900 && i.priceInPaise <= 49900);
    } else if (filters.priceRange === "500-plus") {
      items = items.filter((i) => i.priceInPaise > 49900);
    }
  }

  // 5. Search Query
  if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
    const q = filters.searchQuery.toLowerCase().trim();
    items = items.filter((i) => {
      const matchTitle = i.title.toLowerCase().includes(q);
      const matchDesc = i.description.toLowerCase().includes(q);
      const matchCat = i.categoryName.toLowerCase().includes(q);
      const matchAudience = i.targetAudience.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCat || matchAudience;
    });
  }

  // 6. Sorting
  if (filters.sortBy === "price-asc") {
    items.sort((a, b) => a.priceInPaise - b.priceInPaise);
  } else if (filters.sortBy === "price-desc") {
    items.sort((a, b) => b.priceInPaise - a.priceInPaise);
  } else if (filters.sortBy === "duration") {
    items.sort((a, b) => (b.durationMinutes || 0) - (a.durationMinutes || 0));
  } else if (filters.sortBy === "newest") {
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return items;
}
