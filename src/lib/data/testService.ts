import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { MockTest, TestQuestion } from "@/types";
import { MOCK_TESTS, FEATURED_TEST_SLUGS } from "@/data/baseTests";
import { CURATED_QUESTION_BANK } from "@/data/question-bank";

// Canonical in-memory registry
const canonicalRegistry = new Map<string, MockTest>();
const questionsRegistry = new Map<string, TestQuestion[]>();
let isInitialized = false;
let isSyncingFirestore = false;

/**
 * Initializes the in-memory registry with base mock tests.
 */
export function initRegistry() {
  if (isInitialized && canonicalRegistry.size > 0) return;

  for (const test of MOCK_TESTS) {
    if (!canonicalRegistry.has(test.slug)) {
      canonicalRegistry.set(test.slug, test);
    }
    if (test.id && !canonicalRegistry.has(test.id)) {
      canonicalRegistry.set(test.id, test);
    }
  }

  isInitialized = true;
}

/**
 * Asynchronously syncs documents from Firestore into the canonical registry.
 */
export async function syncFromFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db || isSyncingFirestore) return;
  isSyncingFirestore = true;

  try {
    const testsCol = collection(db, "tests");
    const snap = await getDocs(testsCol);
    if (!snap.empty) {
      snap.forEach((d) => {
        const item = d.data() as MockTest;
        if (item && item.slug) {
          canonicalRegistry.set(item.slug, item);
          if (item.id) canonicalRegistry.set(item.id, item);
        }
      });
    }

    try {
      const qSnap = await getDocs(collection(db, "test_questions"));
      if (!qSnap.empty) {
        qSnap.forEach((d) => {
          const data = d.data() as { questions?: TestQuestion[] };
          if (data && Array.isArray(data.questions)) {
            questionsRegistry.set(d.id, data.questions);
          }
        });
      }
    } catch {}
  } catch (err) {
    console.warn("[testService] Background Firestore sync notice:", err);
  } finally {
    isSyncingFirestore = false;
  }
}

/**
 * Synchronous lookup for a single test by slug.
 */
export function getCanonicalTestBySlug(slug: string, requirePublished: boolean = true): MockTest | undefined {
  initRegistry();
  if (!slug) return undefined;
  const clean = slug.trim().toLowerCase();

  for (const [k, test] of canonicalRegistry.entries()) {
    if (k.toLowerCase() === clean || test.slug.toLowerCase() === clean) {
      if (!requirePublished || test.published) return test;
    }
  }

  const base = MOCK_TESTS.find((t) => t.slug.toLowerCase() === clean && (!requirePublished || t.published));
  if (base) {
    return base;
  }
  return undefined;
}

/**
 * Asynchronous lookup for a single test by slug, querying Firestore if needed.
 */
export async function fetchCanonicalTestBySlug(slug: string, requirePublished: boolean = true): Promise<MockTest | undefined> {
  initRegistry();
  if (!slug) return undefined;
  const clean = slug.trim().toLowerCase();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "tests"), where("slug", "==", clean), limit(1));
      let snap = await getDocs(q);
      if (snap.empty && clean !== slug.trim()) {
        const qRaw = query(collection(db, "tests"), where("slug", "==", slug.trim()), limit(1));
        snap = await getDocs(qRaw);
      }
      if (!snap.empty) {
        const item = snap.docs[0].data() as MockTest;
        if (item) {
          canonicalRegistry.set(item.slug, item);
          if (item.id) canonicalRegistry.set(item.id, item);
          if (!requirePublished || item.published) {
            return item;
          }
        }
      }
    } catch (err) {
      console.warn(`[testService] Firestore fetch for slug "${slug}" notice:`, err);
    }
  }

  await syncFromFirestore();
  return getCanonicalTestBySlug(slug, requirePublished);
}

/**
 * Synchronous getter for all published tests.
 */
export function getAllCanonicalPublishedTests(): MockTest[] {
  initRegistry();
  const seenSlugs = new Set<string>();
  const result: MockTest[] = [];

  for (const test of canonicalRegistry.values()) {
    if (test.published && !seenSlugs.has(test.slug)) {
      seenSlugs.add(test.slug);
      result.push(test);
    }
  }

  return result;
}

/**
 * Asynchronous getter for all tests.
 */
export async function fetchCanonicalTests(): Promise<MockTest[]> {
  initRegistry();
  await syncFromFirestore();
  const seenSlugs = new Set<string>();
  const result: MockTest[] = [];
  for (const test of canonicalRegistry.values()) {
    if (!seenSlugs.has(test.slug)) {
      seenSlugs.add(test.slug);
      result.push(test);
    }
  }
  return result;
}

/**
 * Asynchronous getter for all published tests with Firestore sync.
 */
export async function fetchCanonicalPublishedTests(): Promise<MockTest[]> {
  initRegistry();
  await syncFromFirestore();
  return getAllCanonicalPublishedTests();
}

/**
 * Synchronous getter for featured mock tests.
 */
export function getCanonicalFeaturedTests(): MockTest[] {
  const published = getAllCanonicalPublishedTests();
  const featured = published.filter((t) => t.isFeatured);

  return featured.sort((a, b) => {
    const aIndex = FEATURED_TEST_SLUGS.indexOf(a.slug);
    const bIndex = FEATURED_TEST_SLUGS.indexOf(b.slug);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });
}

/**
 * Asynchronous getter for featured mock tests with Firestore sync.
 */
export async function fetchCanonicalFeaturedTests(): Promise<MockTest[]> {
  initRegistry();
  await syncFromFirestore();
  return getCanonicalFeaturedTests();
}

/**
 * Persists a created or updated test to registry and Firestore if available.
 */
export async function saveCanonicalTest(test: MockTest): Promise<MockTest> {
  initRegistry();

  if (!test.id) {
    test.id = "test-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);
  }

  const payload: MockTest = {
    ...test,
    updatedAt: new Date().toISOString(),
  };

  canonicalRegistry.set(payload.slug, payload);
  canonicalRegistry.set(payload.id, payload);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "tests", payload.id);
      await setDoc(docRef, payload);
    } catch (err) {
      console.warn("[testService] Firestore write warning:", err);
    }
  }

  return payload;
}

/**
 * Deletes a test from canonical registry and Firestore.
 */
export async function deleteCanonicalTest(id: string, slug?: string): Promise<void> {
  initRegistry();

  let target = canonicalRegistry.get(id) || (slug ? canonicalRegistry.get(slug) : undefined);
  if (!target) {
    for (const t of canonicalRegistry.values()) {
      if (t.id === id || t.slug === id || (slug && t.slug === slug)) {
        target = t;
        break;
      }
    }
  }

  const effectiveId = target?.id || id;
  const effectiveSlug = target?.slug || slug || id;

  canonicalRegistry.delete(effectiveId);
  canonicalRegistry.delete(effectiveSlug);
  questionsRegistry.delete(effectiveSlug);

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, "tests", effectiveId));
      await deleteDoc(doc(db, "test_questions", effectiveSlug)).catch(() => {});
    } catch (err) {
      console.warn("[testService] Firestore delete warning:", err);
    }
  }
}

/**
 * Fetches questions for a mock test.
 * Checks questionsRegistry -> Firestore -> Curated bank.
 */
export async function fetchCanonicalQuestionsForTest(
  slug: string,
  test?: MockTest
): Promise<TestQuestion[]> {
  initRegistry();
  if (!slug) return [];
  const cleanSlug = slug.trim().toLowerCase();

  // 1. Check in-memory questions registry
  if (questionsRegistry.has(cleanSlug)) {
    return questionsRegistry.get(cleanSlug) || [];
  }

  // 2. Check curated static question bank
  const curated = CURATED_QUESTION_BANK[cleanSlug];
  if (curated && curated.length > 0) {
    return curated;
  }

  // 3. Check Firestore
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, "test_questions", cleanSlug);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as { questions?: TestQuestion[] };
        if (data && Array.isArray(data.questions)) {
          questionsRegistry.set(cleanSlug, data.questions);
          return data.questions;
        }
      }
    } catch {}
  }

  return [];
}
