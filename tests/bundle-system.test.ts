import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { TEST_SERIES, getAllTestSeries, getTestSeriesBySlug } from "../src/data/test-series";
import { MOCK_TESTS } from "../src/data/baseTests";
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
  test("1. Base Bundles Data Integrity & Non-Fabrication", () => {
    const bundles = getAllTestSeries();
    assert.ok(bundles.length >= 4, "Should have at least 4 default authentic test bundles");

    const testMap = new Map<string, (typeof MOCK_TESTS)[0]>();
    for (const t of MOCK_TESTS) {
      testMap.set(t.slug, t);
      testMap.set(t.id, t);
    }

    for (const bundle of bundles) {
      assert.ok(bundle.id, "Bundle must have a unique ID");
      assert.ok(bundle.slug, "Bundle must have a URL slug");
      assert.ok(bundle.title, "Bundle must have a title");
      assert.ok(bundle.priceInPaise > 0, "Bundle must have a valid selling price");
      assert.ok(bundle.includedItems.length > 0, "Bundle must have included items");

      // Critical requirement: includedTestsCount must strictly match includedItems.length
      assert.equal(
        bundle.includedTestsCount,
        bundle.includedItems.length,
        `Bundle "${bundle.title}" includedTestsCount (${bundle.includedTestsCount}) must match includedItems.length (${bundle.includedItems.length})`
      );

      // Verify each referenced test is a real mock test in the database
      for (const item of bundle.includedItems) {
        const found = testMap.get(item.testSlug) || testMap.get(item.testId);
        assert.ok(
          found,
          `Bundle "${bundle.title}" references non-existent test slug "${item.testSlug}"`
        );
        assert.ok(item.displayOrder >= 1, "Item must have valid display order");
      }

      // Verify genuine savings
      if (bundle.originalPriceInPaise) {
        assert.ok(
          bundle.originalPriceInPaise >= bundle.priceInPaise,
          `Bundle reference price (${bundle.originalPriceInPaise}) must be >= selling price (${bundle.priceInPaise})`
        );
      }
    }
  });

  test("2. Bundle Test Resolution (resolveBundleTests)", () => {
    const class10Bundle = getTestSeriesBySlug("class-10-board-excellence-pack");
    assert.ok(class10Bundle, "Class 10 bundle must exist");

    const { tests, missingSlugs, combinedReferencePriceInPaise } = resolveBundleTests(class10Bundle);
    assert.equal(missingSlugs.length, 0, "Should have 0 missing tests for Class 10 bundle");
    assert.equal(tests.length, 5, "Class 10 bundle should resolve all 5 real tests");
    assert.ok(combinedReferencePriceInPaise > 0, "Combined reference price must be > 0");

    // Check display order preservation
    for (let i = 0; i < tests.length; i++) {
      assert.equal(tests[i].bundleItem.displayOrder, i + 1, `Test at index ${i} should have displayOrder ${i + 1}`);
    }

    // Verify included tests titles
    const titles = tests.map((t) => t.title);
    assert.ok(titles.some((t) => t.includes("Mathematics")), "Must include Mathematics test");
    assert.ok(titles.some((t) => t.includes("Science")), "Must include Science test");
    assert.ok(titles.some((t) => t.includes("Social Science")), "Must include Social Science test");
    assert.ok(titles.some((t) => t.includes("English")), "Must include English test");
    assert.ok(titles.some((t) => t.includes("Hindi")), "Must include Hindi test");
  });

  test("3. Pricing Metrics Calculation", () => {
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

  test("4. Single-Purchase Bundle Fulfillment & Entitlements", async () => {
    const testUserId = "test_user_bundle_" + Date.now();
    const class10Bundle = getTestSeriesBySlug("class-10-board-excellence-pack")!;

    // Initial state: user has no access
    const initialEntitled = await isUserEntitledToBundle(testUserId, class10Bundle.id);
    assert.equal(initialEntitled, false, "User should not be entitled to bundle initially");

    const mathTestSlug = "class-10-mathematics-full-syllabus";
    const initialTestAccess = await isUserEntitledToTest(testUserId, mathTestSlug);
    assert.equal(initialTestAccess, false, "User should not have access to individual test initially");

    // Perform single-purchase fulfillment
    const enrollResult = await enrollUserInBundle(testUserId, class10Bundle);
    assert.equal(enrollResult.success, true, "Enrollment must succeed");
    assert.ok(enrollResult.orderId.startsWith("ord_bnd_"), "Must generate unique order ID");

    // Check bundle entitlement
    const enrolledBundles = await getUserEnrolledBundles(testUserId);
    assert.equal(enrolledBundles.length, 1, "User should have exactly 1 enrolled bundle");
    assert.equal(enrolledBundles[0].bundleId, class10Bundle.id);

    const isBundleUnlocked = await isUserEntitledToBundle(testUserId, class10Bundle.id);
    assert.equal(isBundleUnlocked, true, "User must now be entitled to the bundle");

    // Check individual test access across all 5 included tests
    const includedSlugs = class10Bundle.includedItems.map((i) => i.testSlug);
    for (const slug of includedSlugs) {
      const hasAccess = await isUserEntitledToTest(testUserId, slug);
      assert.equal(hasAccess, true, `User must have unlocked access to test "${slug}" via bundle`);
    }

    // Idempotency check: enrolling again does not create duplicate enrollments
    const secondEnrollResult = await enrollUserInBundle(testUserId, class10Bundle);
    assert.equal(secondEnrollResult.success, true);
    const recheckedBundles = await getUserEnrolledBundles(testUserId);
    assert.equal(recheckedBundles.length, 1, "Idempotent enrollment must not create duplicate bundle records");
  });
});
