import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase/client";
import { UserBundleEnrollment, UserTestEntitlement, TestBundle } from "@/types";
import { resolveBundleTests } from "./bundleService";

const BUNDLE_STORAGE_PREFIX = "testorbit_enrolled_bundles_";
const TEST_STORAGE_PREFIX = "testorbit_enrolled_tests_";

// In-memory store for server actions and Node environments
const inMemoryBundleStore = new Map<string, UserBundleEnrollment[]>();
const inMemoryTestStore = new Map<string, UserTestEntitlement[]>();

/**
 * Returns all active bundle enrollments for a given user.
 */
export async function getUserEnrolledBundles(userId: string): Promise<UserBundleEnrollment[]> {
  if (!userId) return [];
  const enrollments: UserBundleEnrollment[] = [];

  // Check in-memory store first
  const inMemory = inMemoryBundleStore.get(userId);
  if (inMemory && inMemory.length > 0) {
    enrollments.push(...inMemory);
  }

  // 1. Read local cache
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(BUNDLE_STORAGE_PREFIX + userId);
      if (cached) {
        const parsed = JSON.parse(cached) as UserBundleEnrollment[];
        for (const item of parsed) {
          if (!enrollments.some((e) => e.bundleId === item.bundleId)) {
            enrollments.push(item);
          }
        }
      }
    } catch {}
  }


  // 2. Fetch from Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, "users", userId, "enrolledBundles");
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const fromDb: UserBundleEnrollment[] = [];
        snap.forEach((d) => {
          fromDb.push(d.data() as UserBundleEnrollment);
        });

        // Merge and update cache
        const map = new Map<string, UserBundleEnrollment>();
        for (const item of enrollments) map.set(item.bundleId, item);
        for (const item of fromDb) map.set(item.bundleId, item);

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
        );

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(BUNDLE_STORAGE_PREFIX + userId, JSON.stringify(merged));
          } catch {}
        }
        return merged;
      }
    } catch (err) {
      console.warn("[entitlementService] getUserEnrolledBundles Firestore warning:", err);
    }
  }

  return enrollments;
}

/**
 * Checks if a user has already purchased/enrolled in a specific bundle.
 */
export async function isUserEntitledToBundle(
  userId: string,
  bundleIdOrSlug: string
): Promise<boolean> {
  if (!userId || !bundleIdOrSlug) return false;
  const list = await getUserEnrolledBundles(userId);
  return list.some(
    (b) =>
      (b.bundleId === bundleIdOrSlug || b.bundleSlug.toLowerCase() === bundleIdOrSlug.toLowerCase()) &&
      b.status === "active"
  );
}

/**
 * Checks if a user is entitled to an individual test (either individually or through an enrolled bundle).
 */
export async function isUserEntitledToTest(
  userId: string,
  testIdOrSlug: string
): Promise<boolean> {
  if (!userId || !testIdOrSlug) return false;
  const targetLower = testIdOrSlug.toLowerCase();

  // 0. Check in-memory test store (for Node/SSR environments)
  const inMemory = inMemoryTestStore.get(userId);
  if (inMemory && inMemory.length > 0) {
    const hasDirect = inMemory.some(
      (t) =>
        (t.testId === testIdOrSlug || t.testSlug.toLowerCase() === targetLower) &&
        t.status === "active"
    );
    if (hasDirect) return true;
  }

  // 1. Check local storage cache of tests
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(TEST_STORAGE_PREFIX + userId);
      if (cached) {
        const entitlements = JSON.parse(cached) as UserTestEntitlement[];
        const hasDirect = entitlements.some(
          (t) =>
            (t.testId === testIdOrSlug || t.testSlug.toLowerCase() === targetLower) &&
            t.status === "active"
        );
        if (hasDirect) return true;
      }
    } catch {}
  }

  // 2. Check enrolled bundles
  const bundles = await getUserEnrolledBundles(userId);
  const inAnyBundle = bundles.some((b) =>
    b.status === "active" &&
    (b.includedTestIds.includes(testIdOrSlug) ||
     b.includedTestSlugs.some((s) => s.toLowerCase() === targetLower))
  );
  if (inAnyBundle) return true;

  // 3. Check Firestore test entitlements collection
  if (isFirebaseConfigured && db) {
    try {
      const testDocRef = doc(db, "users", userId, "enrolledTests", testIdOrSlug);
      const testSnap = await getDoc(testDocRef);
      if (testSnap.exists()) {
        const data = testSnap.data() as UserTestEntitlement;
        return data.status === "active";
      }
    } catch {}
  }

  return false;
}

/**
 * Idempotently enrolls a user into a bundle and grants access to all included tests.
 */
export async function enrollUserInBundle(
  userId: string,
  bundle: TestBundle,
  customOrderIdOrProfile?: string | { email?: string; name?: string },
  customOrderId?: string
): Promise<{ success: boolean; orderId: string; message: string }> {
  if (!userId || !bundle) {
    return { success: false, orderId: "", message: "Missing user or bundle details." };
  }

  const userProfile =
    typeof customOrderIdOrProfile === "object" ? customOrderIdOrProfile : undefined;
  const orderId =
    typeof customOrderIdOrProfile === "string"
      ? customOrderIdOrProfile
      : customOrderId ||
        `ord_bnd_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Calculate access expiry if bundle configured accessDurationDays
  const accessExpiresAt = bundle.accessDurationDays
    ? new Date(Date.now() + bundle.accessDurationDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  const { tests } = resolveBundleTests(bundle);
  const includedTestIds = Array.from(
    new Set([
      ...tests.map((t) => t.id),
      ...(bundle.includedItems || []).map((i) => i.testId).filter(Boolean),
      ...((bundle as { includedTestIds?: string[] }).includedTestIds || []),
    ])
  );
  const includedTestSlugs = Array.from(
    new Set([
      ...tests.map((t) => t.slug),
      ...(bundle.includedItems || []).map((i) => i.testSlug).filter(Boolean),
      ...(bundle.includedTestSlugs || []),
    ])
  );

  const bundleEnrollment: UserBundleEnrollment = {
    id: bundle.id,
    userId,
    bundleId: bundle.id,
    bundleSlug: bundle.slug,
    bundleTitle: bundle.title,
    orderId,
    purchasedAt: now,
    accessExpiresAt,
    pricePaidInPaise: bundle.priceInPaise,
    includedTestIds,
    includedTestSlugs,
    status: "active",
  };

  // 0. Update in-memory stores for SSR and Node test runner
  const existingMemBundles = inMemoryBundleStore.get(userId) || [];
  inMemoryBundleStore.set(
    userId,
    [bundleEnrollment, ...existingMemBundles.filter((b) => b.bundleId !== bundle.id)]
  );

  const allItemsToEntitle = [
    ...tests.map((t) => ({ id: t.id, slug: t.slug })),
    ...(bundle.includedItems || []).map((i) => ({ id: i.testId || i.testSlug, slug: i.testSlug || i.testId })),
  ];

  const existingMemTests = inMemoryTestStore.get(userId) || [];
  const memTestMap = new Map<string, UserTestEntitlement>();
  for (const t of existingMemTests) memTestMap.set(t.testId, t);
  for (const t of allItemsToEntitle) {
    if (!t.id && !t.slug) continue;
    const testKey = t.id || t.slug;
    if (!memTestMap.has(testKey) || memTestMap.get(testKey)?.source !== "individual") {
      memTestMap.set(testKey, {
        id: testKey,
        userId,
        testId: t.id || t.slug,
        testSlug: t.slug || t.id,
        source: "bundle",
        bundleId: bundle.id,
        grantedAt: now,
        expiresAt: accessExpiresAt,
        status: "active",
      });
    }
  }
  inMemoryTestStore.set(userId, Array.from(memTestMap.values()));

  // 1. Update client local cache immediately
  if (typeof window !== "undefined") {
    try {
      // Cache bundle
      const bundleKey = BUNDLE_STORAGE_PREFIX + userId;
      const prevBundlesStr = localStorage.getItem(bundleKey);
      const prevBundles: UserBundleEnrollment[] = prevBundlesStr ? JSON.parse(prevBundlesStr) : [];
      const updatedBundles = [
        bundleEnrollment,
        ...prevBundles.filter((b) => b.bundleId !== bundle.id),
      ];
      localStorage.setItem(bundleKey, JSON.stringify(updatedBundles));

      // Cache test entitlements
      const testKey = TEST_STORAGE_PREFIX + userId;
      const prevTestsStr = localStorage.getItem(testKey);
      const prevTests: UserTestEntitlement[] = prevTestsStr ? JSON.parse(prevTestsStr) : [];
      const testMap = new Map<string, UserTestEntitlement>();
      for (const t of prevTests) testMap.set(t.testId, t);

      for (const t of tests) {
        const existing = testMap.get(t.id);
        // If user already owns this test individually, preserve individual entitlement
        if (!existing || existing.source !== "individual") {
          testMap.set(t.id, {
            id: t.id,
            userId,
            testId: t.id,
            testSlug: t.slug,
            source: "bundle",
            bundleId: bundle.id,
            grantedAt: now,
            expiresAt: accessExpiresAt,
            status: "active",
          });
        }
      }

      localStorage.setItem(testKey, JSON.stringify(Array.from(testMap.values())));
      window.dispatchEvent(new Event("testorbit_entitlements_updated"));
    } catch (err) {
      console.warn("Failed to update localStorage entitlements:", err);
    }
  }

  // 2. Persist to Firestore if configured
  if (isFirebaseConfigured && db) {
    try {
      // Save bundle enrollment
      const bundleDocRef = doc(db, "users", userId, "enrolledBundles", bundle.id);
      await setDoc(bundleDocRef, bundleEnrollment, { merge: true });

      // Save user order snapshot
      const orderDocRef = doc(db, "users", userId, "orders", orderId);
      await setDoc(
        orderDocRef,
        {
          orderId,
          userId,
          productType: "bundle",
          productId: bundle.id,
          productTitle: bundle.title,
          amountInPaise: bundle.priceInPaise,
          purchasedAt: now,
          status: "completed",
          includedTestsCount: includedTestIds.length,
        },
        { merge: true }
      );

      // Save root order for admin ledger, revenue analytics, and transaction logs
      try {
        const rootOrderRef = doc(db, "orders", orderId);
        await setDoc(
          rootOrderRef,
          {
            id: orderId,
            userId,
            userEmail: userProfile?.email || "candidate@testorbit.in",
            userName: userProfile?.name || "Candidate",
            itemType: "series",
            itemId: bundle.id,
            itemTitle: bundle.title,
            amountInPaise: bundle.priceInPaise,
            status: "completed",
            paymentProvider: "testorbit_internal",
            paymentRef: orderId,
            createdAt: now,
          },
          { merge: true }
        );
      } catch (orderErr) {
        console.warn("[entitlementService] Root order sync notice:", orderErr);
      }

      // Save individual test entitlements
      for (const t of tests) {
        const testDocRef = doc(db, "users", userId, "enrolledTests", t.id);
        const existingSnap = await getDoc(testDocRef);
        if (existingSnap.exists()) {
          const existing = existingSnap.data() as UserTestEntitlement;
          if (existing.source === "individual") {
            continue; // Keep individual purchase record intact
          }
        }

        await setDoc(
          testDocRef,
          {
            id: t.id,
            userId,
            testId: t.id,
            testSlug: t.slug,
            source: "bundle",
            bundleId: bundle.id,
            grantedAt: now,
            expiresAt: accessExpiresAt,
            status: "active",
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn("[entitlementService] Firestore enrollUserInBundle warning:", err);
    }
  }

  return {
    success: true,
    orderId,
    message: `Enrolled successfully in ${bundle.title}. Access granted to all ${includedTestIds.length} mock tests!`,
  };
}

/**
 * Enrolls a user into an individual test and registers user & root order records.
 */
export async function enrollUserInTest(
  userId: string,
  test: { id: string; slug: string; title: string; priceInPaise?: number },
  customOrderIdOrProfile?: string | { email?: string; name?: string },
  customOrderId?: string
): Promise<{ success: boolean; orderId: string; message: string }> {
  if (!userId || !test) {
    return { success: false, orderId: "", message: "Missing user or test details." };
  }

  const userProfile =
    typeof customOrderIdOrProfile === "object" ? customOrderIdOrProfile : undefined;
  const orderId =
    typeof customOrderIdOrProfile === "string"
      ? customOrderIdOrProfile
      : customOrderId ||
        `ord_tst_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const entitlement: UserTestEntitlement = {
    id: test.id,
    userId,
    testId: test.id,
    testSlug: test.slug,
    source: "individual",
    grantedAt: now,
    status: "active",
  };

  // 0. Update in-memory store
  const existingMemTests = inMemoryTestStore.get(userId) || [];
  inMemoryTestStore.set(
    userId,
    [entitlement, ...existingMemTests.filter((t) => t.testId !== test.id)]
  );

  // 1. Update localStorage
  if (typeof window !== "undefined") {
    try {
      const testKey = TEST_STORAGE_PREFIX + userId;
      const prevTestsStr = localStorage.getItem(testKey);
      const prevTests: UserTestEntitlement[] = prevTestsStr ? JSON.parse(prevTestsStr) : [];
      const updated = [entitlement, ...prevTests.filter((t) => t.testId !== test.id)];
      localStorage.setItem(testKey, JSON.stringify(updated));
      window.dispatchEvent(new Event("testorbit_entitlements_updated"));
    } catch (err) {
      console.warn("Failed to update localStorage test entitlement:", err);
    }
  }

  // 2. Persist to Firestore
  if (isFirebaseConfigured && db) {
    try {
      const testDocRef = doc(db, "users", userId, "enrolledTests", test.id);
      await setDoc(testDocRef, entitlement, { merge: true });

      const userOrderRef = doc(db, "users", userId, "orders", orderId);
      await setDoc(
        userOrderRef,
        {
          orderId,
          userId,
          productType: "test",
          productId: test.id,
          productTitle: test.title,
          amountInPaise: test.priceInPaise || 0,
          purchasedAt: now,
          status: "completed",
        },
        { merge: true }
      );

      const rootOrderRef = doc(db, "orders", orderId);
      await setDoc(
        rootOrderRef,
        {
          id: orderId,
          userId,
          userEmail: userProfile?.email || "candidate@testorbit.in",
          userName: userProfile?.name || "Candidate",
          itemType: "test",
          itemId: test.id,
          itemTitle: test.title,
          amountInPaise: test.priceInPaise || 0,
          status: "completed",
          paymentProvider: "testorbit_internal",
          paymentRef: orderId,
          createdAt: now,
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("[entitlementService] enrollUserInTest Firestore warning:", err);
    }
  }

  return {
    success: true,
    orderId,
    message: `Enrolled successfully in ${test.title}.`,
  };
}
