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
import { MockTest } from "@/types";
import { MOCK_TESTS, FEATURED_TEST_SLUGS } from "@/data/baseTests";
import { ADMIN_CREDENTIALS } from "@/lib/constants/adminCredentials";
import { saveAdminTest, deleteAdminTest, getAdminTests } from "@/lib/admin/adminStore";

// Canonical in-memory registry on the server and client
const canonicalRegistry = new Map<string, MockTest>();
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

  // If in browser, merge localStorage overrides
  if (typeof window !== "undefined") {
    try {
      const local = getAdminTests();
      for (const t of local) {
        canonicalRegistry.set(t.slug, t);
        if (t.id) canonicalRegistry.set(t.id, t);
      }
    } catch {}
  }

  isInitialized = true;
}


let adminAuthPromise: Promise<unknown> | null = null;

/**
 * Ensures administrator is signed in to Firebase Auth.
 */
export async function ensureAdminAuth() {
  if (!auth) {
    throw new Error("Firebase Auth client is not initialized.");
  }
  if (auth.currentUser) return auth.currentUser;

  try {
    const cred = await signInWithEmailAndPassword(
      auth,
      ADMIN_CREDENTIALS.email,
      ADMIN_CREDENTIALS.password
    );
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
      console.log(`[testService] Synced ${snap.size} tests from Firestore into canonical registry.`);
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
export function getCanonicalTestBySlug(slug: string): MockTest | undefined {
  initRegistry();
  const test = canonicalRegistry.get(slug);
  if (test && test.published) return test;
  return MOCK_TESTS.find((t) => t.slug === slug && t.published);
}

/**
 * Asynchronous lookup for a single test by slug, ensuring Firestore sync.
 */
export async function fetchCanonicalTestBySlug(slug: string): Promise<MockTest | undefined> {
  initRegistry();

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "tests"), where("slug", "==", slug), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const item = snap.docs[0].data() as MockTest;
        if (item && item.published) {
          canonicalRegistry.set(item.slug, item);
          if (item.id) canonicalRegistry.set(item.id, item);
          return item;
        }
      }
    } catch (err) {
      console.warn(`[testService] Direct Firestore fetch for slug "${slug}" notice:`, err);
    }
  }

  await syncFromFirestore();
  return getCanonicalTestBySlug(slug);
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

  return result.length > 0 ? result : MOCK_TESTS.filter((t) => t.published);
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
    if (!seenSlugs.has(test.slug)) {
      seenSlugs.add(test.slug);
      result.push(test);
    }
  }
  return result.length > 0 ? result : MOCK_TESTS;
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
      console.log(`[testService] Successfully persisted test "${payload.title}" (${payload.id}) to Firestore.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[testService] Firestore write warning:", msg);

      // Still update local storage
      if (typeof window !== "undefined") {
        saveAdminTest(payload);
      }

      // Check if it's permission error so user gets a helpful error message
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
export async function deleteCanonicalTest(id: string): Promise<void> {
  initRegistry();

  const existing = canonicalRegistry.get(id);
  if (existing) {
    canonicalRegistry.delete(existing.slug);
    canonicalRegistry.delete(id);
  }

  if (isFirebaseConfigured && db) {
    try {
      await ensureAdminAuth();
      const docRef = doc(db, "tests", id);
      await deleteDoc(docRef);
      console.log(`[testService] Successfully deleted test (${id}) from Firestore.`);
    } catch (err) {
      console.warn("[testService] Firestore delete warning:", err);
    }
  }

  if (typeof window !== "undefined") {
    deleteAdminTest(id);
  }
}
