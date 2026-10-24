import assert from "node:assert/strict";
import { test, describe } from "node:test";
import {
  resolveBundleTests,
  calculateBundlePricingMetrics,
} from "../src/lib/data/bundleService";
import {
  getUserEnrolledBundles,
  isUserEntitledToBundle,
  isUserEntitledToTest,
  enrollUserInBundle,
} from "../src/lib/data/entitlementService";

describe("TestOrbit Real Test Bundle System Tests", () => {
  test("1. Pricing Metrics Calculation", () => {
    const mockTests = [
      { priceInPaise: 29900 } as any,
      { priceInPaise: 39900 } as any,
      { priceInPaise: 19900 } as any,
    ];

    const metrics = calculateBundlePricingMetrics(49900, mockTests);
    // Sum = 29900 + 39900 + 19900 = 89700
    assert.equal(metrics.referencePriceInPaise, 89700);
    // Savings = 89700 - 49900 = 39800
    assert.equal(metrics.savingsInPaise, 39800);
    // Discount % = Math.round((39800 / 89700) * 100) = 44%
    assert.equal(metrics.discountPercentage, 44);
  });

  test("2. Single-Purchase Bundle Fulfillment & Entitlements", async () => {
    const testUserId = "test_user_bundle_" + Date.now();
    const testBundle: any = {
      id: "bundle-test-fixture-" + Date.now(),
      slug: "test-bundle-fixture",
      title: "Test Bundle Fixture",
      priceInPaise: 49900,
      includedTestsCount: 2,
      includedItems: [
        { testSlug: "test-a", displayOrder: 1 },
        { testSlug: "test-b", displayOrder: 2 },
      ],
    };

    // Initial state: user has no access
    const initialEntitled = await isUserEntitledToBundle(testUserId, testBundle.id);
    assert.equal(initialEntitled, false, "User should not be entitled to bundle initially");

    const initialTestAccess = await isUserEntitledToTest(testUserId, "test-a");
    assert.equal(initialTestAccess, false, "User should not have access to individual test initially");

    // Perform single-purchase fulfillment
    const enrollResult = await enrollUserInBundle(testUserId, testBundle);
    assert.equal(enrollResult.success, true, "Enrollment must succeed");
    assert.ok(enrollResult.orderId.startsWith("ord_bnd_"), "Must generate unique order ID");

    // Check bundle entitlement
    const enrolledBundles = await getUserEnrolledBundles(testUserId);
    assert.equal(enrolledBundles.length, 1, "User should have exactly 1 enrolled bundle");
    assert.equal(enrolledBundles[0].bundleId, testBundle.id);

    const isBundleUnlocked = await isUserEntitledToBundle(testUserId, testBundle.id);
    assert.equal(isBundleUnlocked, true, "User must now be entitled to the bundle");

    // Check individual test access across included tests
    for (const item of testBundle.includedItems) {
      const hasAccess = await isUserEntitledToTest(testUserId, item.testSlug);
      assert.equal(hasAccess, true, `User must have unlocked access to test "${item.testSlug}" via bundle`);
    }

    // Idempotency check: enrolling again does not create duplicate enrollments
    const secondEnrollResult = await enrollUserInBundle(testUserId, testBundle);
    assert.equal(secondEnrollResult.success, true);
    const recheckedBundles = await getUserEnrolledBundles(testUserId);
    assert.equal(recheckedBundles.length, 1, "Idempotent enrollment must not create duplicate bundle records");
  });
});
