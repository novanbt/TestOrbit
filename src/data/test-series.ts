import { TestBundle } from "@/types";
import {
  getAllCanonicalBundles,
  getAllCanonicalPublishedBundles,
  getCanonicalBundleBySlug,
  getCanonicalBundleById,
  fetchCanonicalBundles,
  fetchCanonicalPublishedBundles,
  fetchCanonicalFeaturedBundles,
  getCanonicalFeaturedBundles,
  fetchCanonicalBundleBySlug,
  resolveBundleTests,
  calculateBundlePricingMetrics,
  saveCanonicalBundle,
  deleteCanonicalBundle,
  bulkDeleteCanonicalBundles,
} from "@/lib/data/bundleService";

export const TEST_SERIES: TestBundle[] = [];

export function getAllTestSeries(): TestBundle[] {
  return getAllCanonicalPublishedBundles();
}

export function getTestSeriesBySlug(slug: string): TestBundle | undefined {
  return getCanonicalBundleBySlug(slug);
}

// Re-export canonical bundle service methods
export {
  getAllCanonicalBundles,
  getAllCanonicalPublishedBundles,
  fetchCanonicalBundles,
  fetchCanonicalPublishedBundles,
  fetchCanonicalFeaturedBundles,
  getCanonicalFeaturedBundles,
  fetchCanonicalBundleBySlug,
  getCanonicalBundleBySlug,
  getCanonicalBundleById,
  resolveBundleTests,
  calculateBundlePricingMetrics,
  saveCanonicalBundle,
  deleteCanonicalBundle,
  bulkDeleteCanonicalBundles,
};
