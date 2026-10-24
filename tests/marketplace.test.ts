import assert from "node:assert/strict";
import { test, describe } from "node:test";
import { getCategories, getCategoryBySlug } from "../src/data/categories";
import { getTestBySlug } from "../src/data/tests";
import { filterMarketplaceItems, MarketplaceItem } from "../src/data/marketplace";
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

    for (const slug of expectedSlugs) {
      const cat = getCategoryBySlug(slug);
      assert.ok(cat, `Category ${slug} must exist`);
      assert.ok(cat.name.length > 0, `Category ${slug} must have a title`);
      assert.ok(cat.description.length > 0, `Category ${slug} must have a description`);
    }
  });

  test("2. Safe 404 Lookup for Missing Tests", () => {
    const invalidTest = getTestBySlug("non-existent-exam-slug-123");
    assert.equal(invalidTest, undefined, "Invalid slug should return undefined");
  });

  test("3. Pricing and Duration Formatting", () => {
    assert.equal(formatPriceInRupees(0), "Free");
    assert.equal(formatPriceInRupees(19900), "₹199");
    assert.equal(formatPriceInRupees(149900), "₹1,499");

    assert.equal(formatDuration(45), "45 mins");
    assert.equal(formatDuration(60), "1 hr");
    assert.equal(formatDuration(180), "3 hrs");
    assert.equal(formatDuration(75), "1h 15m");
  });

  test("4. Marketplace Search & Filtering Logic", () => {
    const sampleTests: any[] = [
      {
        id: "t1",
        slug: "python-basics",
        title: "Python Basics",
        categoryId: "cat-programming",
        difficulty: "Beginner",
        priceInPaise: 0,
        isFree: true,
        published: true,
        topics: ["Syntax"],
      },
      {
        id: "t2",
        slug: "class-10-math",
        title: "Class 10 Math",
        categoryId: "cat-school",
        difficulty: "Intermediate",
        priceInPaise: 19900,
        isFree: false,
        published: true,
        topics: ["Algebra"],
      },
      {
        id: "t3",
        slug: "jee-physics",
        title: "JEE Physics",
        categoryId: "cat-competitive",
        difficulty: "Advanced",
        priceInPaise: 49900,
        isFree: false,
        published: true,
        topics: ["Mechanics"],
      },
    ];

    const sampleSeries: any[] = [
      {
        id: "b1",
        slug: "python-bundle",
        title: "Python Mastery Bundle",
        categoryId: "cat-programming",
        priceInPaise: 29900,
        published: true,
        includedTestsCount: 2,
        includedItems: [],
      },
    ];

    // Search query test
    const pythonResults = filterMarketplaceItems(
      {
        searchQuery: "python",
        category: "all",
        difficulty: "all",
        priceRange: "all",
        productType: "all",
        sortBy: "relevance",
      },
      sampleTests,
      sampleSeries
    );
    assert.ok(pythonResults.length >= 1, "Searching for python must return relevant items");
    assert.ok(
      pythonResults.some((i) => i.title.toLowerCase().includes("python")),
      "Results must include python in title"
    );

    // Category filter test
    const schoolResults = filterMarketplaceItems(
      {
        searchQuery: "",
        category: "school-education",
        difficulty: "all",
        priceRange: "all",
        productType: "all",
        sortBy: "relevance",
      },
      sampleTests,
      sampleSeries
    );
    assert.equal(schoolResults.length, 1);
    assert.equal(schoolResults[0].categoryId, "cat-school");

    // Difficulty filter test
    const beginnerResults = filterMarketplaceItems(
      {
        searchQuery: "",
        category: "all",
        difficulty: "Beginner",
        priceRange: "all",
        productType: "all",
        sortBy: "relevance",
      },
      sampleTests,
      sampleSeries
    );
    assert.equal(beginnerResults.length, 1);
    assert.equal(beginnerResults[0].difficulty?.toLowerCase(), "beginner");

    // Free price filter test
    const freeResults = filterMarketplaceItems(
      {
        searchQuery: "",
        category: "all",
        difficulty: "all",
        priceRange: "free",
        productType: "all",
        sortBy: "relevance",
      },
      sampleTests,
      sampleSeries
    );
    assert.equal(freeResults.length, 1);
    assert.equal(freeResults[0].priceInPaise, 0);

    // Product type filter: series only
    const seriesOnly = filterMarketplaceItems(
      {
        searchQuery: "",
        category: "all",
        difficulty: "all",
        priceRange: "all",
        productType: "series",
        sortBy: "relevance",
      },
      sampleTests,
      sampleSeries
    );
    assert.equal(seriesOnly.length, 1);
    assert.equal(seriesOnly[0].type, "series");

    // Sorting by price: low to high
    const sortedAsc = filterMarketplaceItems(
      {
        searchQuery: "",
        category: "all",
        difficulty: "all",
        priceRange: "all",
        productType: "all",
        sortBy: "price-asc",
      },
      sampleTests,
      sampleSeries
    );
    for (let i = 0; i < sortedAsc.length - 1; i++) {
      assert.ok(
        sortedAsc[i].priceInPaise <= sortedAsc[i + 1].priceInPaise,
        "Ascending sort must order from low to high price"
      );
    }
  });
});
