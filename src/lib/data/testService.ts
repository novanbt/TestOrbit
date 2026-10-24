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
import { ensureAdminAuthenticated } from "@/lib/firebase/serverAuth";
import { MockTest, TestQuestion } from "@/types";
import { MOCK_TESTS, FEATURED_TEST_SLUGS } from "@/data/baseTests";
import { CURATED_QUESTION_BANK } from "@/data/question-bank";

// Canonical in-memory registry
const canonicalRegistry = new Map<string, MockTest>();
const questionsRegistry = new Map<string, TestQuestion[]>();
let isInitialized = false;
let isSyncingFirestore = false;

// Persistent deletion tracking
let allBaseDeleted = true;
const deletedSlugs = new Set<string>();
const deletedIds = new Set<string>();

function loadLocalCache() {
  allBaseDeleted = true;
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("testorbit_catalog_state");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.deletedSlugs)) parsed.deletedSlugs.forEach((s: string) => deletedSlugs.add(s.toLowerCase()));
        if (Array.isArray(parsed.deletedIds)) parsed.deletedIds.forEach((id: string) => deletedIds.add(id));
      }
    } catch {}
  }
}

function syncLocalCache() {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        "testorbit_catalog_state",
        JSON.stringify({
          allBaseDeleted: true,
          deletedSlugs: Array.from(deletedSlugs),
          deletedIds: Array.from(deletedIds),
        })
      );
    } catch {}
  }
}

// Read cache synchronously on module load if in browser
loadLocalCache();

/**
 * Initializes the in-memory registry. Only tests from Firestore/database are loaded.
 */
export function initRegistry() {
  if (isInitialized) return;
  loadLocalCache();
  allBaseDeleted = true;
  isInitialized = true;
}

/**
 * Asynchronously syncs documents from Firestore into the canonical registry,
 * respecting the catalog manifest state (deleted items or all base deleted).
 */
export async function syncFromFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db || isSyncingFirestore) return;
  isSyncingFirestore = true;

  try {
    // 1. Fetch catalog manifest state from Firestore
    try {
      const manifestDoc = await getDoc(doc(db, "tests", "_catalog_state"));
      if (manifestDoc.exists()) {
        const mData = manifestDoc.data();
        if (mData?.allBaseDeleted !== undefined) {
          allBaseDeleted = Boolean(mData.allBaseDeleted);
        } else {
          allBaseDeleted = true;
        }
        if (Array.isArray(mData?.deletedSlugs)) {
          mData.deletedSlugs.forEach((s: string) => deletedSlugs.add(s.toLowerCase()));
        }
        if (Array.isArray(mData?.deletedIds)) {
          mData.deletedIds.forEach((id: string) => deletedIds.add(id));
        }
        syncLocalCache();
      }
    } catch (err) {
      console.warn("[testService] Catalog manifest sync notice:", err);
    }

    // 2. Purge any deleted tests from the registry
    for (const [key, test] of canonicalRegistry.entries()) {
      if (deletedSlugs.has(test.slug.toLowerCase()) || (test.id && deletedIds.has(test.id))) {
        canonicalRegistry.delete(key);
      }
    }

    // 3. Load all active tests from Firestore tests collection
    const testsCol = collection(db, "tests");
    const snap = await getDocs(testsCol);
    if (!snap.empty) {
      snap.forEach((d) => {
        if (d.id === "_catalog_state") return; // Metadata doc, not a mock test
        const item = d.data() as MockTest;
        if (item && item.slug) {
          const slugLower = item.slug.toLowerCase();
          if (!deletedSlugs.has(slugLower) && (!item.id || !deletedIds.has(item.id))) {
            canonicalRegistry.set(item.slug, item);
            canonicalRegistry.set(slugLower, item);
            if (item.id) canonicalRegistry.set(item.id, item);
          }
        }
      });
    }

    // 4. Load questions
    try {
      const qSnap = await getDocs(collection(db, "test_questions"));
      if (!qSnap.empty) {
        qSnap.forEach((d) => {
          const data = d.data() as { questions?: TestQuestion[] };
          if (data && Array.isArray(data.questions)) {
            questionsRegistry.set(d.id, data.questions);
            questionsRegistry.set(d.id.toLowerCase(), data.questions);
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

  if (allBaseDeleted && !canonicalRegistry.has(clean)) {
    return undefined;
  }
  if (deletedSlugs.has(clean)) {
    return undefined;
  }

  for (const [k, test] of canonicalRegistry.entries()) {
    if (k.toLowerCase() === clean || test.slug.toLowerCase() === clean) {
      if (!requirePublished || test.published) return test;
    }
  }

  if (!allBaseDeleted) {
    const base = MOCK_TESTS.find((t) => t.slug.toLowerCase() === clean && (!requirePublished || t.published));
    if (base && !deletedSlugs.has(clean)) {
      return base;
    }
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

  if (deletedSlugs.has(clean)) {
    return undefined;
  }

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
        if (item && item.slug) {
          canonicalRegistry.set(item.slug, item);
          canonicalRegistry.set(item.slug.toLowerCase(), item);
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
 * Synchronous getter for all unique tests (both published and drafts),
 * excluding base tests if marked deleted and filtering out any deleted items.
 */
export function getAllCanonicalTests(): MockTest[] {
  initRegistry();
  const seenSlugs = new Set<string>();
  const result: MockTest[] = [];

  for (const test of canonicalRegistry.values()) {
    const sLower = test.slug.toLowerCase();
    if (
      allBaseDeleted &&
      MOCK_TESTS.some((bt) => bt.slug.toLowerCase() === sLower || (bt.id && test.id && bt.id === test.id))
    ) {
      continue;
    }
    if (!seenSlugs.has(sLower) && !deletedSlugs.has(sLower) && (!test.id || !deletedIds.has(test.id))) {
      seenSlugs.add(sLower);
      result.push(test);
    }
  }

  return result.sort(
    (a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
  );
}

/**
 * Synchronous getter for all published tests.
 */
export function getAllCanonicalPublishedTests(): MockTest[] {
  return getAllCanonicalTests().filter((test) => test.published);
}

/**
 * Asynchronous getter for all tests.
 */
export async function fetchCanonicalTests(): Promise<MockTest[]> {
  initRegistry();
  await syncFromFirestore();
  return getAllCanonicalTests();
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

  const slugLower = payload.slug.toLowerCase();
  deletedSlugs.delete(slugLower);
  deletedIds.delete(payload.id);

  canonicalRegistry.set(payload.slug, payload);
  canonicalRegistry.set(slugLower, payload);
  canonicalRegistry.set(payload.id, payload);
  syncLocalCache();

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();
      const docRef = doc(db, "tests", payload.id);
      await setDoc(docRef, payload);

      await setDoc(
        doc(db, "tests", "_catalog_state"),
        {
          allBaseDeleted,
          deletedSlugs: Array.from(deletedSlugs),
          deletedIds: Array.from(deletedIds),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("[testService] Firestore write warning:", err);
    }
  }

  return payload;
}

/**
 * Deletes a test from canonical registry and Firestore, persisting the deletion.
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
  const slugLower = effectiveSlug.toLowerCase();

  deletedIds.add(effectiveId);
  deletedSlugs.add(slugLower);

  canonicalRegistry.delete(effectiveId);
  canonicalRegistry.delete(effectiveSlug);
  canonicalRegistry.delete(slugLower);
  questionsRegistry.delete(effectiveSlug);
  questionsRegistry.delete(slugLower);

  if (allBaseDeleted || getAllCanonicalPublishedTests().length === 0) {
    allBaseDeleted = true;
  }
  syncLocalCache();

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();
      if (effectiveId && effectiveId !== "_catalog_state") {
        await deleteDoc(doc(db, "tests", effectiveId)).catch(() => {});
      }
      await deleteDoc(doc(db, "test_questions", effectiveSlug)).catch(() => {});

      await setDoc(
        doc(db, "tests", "_catalog_state"),
        {
          allBaseDeleted,
          deletedSlugs: Array.from(deletedSlugs),
          deletedIds: Array.from(deletedIds),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("[testService] Firestore delete warning:", err);
    }
  }
}

/**
 * Bulk deletes multiple tests from canonical registry and Firestore,
 * ensuring deletions are permanently tracked in the catalog manifest.
 */
export async function bulkDeleteCanonicalTests(items: { id: string; slug?: string }[]): Promise<number> {
  initRegistry();

  let count = 0;
  for (const item of items) {
    const effectiveId = item.id;
    const effectiveSlug = item.slug || item.id;
    const slugLower = effectiveSlug.toLowerCase();

    deletedIds.add(effectiveId);
    deletedSlugs.add(slugLower);

    canonicalRegistry.delete(effectiveId);
    canonicalRegistry.delete(effectiveSlug);
    canonicalRegistry.delete(slugLower);
    questionsRegistry.delete(effectiveSlug);
    questionsRegistry.delete(slugLower);
    count++;
  }

  // If user deleted all tests or more than 50 tests, set allBaseDeleted = true
  if (canonicalRegistry.size === 0 || count >= 50 || getAllCanonicalPublishedTests().length === 0) {
    allBaseDeleted = true;
    for (const t of MOCK_TESTS) {
      deletedIds.add(t.id);
      deletedSlugs.add(t.slug.toLowerCase());
    }
  }
  syncLocalCache();

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuthenticated();

      for (const item of items) {
        if (item.id && item.id !== "_catalog_state") {
          await deleteDoc(doc(db, "tests", item.id)).catch(() => {});
        }
      }

      await setDoc(doc(db, "tests", "_catalog_state"), {
        allBaseDeleted,
        deletedSlugs: Array.from(deletedSlugs),
        deletedIds: Array.from(deletedIds),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("[testService] Firestore bulk delete warning:", err);
    }
  }

  return count;
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

  // 2. Check curated static question bank (only if not deleted)
  if (!deletedSlugs.has(cleanSlug)) {
    const curated = CURATED_QUESTION_BANK[cleanSlug];
    if (curated && curated.length > 0) {
      return curated;
    }
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
