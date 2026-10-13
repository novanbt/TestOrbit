import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  fetchCanonicalCategories,
  saveCanonicalCategory,
  deleteCanonicalCategory,
} from "../src/lib/data/categoryService";
import {
  fetchCanonicalTaxonomy,
  saveCanonicalSubject,
  deleteCanonicalSubject,
} from "../src/lib/data/taxonomyService";
import {
  getAllCanonicalBundles,
  saveCanonicalBundle,
  deleteCanonicalBundle,
  getCanonicalBundleBySlug,
} from "../src/lib/data/bundleService";
import {
  enrollUserInBundle,
  enrollUserInTest,
  isUserEntitledToBundle,
  isUserEntitledToTest,
  getUserEnrolledBundles,
} from "../src/lib/data/entitlementService";

describe("TestOrbit Full Data Architecture & Backend Lifecycle Tests", () => {
  test("1. Category Lifecycle (Fetch, Save, Delete)", async () => {
    const initialCategories = await fetchCanonicalCategories();
    assert.ok(initialCategories.length >= 4, "Should have default categories");

    const testCat = {
      id: "cat-test-lifecycle",
      name: "Quantum Computing & AI",
      slug: "quantum-ai",
      description: "Advanced simulation category",
      iconName: "Cpu",
      testCount: 5,
    };

    const saved = await saveCanonicalCategory(testCat);
    assert.equal(saved.id, "cat-test-lifecycle");
    assert.equal(saved.slug, "quantum-ai");

    const withSaved = await fetchCanonicalCategories();
    assert.ok(
      withSaved.some((c) => c.id === "cat-test-lifecycle"),
      "Saved category should be present"
    );

    await deleteCanonicalCategory("cat-test-lifecycle", "quantum-ai");
    const afterDelete = await fetchCanonicalCategories();
    assert.ok(
      !afterDelete.some((c) => c.id === "cat-test-lifecycle"),
      "Deleted category should not be present"
    );
  });

  test("2. Taxonomy Subject & Topic Hierarchy Lifecycle", async () => {
    const initialTax = await fetchCanonicalTaxonomy();
    assert.ok(initialTax.length >= 4, "Should have base subjects");

    const newSubject = {
      id: "sub-biotech-001",
      name: "Biotechnology & Genetics",
      slug: "biotechnology-genetics",
      categoryId: "cat-competitive",
      topics: ["CRISPR & Gene Editing", "Recombinant DNA", "Bioinformatics"],
    };

    const saved = await saveCanonicalSubject(newSubject);
    assert.equal(saved.id, "sub-biotech-001");
    assert.equal(saved.topics.length, 3);

    const taxList = await fetchCanonicalTaxonomy();
    const found = taxList.find((s) => s.id === "sub-biotech-001");
    assert.ok(found, "Subject should exist in canonical taxonomy");
    assert.equal(found?.topics.length, 3);

    await deleteCanonicalSubject("sub-biotech-001");
    const afterDelete = await fetchCanonicalTaxonomy();
    assert.ok(
      !afterDelete.some((s) => s.id === "sub-biotech-001"),
      "Deleted subject should be removed"
    );
  });

  test("3. Test Series Bundle Creation, Resolution & Deletion", async () => {
    const initialBundles = getAllCanonicalBundles();
    assert.ok(initialBundles.length >= 4, "Should have initial test series");

    const customBundle = {
      id: "bundle-test-lifecycle",
      slug: "custom-gate-ds-ai-pack",
      title: "GATE Data Science & AI Complete Series",
      categoryId: "cat-competitive",
      categoryName: "Competitive Examinations",
      targetAudience: "GATE DA aspirants",
      shortDescription: "3 full length simulations for GATE DA.",
      description: "Comprehensive test series covering Linear Algebra, Probability, Machine Learning, and Python.",
      includedItems: [
        {
          testId: "test-002",
          testSlug: "gate-data-science-ai-grand-mock",
          testTitle: "GATE Data Science & AI Grand Mock",
          displayOrder: 1,
        },
      ],
      priceInPaise: 49900,
      originalPriceInPaise: 99900,
      discountPercentage: 50,
      status: "published" as const,
      published: true,
      accessDurationDays: 180,
      includedTestsCount: 1,
      isFeatured: true,
      tags: ["GATE", "AI", "Data Science"],
      createdAt: new Date().toISOString(),
    };

    await saveCanonicalBundle(customBundle);
    const lookup = getCanonicalBundleBySlug("custom-gate-ds-ai-pack");
    assert.ok(lookup, "Bundle should be found by slug");
    assert.equal(lookup?.id, "bundle-test-lifecycle");
    assert.equal(lookup?.priceInPaise, 49900);

    await deleteCanonicalBundle("bundle-test-lifecycle");
    const lookupAfter = getCanonicalBundleBySlug("custom-gate-ds-ai-pack");
    assert.equal(lookupAfter, undefined, "Bundle should be deleted");
  });

  test("4. User Bundle Enrollment & Entitlement Resolution", async () => {
    const userId = "candidate-test-usr-999";
    const bundle = {
      id: "bundle-entitlement-test",
      slug: "neet-physics-chem-pack",
      title: "NEET Physics & Chemistry Power Pack",
      categoryId: "cat-competitive",
      categoryName: "Competitive Examinations",
      targetAudience: "NEET Aspirants",
      shortDescription: "Complete test pack",
      description: "Description",
      includedItems: [
        {
          testId: "test-neet-p1",
          testSlug: "neet-physics-paper-1",
          testTitle: "NEET Physics Paper 1",
          displayOrder: 1,
        },
      ],
      priceInPaise: 29900,
      originalPriceInPaise: 59900,
      discountPercentage: 50,
      status: "published" as const,
      published: true,
      accessDurationDays: 90,
      includedTestsCount: 1,
      isFeatured: false,
      tags: ["NEET"],
      createdAt: new Date().toISOString(),
    };

    const res = await enrollUserInBundle(userId, bundle, {
      email: "testcandidate@testorbit.in",
      name: "Test Candidate",
    });

    assert.ok(res.success, "Bundle enrollment should succeed");
    assert.ok(res.orderId.startsWith("ord_bnd_"), "Order ID should be generated");

    const isEntitledToBundle = await isUserEntitledToBundle(userId, "neet-physics-chem-pack");
    assert.equal(isEntitledToBundle, true, "User should be entitled to the bundle");

    const isEntitledToTest = await isUserEntitledToTest(userId, "neet-physics-paper-1");
    assert.equal(isEntitledToTest, true, "User should be entitled to tests in the bundle");

    const bundles = await getUserEnrolledBundles(userId);
    assert.ok(bundles.length > 0, "User should have enrolled bundles");
    assert.equal(bundles[0].bundleId, "bundle-entitlement-test");
  });

  test("5. Individual Test Direct Enrollment", async () => {
    const userId = "candidate-direct-tst-888";
    const testItem = {
      id: "test-sat-math-level-2",
      slug: "sat-math-level-2",
      title: "SAT Math Level 2 Mock Examination",
      priceInPaise: 14900,
    };

    const res = await enrollUserInTest(userId, testItem, {
      email: "satstudent@testorbit.in",
      name: "SAT Student",
    });

    assert.ok(res.success, "Test enrollment should succeed");
    assert.ok(res.orderId.startsWith("ord_tst_"), "Test order ID should be generated");

    const isEntitled = await isUserEntitledToTest(userId, "sat-math-level-2");
    assert.equal(isEntitled, true, "User should be entitled to individual test");
  });
});
