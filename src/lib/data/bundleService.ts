import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { TestBundle, MockTest, BundleIncludedTestItem } from "@/types";
import { TEST_SERIES as BASE_BUNDLES } from "@/data/test-series";
import { MOCK_TESTS } from "@/data/baseTests";

// Canonical in-memory registry for bundles
const canonicalBundleRegistry = new Map<string, TestBundle>();
let isInitialized = false;
let isSyncingFirestore = false;

/**
 * Initializes the in-memory registry with base bundles.
 */
export function initBundleRegistry() {
  if (isInitialized && canonicalBundleRegistry.size > 0) return;

  for (const bundle of BASE_BUNDLES) {
    if (!canonicalBundleRegistry.has(bundle.slug)) {
      canonicalBundleRegistry.set(bundle.slug, bundle);
    }
    if (bundle.id && !canonicalBundleRegistry.has(bundle.id)) {
      canonicalBundleRegistry.set(bundle.id, bundle);
    }
  }

  isInitialized = true;
}

/**
 * Syncs bundles from Firestore collection "testBundles" (or "testSeries") into in-memory registry.
 */
export async function syncBundlesFromFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db || isSyncingFirestore) return;
  isSyncingFirestore = true;

  try {
    const colRef = collection(db, "testBundles");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      snap.forEach((d) => {
        const item = d.data() as TestBundle;
        if (item && item.slug) {
          canonicalBundleRegistry.set(item.slug, item);
          if (item.id) canonicalBundleRegistry.set(item.id, item);
        }
      });
    } else {
      // Also check fallback testSeries collection
      const seriesColRef = collection(db, "testSeries");
      const seriesSnap = await getDocs(seriesColRef);
      if (!seriesSnap.empty) {
        seriesSnap.forEach((d) => {
          const item = d.data() as TestBundle;
          if (item && item.slug) {
            canonicalBundleRegistry.set(item.slug, item);
            if (item.id) canonicalBundleRegistry.set(item.id, item);
          }
        });
      }
    }
  } catch (err) {
    console.warn("[bundleService] Firestore sync warning:", err);
  } finally {
    isSyncingFirestore = false;
  }
}

/**
 * Retrieve all unique canonical bundles (published and drafts).
 */
export function getAllCanonicalBundles(): TestBundle[] {
  initBundleRegistry();
  const unique = new Map<string, TestBundle>();
  for (const b of canonicalBundleRegistry.values()) {
    unique.set(b.id, b);
  }
  return Array.from(unique.values()).sort(
    (a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
  );
}

/**
 * Retrieve all canonical published bundles.
 */
export function getAllCanonicalPublishedBundles(): TestBundle[] {
  return getAllCanonicalBundles().filter((b) => b.published && b.status !== "archived");
}

/**
 * Retrieve a bundle by slug.
 */
export function getCanonicalBundleBySlug(slug: string): TestBundle | undefined {
  initBundleRegistry();
  const bySlug = canonicalBundleRegistry.get(slug);
  if (bySlug) return bySlug;

  // Search through all bundles case-insensitively
  for (const b of canonicalBundleRegistry.values()) {
    if (b.slug.toLowerCase() === slug.toLowerCase()) {
      return b;
    }
  }
  return undefined;
}

/**
 * Retrieve a bundle by ID.
 */
export function getCanonicalBundleById(id: string): TestBundle | undefined {
  initBundleRegistry();
  return canonicalBundleRegistry.get(id);
}

/**
 * Finds all mock test objects for a given test bundle.
 * Returns the tests in the exact displayOrder configured,
 * plus any warnings if a test is missing or archived.
 */
export function resolveBundleTests(bundle: TestBundle): {
  tests: (MockTest & { bundleItem: BundleIncludedTestItem })[];
  missingSlugs: string[];
  combinedReferencePriceInPaise: number;
} {
  // Build lookup map of all available tests
  const testsMap = new Map<string, MockTest>();
  for (const t of MOCK_TESTS) {
    testsMap.set(t.slug, t);
    testsMap.set(t.id, t);
  }

  const items = bundle.includedItems && bundle.includedItems.length > 0
    ? [...bundle.includedItems].sort((a, b) => a.displayOrder - b.displayOrder)
    : (bundle.includedTestSlugs || []).map((slug, idx) => ({
        testId: slug,
        testSlug: slug,
        displayOrder: idx + 1,
      }));

  const resolved: (MockTest & { bundleItem: BundleIncludedTestItem })[] = [];
  const missingSlugs: string[] = [];
  let combinedReferencePriceInPaise = 0;

  for (const item of items) {
    const found = testsMap.get(item.testSlug) || testsMap.get(item.testId);
    if (found) {
      resolved.push({
        ...found,
        bundleItem: item,
      });
      combinedReferencePriceInPaise += found.priceInPaise || 0;
    } else {
      missingSlugs.push(item.testSlug || item.testId);
    }
  }

  return {
    tests: resolved,
    missingSlugs,
    combinedReferencePriceInPaise,
  };
}

/**
 * Calculates genuine reference price, actual savings, and discount percentage for a bundle.
 */
export function calculateBundlePricingMetrics(
  bundleSellingPriceInPaise: number,
  includedTests: MockTest[],
  customReferencePriceInPaise?: number
): {
  referencePriceInPaise: number;
  savingsInPaise: number;
  discountPercentage: number;
} {
  const sumOfTests = includedTests.reduce((acc, t) => acc + (t.priceInPaise || 0), 0);
  const referencePriceInPaise =
    customReferencePriceInPaise && customReferencePriceInPaise > 0
      ? customReferencePriceInPaise
      : sumOfTests;

  const savingsInPaise =
    referencePriceInPaise > bundleSellingPriceInPaise
      ? referencePriceInPaise - bundleSellingPriceInPaise
      : 0;

  const discountPercentage =
    referencePriceInPaise > 0 && savingsInPaise > 0
      ? Math.round((savingsInPaise / referencePriceInPaise) * 100)
      : 0;

  return {
    referencePriceInPaise,
    savingsInPaise,
    discountPercentage,
  };
}

/**
 * Persist a bundle to in-memory registry and Firestore.
 */
export async function saveCanonicalBundle(bundle: TestBundle): Promise<TestBundle> {
  initBundleRegistry();

  const normalized: TestBundle = {
    ...bundle,
    id: bundle.id || `bundle-${Date.now().toString(36)}`,
    slug: bundle.slug.trim().toLowerCase(),
    includedTestsCount: bundle.includedItems ? bundle.includedItems.length : (bundle.includedTestSlugs?.length || 0),
    includedTestSlugs: bundle.includedItems ? bundle.includedItems.map((i) => i.testSlug) : bundle.includedTestSlugs || [],
    published: bundle.status === "published",
    updatedAt: new Date().toISOString(),
  };

  canonicalBundleRegistry.set(normalized.slug, normalized);
  canonicalBundleRegistry.set(normalized.id, normalized);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "testBundles", normalized.id);
      await setDoc(docRef, normalized, { merge: true });

      const legacyDocRef = doc(db, "testSeries", normalized.id);
      await setDoc(legacyDocRef, normalized, { merge: true });
    } catch (err) {
      console.warn("[bundleService] Firestore save warning:", err);
    }
  }

  return normalized;
}

/**
 * Deletes a bundle by ID. Mock tests and purchase histories are preserved.
 */
export async function deleteCanonicalBundle(id: string): Promise<void> {
  initBundleRegistry();

  const existing = canonicalBundleRegistry.get(id);
  if (existing) {
    canonicalBundleRegistry.delete(existing.slug);
  }
  canonicalBundleRegistry.delete(id);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "testBundles", id);
      await deleteDoc(docRef);
      const legacyDocRef = doc(db, "testSeries", id);
      await deleteDoc(legacyDocRef);
    } catch (err) {
      console.warn("[bundleService] Firestore delete warning:", err);
    }
  }
}
