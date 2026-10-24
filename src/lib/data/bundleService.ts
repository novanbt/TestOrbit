import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { ensureAdminAuthenticated } from "@/lib/firebase/serverAuth";
import { TestBundle, MockTest, BundleIncludedTestItem } from "@/types";
import { TEST_SERIES as BASE_BUNDLES } from "@/data/test-series";
import { getAllCanonicalPublishedTests, getCanonicalTestBySlug } from "./testService";

// Canonical in-memory registry for bundles
const canonicalBundleRegistry = new Map<string, TestBundle>();
let isInitialized = false;
let isSyncingFirestore = false;

// Persistent deletion tracking for test bundles
let allBaseBundlesDeleted = true;
const deletedBundleSlugs = new Set<string>();
const deletedBundleIds = new Set<string>();

function loadLocalCache() {
  allBaseBundlesDeleted = true;
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("testorbit_bundle_catalog_state");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.deletedBundleSlugs)) {
          parsed.deletedBundleSlugs.forEach((s: string) => deletedBundleSlugs.add(s.toLowerCase()));
        }
        if (Array.isArray(parsed.deletedBundleIds)) {
          parsed.deletedBundleIds.forEach((id: string) => deletedBundleIds.add(id));
        }
      }
    } catch {}
  }
}

function syncLocalCache() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        "testorbit_bundle_catalog_state",
        JSON.stringify({
          allBaseBundlesDeleted: true,
          deletedBundleSlugs: Array.from(deletedBundleSlugs),
          deletedBundleIds: Array.from(deletedBundleIds),
        })
      );
    } catch {}
  }
}

loadLocalCache();

/**
 * Initializes the in-memory registry. Only bundles from Firestore/database are loaded.
 */
export function initBundleRegistry() {
  if (isInitialized) return;
  loadLocalCache();
  allBaseBundlesDeleted = true;
  isInitialized = true;
}

/**
 * Syncs bundles from Firestore collection "testBundles" into in-memory registry.
 */
export async function syncBundlesFromFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db || isSyncingFirestore) return;
  isSyncingFirestore = true;

  try {
    // 1. Fetch catalog manifest state from Firestore
    try {
      const manifestDoc = await getDoc(doc(db, "testBundles", "_bundle_catalog_state"));
      if (manifestDoc.exists()) {
        const mData = manifestDoc.data();
        if (mData?.allBaseBundlesDeleted !== undefined) {
          allBaseBundlesDeleted = Boolean(mData.allBaseBundlesDeleted);
        } else {
          allBaseBundlesDeleted = true;
        }
        if (Array.isArray(mData?.deletedBundleSlugs)) {
          mData.deletedBundleSlugs.forEach((s: string) => deletedBundleSlugs.add(s.toLowerCase()));
        }
        if (Array.isArray(mData?.deletedBundleIds)) {
          mData.deletedBundleIds.forEach((id: string) => deletedBundleIds.add(id));
        }
        syncLocalCache();
      }
    } catch (err) {
      console.warn("[bundleService] Catalog manifest sync notice:", err);
    }

    // 2. Purge deleted bundles
    for (const [key, bundle] of canonicalBundleRegistry.entries()) {
      if (deletedBundleSlugs.has(bundle.slug.toLowerCase()) || (bundle.id && deletedBundleIds.has(bundle.id))) {
        canonicalBundleRegistry.delete(key);
      }
    }

    // 3. Load active bundles from Firestore
    const colRef = collection(db, "testBundles");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      snap.forEach((d) => {
        if (d.id === "_bundle_catalog_state") return;
        const data = d.data() as Partial<TestBundle>;
        const item: TestBundle = { id: d.id, ...data } as TestBundle;
        if (item && item.slug) {
          const sLower = item.slug.toLowerCase();
          if (!deletedBundleSlugs.has(sLower) && (!item.id || !deletedBundleIds.has(item.id))) {
            canonicalBundleRegistry.set(item.slug, item);
            canonicalBundleRegistry.set(sLower, item);
            if (item.id) canonicalBundleRegistry.set(item.id, item);
          }
        }
      });
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
    const sLower = b.slug.toLowerCase();
    if (
      allBaseBundlesDeleted &&
      BASE_BUNDLES.some((bb) => bb.slug.toLowerCase() === sLower || (bb.id && b.id && bb.id === b.id))
    ) {
      continue;
    }
    if (!deletedBundleSlugs.has(sLower) && (!b.id || !deletedBundleIds.has(b.id))) {
      unique.set(b.id || b.slug, b);
    }
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
 * Async getter for all canonical bundles with Firestore sync.
 */
export async function fetchCanonicalBundles(): Promise<TestBundle[]> {
  initBundleRegistry();
  await syncBundlesFromFirestore();
  return getAllCanonicalBundles();
}

/**
 * Async getter for all published canonical bundles with Firestore sync.
 */
export async function fetchCanonicalPublishedBundles(): Promise<TestBundle[]> {
  initBundleRegistry();
  await syncBundlesFromFirestore();
  return getAllCanonicalPublishedBundles();
}

/**
 * Retrieve canonical featured bundles (published bundles marked as featured).
 * Falls back to first 3 published bundles if none are explicitly featured.
 */
export function getCanonicalFeaturedBundles(): TestBundle[] {
  const published = getAllCanonicalPublishedBundles();
  const featured = published.filter((b) => Boolean(b.isFeatured));
  if (featured.length > 0) {
    return featured;
  }
  return published.slice(0, 3);
}

/**
 * Async getter for featured canonical bundles with Firestore sync.
 */
export async function fetchCanonicalFeaturedBundles(): Promise<TestBundle[]> {
  initBundleRegistry();
  await syncBundlesFromFirestore();
  return getCanonicalFeaturedBundles();
}

/**
 * Retrieve a bundle by slug with Firestore sync.
 */
export async function fetchCanonicalBundleBySlug(slug: string): Promise<TestBundle | undefined> {
  initBundleRegistry();
  await syncBundlesFromFirestore();
  return getCanonicalBundleBySlug(slug);
}

/**
 * Retrieve a bundle by slug.
 */
export function getCanonicalBundleBySlug(slug: string): TestBundle | undefined {
  initBundleRegistry();
  if (!slug) return undefined;
  const clean = slug.trim().toLowerCase();

  if (deletedBundleSlugs.has(clean)) return undefined;
  if (allBaseBundlesDeleted && !canonicalBundleRegistry.has(clean)) return undefined;

  const bySlug = canonicalBundleRegistry.get(clean) || canonicalBundleRegistry.get(slug);
  if (bySlug) return bySlug;

  for (const b of canonicalBundleRegistry.values()) {
    if (b.slug.toLowerCase() === clean) {
      return b;
    }
  }

  if (!allBaseBundlesDeleted) {
    const base = BASE_BUNDLES.find((b) => b.slug.toLowerCase() === clean);
    if (base && !deletedBundleSlugs.has(clean)) return base;
  }

  return undefined;
}

/**
 * Retrieve a bundle by ID.
 */
export function getCanonicalBundleById(id: string): TestBundle | undefined {
  initBundleRegistry();
  if (!id) return undefined;
  if (deletedBundleIds.has(id)) return undefined;

  const bundle = canonicalBundleRegistry.get(id);
  if (bundle) return bundle;

  for (const b of canonicalBundleRegistry.values()) {
    if (b.id === id) return b;
  }

  if (!allBaseBundlesDeleted) {
    const base = BASE_BUNDLES.find((b) => b.id === id);
    if (base && !deletedBundleIds.has(id)) return base;
  }

  return undefined;
}

/**
 * Finds all mock test objects for a given test bundle.
 * Pulls from the live canonical test registry.
 */
export function resolveBundleTests(bundle: TestBundle): {
  tests: (MockTest & { bundleItem: BundleIncludedTestItem })[];
  missingSlugs: string[];
  combinedReferencePriceInPaise: number;
} {
  const publishedTests = getAllCanonicalPublishedTests();
  const testsMap = new Map<string, MockTest>();
  for (const t of publishedTests) {
    testsMap.set(t.slug.toLowerCase(), t);
    testsMap.set(t.slug, t);
    if (t.id) testsMap.set(t.id, t);
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
    const sLower = item.testSlug?.toLowerCase();
    const found =
      (sLower ? testsMap.get(sLower) : undefined) ||
      (item.testSlug ? testsMap.get(item.testSlug) : undefined) ||
      (item.testId ? testsMap.get(item.testId) : undefined) ||
      (item.testSlug ? getCanonicalTestBySlug(item.testSlug) : undefined);

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
    published: bundle.status === "published" || bundle.published === true,
    isFeatured: Boolean(bundle.isFeatured),
    updatedAt: new Date().toISOString(),
  };

  const sLower = normalized.slug.toLowerCase();
  deletedBundleSlugs.delete(sLower);
  deletedBundleIds.delete(normalized.id);

  canonicalBundleRegistry.set(normalized.slug, normalized);
  canonicalBundleRegistry.set(sLower, normalized);
  canonicalBundleRegistry.set(normalized.id, normalized);
  syncLocalCache();

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();
      const docRef = doc(db, "testBundles", normalized.id);
      await setDoc(docRef, normalized, { merge: true });

      const legacyDocRef = doc(db, "testSeries", normalized.id);
      await setDoc(legacyDocRef, normalized, { merge: true });

      await setDoc(
        doc(db, "testBundles", "_bundle_catalog_state"),
        {
          deletedBundleSlugs: Array.from(deletedBundleSlugs),
          deletedBundleIds: Array.from(deletedBundleIds),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
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
  const effectiveSlug = existing?.slug || id;
  const sLower = effectiveSlug.toLowerCase();

  deletedBundleIds.add(id);
  deletedBundleSlugs.add(sLower);

  canonicalBundleRegistry.delete(id);
  canonicalBundleRegistry.delete(effectiveSlug);
  canonicalBundleRegistry.delete(sLower);

  if (getAllCanonicalPublishedBundles().length === 0) {
    allBaseBundlesDeleted = true;
  }
  syncLocalCache();

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();
      if (id !== "_bundle_catalog_state") {
        await deleteDoc(doc(db, "testBundles", id)).catch(() => {});
        await deleteDoc(doc(db, "testSeries", id)).catch(() => {});
      }

      await setDoc(
        doc(db, "testBundles", "_bundle_catalog_state"),
        {
          allBaseBundlesDeleted,
          deletedBundleSlugs: Array.from(deletedBundleSlugs),
          deletedBundleIds: Array.from(deletedBundleIds),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("[bundleService] Firestore delete warning:", err);
    }
  }
}

/**
 * Bulk deletes bundles from registry and Firestore.
 */
export async function bulkDeleteCanonicalBundles(bundleIds: string[]): Promise<number> {
  initBundleRegistry();
  let count = 0;

  for (const id of bundleIds) {
    const existing = canonicalBundleRegistry.get(id);
    const effectiveSlug = existing?.slug || id;
    const sLower = effectiveSlug.toLowerCase();

    deletedBundleIds.add(id);
    deletedBundleSlugs.add(sLower);

    canonicalBundleRegistry.delete(id);
    canonicalBundleRegistry.delete(effectiveSlug);
    canonicalBundleRegistry.delete(sLower);
    count++;
  }

  if (canonicalBundleRegistry.size === 0 || count >= 10 || getAllCanonicalPublishedBundles().length === 0) {
    allBaseBundlesDeleted = true;
    for (const b of BASE_BUNDLES) {
      deletedBundleIds.add(b.id);
      deletedBundleSlugs.add(b.slug.toLowerCase());
    }
  }
  syncLocalCache();

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();
      for (const id of bundleIds) {
        if (id !== "_bundle_catalog_state") {
          await deleteDoc(doc(db, "testBundles", id)).catch(() => {});
          await deleteDoc(doc(db, "testSeries", id)).catch(() => {});
        }
      }

      await setDoc(doc(db, "testBundles", "_bundle_catalog_state"), {
        allBaseBundlesDeleted,
        deletedBundleSlugs: Array.from(deletedBundleSlugs),
        deletedBundleIds: Array.from(deletedBundleIds),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("[bundleService] Firestore bulk delete warning:", err);
    }
  }

  return count;
}
