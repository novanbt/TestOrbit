import { Category } from "@/types";
import {
  BASE_CATEGORIES,
  getAllCanonicalCategories,
  getCanonicalCategoryBySlug,
  fetchCanonicalCategories,
  saveCanonicalCategory,
  deleteCanonicalCategory,
} from "@/lib/data/categoryService";

export const CATEGORIES: Category[] = BASE_CATEGORIES;

export function getCategories(): Category[] {
  return getAllCanonicalCategories();
}

export function getCategoryBySlug(slug: string): Category | undefined {
  if (slug === "aptitude-reasoning") {
    return getCanonicalCategoryBySlug("languages");
  }
  return getCanonicalCategoryBySlug(slug);
}

export {
  getAllCanonicalCategories,
  getCanonicalCategoryBySlug,
  fetchCanonicalCategories,
  saveCanonicalCategory,
  deleteCanonicalCategory,
};
