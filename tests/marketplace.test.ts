import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { getCategories, getCategoryBySlug } from "../src/data/categories";
import { getAllTests, getTestBySlug, getFeaturedTests } from "../src/data/tests";
import { getAllTestSeries, getTestSeriesBySlug } from "../src/data/test-series";
import { filterMarketplaceItems, getAllMarketplaceItems } from "../src/data/marketplace";
import { formatPriceInRupees, formatDuration } from "../src/lib/utils";

describe("TestOrbit Marketplace Core Tests", () => {
  test("1. Categories Architecture", () => {
    const categories = getCategories();
    assert.equal(categories.length, 6, "Expected exactly 6 main categories for Phase 1");

    const expectedSlugs = [
      "school-education",
      "competitive-exams",
      "college-university",
      "programming-technology",
      "languages",
      "professional-skills",
    ];

    const expectedCounts: Record<string, number> = {
      "school-education": 15,
      "competitive-exams": 29,
      "college-university": 16,
      "programming-technology": 23,
      "languages": 25,
      "professional-skills": 11,
    };

    for (const slug of expectedSlugs) {
      const cat = getCategoryBySlug(slug);
      assert.ok(cat, `Category ${slug} must exist`);
      assert.ok(cat.name.length > 0, `Category ${slug} must have a title`);
      assert.ok(cat.description.length > 0, `Category ${slug} must have a description`);
      assert.equal(cat.testCount, expectedCounts[slug], `Category ${slug} testCount must be ${expectedCounts[slug]}`);
    }
  });

  test("2. Mock Tests Data Integrity", () => {
    const tests = getAllTests();
    assert.equal(tests.length, 115, "Should have exactly 115 mock tests across all categories");

    const categoryCounts: Record<string, number> = {};
    const seenSlugs = new Set<string>();
    const seenIds = new Set<string>();

    for (const t of tests) {
      assert.ok(t.slug, `Test ${t.id} must have a slug`);
      assert.ok(!seenSlugs.has(t.slug), `Duplicate slug detected: ${t.slug}`);
      seenSlugs.add(t.slug);

      assert.ok(t.id, `Test must have an ID`);
      assert.ok(!seenIds.has(t.id), `Duplicate ID detected: ${t.id}`);
      seenIds.add(t.id);

      assert.ok(t.title, `Test ${t.id} must have a title`);
      assert.ok(t.questionCount > 0, `Test ${t.id} must have positive question count`);
      assert.ok(t.durationMinutes > 0, `Test ${t.id} must have positive duration`);
      assert.ok(typeof t.priceInPaise === "number", `Test ${t.id} must store price in paise`);
      assert.ok(t.topics.length > 0, `Test ${t.id} must have syllabus topics`);
      assert.ok(t.expectations.length > 0, `Test ${t.id} must have learner expectations`);
      assert.equal(t.published, true, `Only published tests should be returned`);

      categoryCounts[t.categoryId] = (categoryCounts[t.categoryId] || 0) + 1;
    }

    assert.equal(categoryCounts["cat-school"], 14, "School Education must have exactly 14 tests");
    assert.equal(categoryCounts["cat-competitive"], 28, "Competitive Exams must have exactly 28 tests");
    assert.equal(categoryCounts["cat-college"], 16, "College & University must have exactly 16 tests");
    assert.equal(categoryCounts["cat-programming"], 22, "Programming & Technology must have exactly 22 tests");
    assert.equal(categoryCounts["cat-languages"], 24, "Languages must have exactly 24 tests");
    assert.equal(categoryCounts["cat-professional"], 11, "Professional Skills must have exactly 11 tests");

    // Lookup by valid slug
    const mathTest = getTestBySlug("class-10-mathematics-full-syllabus");
    assert.ok(mathTest, "Should find Class X Math test by slug");
    assert.equal(mathTest?.categoryName, "School Education");

    // Lookup by invalid slug returns undefined (handles 404 gracefully)
    const invalidTest = getTestBySlug("non-existent-exam-slug-123");
    assert.equal(invalidTest, undefined, "Invalid slug should return undefined");
  });

  test("3. Test Series Bundles Integrity", () => {
    const seriesList = getAllTestSeries();
    assert.ok(seriesList.length >= 3, "Requires test series bundles");
    assert.ok(seriesList.length > 0, "Must have sample test series");

    for (const s of seriesList) {
      assert.ok(s.slug, "Series must have slug");
      assert.ok(s.includedTestsCount > 1, "Series must bundle multiple tests");
      assert.ok(s.targetAudience.length > 0, "Series must specify target audience");
    }

    const jeeSeries = getTestSeriesBySlug("jee-main-full-spectrum-bundle");
    assert.ok(jeeSeries, "Should find JEE Main bundle by slug");
  });

  test("4. Pricing and Duration Formatting", () => {
    assert.equal(formatPriceInRupees(0), "Free");
    assert.equal(formatPriceInRupees(19900), "₹199");
    assert.equal(formatPriceInRupees(149900), "₹1,499");

    assert.equal(formatDuration(45), "45 mins");
    assert.equal(formatDuration(60), "1 hr");
    assert.equal(formatDuration(180), "3 hrs");
    assert.equal(formatDuration(75), "1h 15m");
  });

  test("5. Marketplace Search & Filtering Logic", () => {
    const allItems = getAllMarketplaceItems();
    assert.ok(allItems.length > 0);

    // Search query test
    const pythonResults = filterMarketplaceItems({
      searchQuery: "python",
      category: "all",
      difficulty: "all",
      priceRange: "all",
      productType: "all",
      sortBy: "relevance",
    });
    assert.ok(pythonResults.length >= 1, "Searching for python must return relevant items");
    assert.ok(
      pythonResults.some((i) => i.title.toLowerCase().includes("python")),
      "Results must include python in title"
    );

    // Category filter test
    const schoolResults = filterMarketplaceItems({
      searchQuery: "",
      category: "school-education",
      difficulty: "all",
      priceRange: "all",
      productType: "all",
      sortBy: "relevance",
    });
    assert.ok(schoolResults.length > 0, "School category must have tests");
    assert.ok(
      schoolResults.every((i) => i.categoryId === "cat-school"),
      "All filtered items must belong to cat-school"
    );

    // Difficulty filter test
    const beginnerResults = filterMarketplaceItems({
      searchQuery: "",
      category: "all",
      difficulty: "Beginner",
      priceRange: "all",
      productType: "all",
      sortBy: "relevance",
    });
    assert.ok(beginnerResults.length > 0);
    assert.ok(
      beginnerResults.every((i) => i.difficulty?.toLowerCase() === "beginner"),
      "Difficulty filter must match beginner"
    );

    // Free price filter test
    const freeResults = filterMarketplaceItems({
      searchQuery: "",
      category: "all",
      difficulty: "all",
      priceRange: "free",
      productType: "all",
      sortBy: "relevance",
    });
    assert.ok(freeResults.length > 0);
    assert.ok(
      freeResults.every((i) => i.priceInPaise === 0 || i.isFree),
      "Free price filter must return items with 0 price"
    );

    // Format filter test (series only)
    const seriesOnly = filterMarketplaceItems({
      searchQuery: "",
      category: "all",
      difficulty: "all",
      priceRange: "all",
      productType: "series",
      sortBy: "relevance",
    });
    assert.ok(seriesOnly.every((i) => i.type === "series"));

    // Sorting by price: low to high
    const sortedAsc = filterMarketplaceItems({
      searchQuery: "",
      category: "all",
      difficulty: "all",
      priceRange: "all",
      productType: "all",
      sortBy: "price-asc",
    });
    for (let i = 0; i < sortedAsc.length - 1; i++) {
      assert.ok(
        sortedAsc[i].priceInPaise <= sortedAsc[i + 1].priceInPaise,
        "Ascending sort must order from low to high price"
      );
    }
  });
});
