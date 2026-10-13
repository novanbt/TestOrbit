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
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth, isFirebaseConfigured } from "@/lib/firebase/client";
import { MockTest, TestQuestion } from "@/types";
import { MOCK_TESTS, FEATURED_TEST_SLUGS } from "@/data/baseTests";
import { CURATED_QUESTION_BANK } from "@/data/question-bank";
import { ADMIN_CREDENTIALS } from "@/lib/constants/adminCredentials";
import {
  saveAdminTest,
  deleteAdminTest,
  getAdminTests,
  getAdminDeletedTestIds,
} from "@/lib/admin/adminStore";

// Canonical in-memory registry on the server and client
const canonicalRegistry = new Map<string, MockTest>();
const deletedRegistry = new Set<string>();
const questionsRegistry = new Map<string, TestQuestion[]>();
let isInitialized = false;
let isSyncingFirestore = false;

/**
 * Initializes the in-memory registry with base mock tests.
 */
export function initRegistry() {
  if (isInitialized && canonicalRegistry.size > 0) return;

  // 1. If in browser, merge localStorage deleted tests first
  if (typeof window !== "undefined") {
    try {
      const deleted = getAdminDeletedTestIds();
      for (const d of deleted) {
        deletedRegistry.add(d);
      }
    } catch {}
  }

  // 2. Add base mock tests that haven't been deleted
  for (const test of MOCK_TESTS) {
    if (deletedRegistry.has(test.id) || deletedRegistry.has(test.slug)) {
      continue;
    }
    if (!canonicalRegistry.has(test.slug)) {
      canonicalRegistry.set(test.slug, test);
    }
    if (test.id && !canonicalRegistry.has(test.id)) {
      canonicalRegistry.set(test.id, test);
    }
  }

  // 3. If in browser, merge local adminStore overrides
  if (typeof window !== "undefined") {
    try {
      const local = getAdminTests();
      for (const t of local) {
        if (!deletedRegistry.has(t.id) && !deletedRegistry.has(t.slug)) {
          canonicalRegistry.set(t.slug, t);
          if (t.id) canonicalRegistry.set(t.id, t);
        }
      }
    } catch {}
  }

  isInitialized = true;
}

/**
 * Ensures administrator is signed in to Firebase Auth.
 */
export async function ensureAdminAuth() {
  if (!auth) {
    throw new Error("Firebase Auth client is not initialized.");
  }
  if (auth.currentUser) return auth.currentUser;

  const email = process.env.ADMIN_EMAIL || ADMIN_CREDENTIALS.email;
  const password = process.env.ADMIN_PASSWORD || ADMIN_CREDENTIALS.password;

  if (!email || !password) {
    throw new Error(
      "Administrator credentials are not configured. Please define ADMIN_EMAIL and ADMIN_PASSWORD in your environment variables."
    );
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[testService] Firebase Auth sign in failed for admin:", msg);
    throw new Error(`Admin authentication failed: ${msg}`);
  }
}

/**
 * Asynchronously syncs documents from Firestore into the canonical registry.
 */
export async function syncFromFirestore(): Promise<void> {
  if (!isFirebaseConfigured || !db || isSyncingFirestore) return;
  isSyncingFirestore = true;

  try {
    // 1. Fetch tombstones from deleted_tests so deleted tests are NEVER resurrected
    try {
      const delSnap = await getDocs(collection(db, "deleted_tests"));
      if (!delSnap.empty) {
        delSnap.forEach((d) => {
          const data = d.data();
          const id = d.id;
          const slug = data.slug || d.id;
          deletedRegistry.add(id);
          deletedRegistry.add(slug);
          canonicalRegistry.delete(id);
          canonicalRegistry.delete(slug);
        });
      }
    } catch (delErr) {
      console.warn("[testService] Error fetching deleted_tests:", delErr);
    }

    // 2. Fetch tests from tests collection
    const testsCol = collection(db, "tests");
    const snap = await getDocs(testsCol);
    if (!snap.empty) {
      snap.forEach((d) => {
        const item = d.data() as MockTest;
        if (item && item.slug) {
          if (deletedRegistry.has(item.id) || deletedRegistry.has(item.slug)) {
            return;
          }
          canonicalRegistry.set(item.slug, item);
          if (item.id) canonicalRegistry.set(item.id, item);
        }
      });
    }

    // 3. Fetch questions from test_questions collection
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
    } catch (qErr) {
      console.warn("[testService] Error fetching test_questions:", qErr);
    }
  } catch (err) {
    console.warn("[testService] Background Firestore sync notice:", err);
  } finally {
    isSyncingFirestore = false;
  }
}

/**
 * Synchronous lookup for a single test by slug.
 * Safe for build prerendering and fast SSR.
 */
export function getCanonicalTestBySlug(slug: string, requirePublished: boolean = true): MockTest | undefined {
  initRegistry();
  if (!slug) return undefined;
  const clean = slug.trim().toLowerCase();

  if (deletedRegistry.has(clean)) {
    return undefined;
  }

  for (const [k, test] of canonicalRegistry.entries()) {
    if (k.toLowerCase() === clean || test.slug.toLowerCase() === clean) {
      if (deletedRegistry.has(test.id) || deletedRegistry.has(test.slug)) {
        return undefined;
      }
      if (!requirePublished || test.published) return test;
    }
  }

  const base = MOCK_TESTS.find((t) => t.slug.toLowerCase() === clean && (!requirePublished || t.published));
  if (base && !deletedRegistry.has(base.id) && !deletedRegistry.has(base.slug)) {
    return base;
  }
  return undefined;
}

/**
 * Asynchronous lookup for a single test by slug, ensuring Firestore sync.
 */
export async function fetchCanonicalTestBySlug(slug: string, requirePublished: boolean = true): Promise<MockTest | undefined> {
  initRegistry();
  if (!slug) return undefined;
  const clean = slug.trim().toLowerCase();

  if (deletedRegistry.has(clean)) {
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
        if (item) {
          if (deletedRegistry.has(item.id) || deletedRegistry.has(item.slug)) {
            return undefined;
          }
          canonicalRegistry.set(item.slug, item);
          if (item.id) canonicalRegistry.set(item.id, item);
          if (!requirePublished || item.published) {
            return item;
          }
        }
      }
    } catch (err) {
      console.warn(`[testService] Direct Firestore fetch for slug "${slug}" notice:`, err);
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
    if (
      test.published &&
      !seenSlugs.has(test.slug) &&
      !deletedRegistry.has(test.id) &&
      !deletedRegistry.has(test.slug)
    ) {
      seenSlugs.add(test.slug);
      result.push(test);
    }
  }

  return result;
}

/**
 * Asynchronous getter for all tests (including drafts).
 */
export async function fetchCanonicalTests(): Promise<MockTest[]> {
  initRegistry();
  await syncFromFirestore();
  const seenSlugs = new Set<string>();
  const result: MockTest[] = [];
  for (const test of canonicalRegistry.values()) {
    if (
      !seenSlugs.has(test.slug) &&
      !deletedRegistry.has(test.id) &&
      !deletedRegistry.has(test.slug)
    ) {
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
 * Persists a created or updated test:
 * 1. Updates canonical in-memory registry
 * 2. Persists to Firestore /tests/{id}
 * 3. Keeps localStorage updated in browser
 */
export async function saveCanonicalTest(test: MockTest): Promise<MockTest> {
  initRegistry();

  if (!test.id) {
    test.id = "test-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 6);
  }

  // Remove from deleted registry if re-creating
  deletedRegistry.delete(test.id);
  deletedRegistry.delete(test.slug);

  const payload: MockTest = {
    ...test,
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediately update in-memory registry
  canonicalRegistry.set(payload.slug, payload);
  canonicalRegistry.set(payload.id, payload);

  // 2. Persist to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuth();
      const docRef = doc(db, "tests", payload.id);
      await setDoc(docRef, payload);

      // Delete from deleted_tests if it was previously there
      await deleteDoc(doc(db, "deleted_tests", payload.id)).catch(() => {});
      console.log(`[testService] Successfully persisted test "${payload.title}" (${payload.id}) to Firestore.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[testService] Firestore write warning:", msg);

      if (typeof window !== "undefined") {
        saveAdminTest(payload);
      }

      if (msg.includes("permission-denied") || msg.includes("PERMISSION_DENIED")) {
        throw new Error(
          "Firestore write denied by security rules. Please update firestore.rules in Firebase Console to allow authenticated writes to /tests."
        );
      }
      throw new Error(`Database persistence failed: ${msg}`);
    }
  }

  // 3. Keep browser localStorage synchronized
  if (typeof window !== "undefined") {
    saveAdminTest(payload);
  }

  return payload;
}

/**
 * Deletes a test from canonical registry, Firestore, and localStorage.
 */
export async function deleteCanonicalTest(id: string, slug?: string): Promise<void> {
  initRegistry();

  deletedRegistry.add(id);
  if (slug) deletedRegistry.add(slug);

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

  deletedRegistry.add(effectiveId);
  deletedRegistry.add(effectiveSlug);
  canonicalRegistry.delete(effectiveId);
  canonicalRegistry.delete(effectiveSlug);
  questionsRegistry.delete(effectiveSlug);

  // Firestore persistence
  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuth();
      // 1. Delete test document
      const docRef = doc(db, "tests", effectiveId);
      await deleteDoc(docRef);

      // 2. Write tombstone to deleted_tests collection
      const delRef = doc(db, "deleted_tests", effectiveId);
      await setDoc(delRef, {
        id: effectiveId,
        slug: effectiveSlug,
        deletedAt: new Date().toISOString(),
      });

      // 3. Delete questions document if exists
      const qRef = doc(db, "test_questions", effectiveSlug);
      await deleteDoc(qRef).catch(() => {});

      console.log(`[testService] Successfully deleted test (${effectiveId}) and recorded tombstone in Firestore.`);
    } catch (err) {
      console.warn("[testService] Firestore delete warning:", err);
    }
  }

  if (typeof window !== "undefined") {
    deleteAdminTest(effectiveId, effectiveSlug);
  }
}

/**
 * Purges all 117 pre-loaded seed/tester tests so only user-created tests remain.
 */
export async function purgeCanonicalTesterTests(): Promise<{ purgedCount: number }> {
  initRegistry();
  let purgedCount = 0;

  for (const test of MOCK_TESTS) {
    deletedRegistry.add(test.id);
    deletedRegistry.add(test.slug);
    canonicalRegistry.delete(test.id);
    canonicalRegistry.delete(test.slug);
    questionsRegistry.delete(test.slug);
    purgedCount++;
  }

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuth();
      for (const test of MOCK_TESTS) {
        await deleteDoc(doc(db, "tests", test.id)).catch(() => {});
        await setDoc(doc(db, "deleted_tests", test.id), {
          id: test.id,
          slug: test.slug,
          deletedAt: new Date().toISOString(),
        }).catch(() => {});
        await deleteDoc(doc(db, "test_questions", test.slug)).catch(() => {});
      }
    } catch (err) {
      console.warn("[testService] Purge Firestore warning:", err);
    }
  }

  return { purgedCount };
}

/**
 * -------------------------------------------------------------
 * 4. QUESTION BANK PERSISTENCE
 * -------------------------------------------------------------
 */

/**
 * Persists questions for a mock test to canonical in-memory registry and Firestore.
 */
export async function saveCanonicalQuestions(
  slug: string,
  questions: TestQuestion[]
): Promise<TestQuestion[]> {
  initRegistry();
  const cleanSlug = slug.trim().toLowerCase();
  questionsRegistry.set(cleanSlug, questions);

  // Update questionCount on test if found
  const test = canonicalRegistry.get(cleanSlug);
  if (test) {
    test.questionCount = questions.length;
    canonicalRegistry.set(test.slug, test);
    if (test.id) canonicalRegistry.set(test.id, test);
  }

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuth();
      const docRef = doc(db, "test_questions", cleanSlug);
      await setDoc(docRef, {
        slug: cleanSlug,
        questions,
        updatedAt: new Date().toISOString(),
      });

      // Update questionCount in tests document
      if (test && test.id) {
        await setDoc(
          doc(db, "tests", test.id),
          { ...test, questionCount: questions.length },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn("[testService] Failed to persist questions to Firestore:", err);
    }
  }

  return questions;
}

/**
 * Fetches questions for a mock test.
 * Checks questionsRegistry -> Firestore -> Curated bank for starter tests.
 * NEVER generates synthetic questions for user tests.
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

  // 2. Check curated static question bank for starter tests
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
    } catch {
      // Graceful fallback on firestore read during static build
    }
  }

  // 4. Return empty array for custom/user tests so user adds questions manually
  return [];
}

/**
 * Deletes questions for a mock test.
 */
export async function deleteCanonicalQuestions(slug: string): Promise<void> {
  const cleanSlug = slug.trim().toLowerCase();
  questionsRegistry.delete(cleanSlug);

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuth();
      const docRef = doc(db, "test_questions", cleanSlug);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("[testService] Firestore delete questions warning:", err);
    }
  }
}
