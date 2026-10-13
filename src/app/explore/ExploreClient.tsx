"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Filter,
  X,
  SlidersHorizontal,
  RotateCcw,
  Search,
  BookOpen,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TestCard } from "@/components/marketplace/TestCard";
import { TestSeriesCard } from "@/components/marketplace/TestSeriesCard";
import { EmptyState } from "@/components/marketplace/EmptyState";
import { getCategories } from "@/data/categories";
import { getAllTests } from "@/data/tests";
import { getAllTestSeries } from "@/data/test-series";
import { filterMarketplaceItems, MarketplaceItem } from "@/data/marketplace";
import { MockTest, FilterState, ProductTypeFilter, SortOption } from "@/types";

interface ExploreClientProps {
  initialTests?: MockTest[];
}

export default function ExploreClient({ initialTests }: ExploreClientProps = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initial state derived from URL params
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialType = (searchParams.get("type") as ProductTypeFilter) || "all";
  const initialDifficulty = searchParams.get("difficulty") || "all";
  const initialPrice = searchParams.get("price") || "all";
  const initialSort = (searchParams.get("sort") as SortOption) || "relevance";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedType, setSelectedType] = useState<ProductTypeFilter>(initialType);
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialDifficulty);
  const [selectedPriceRange, setSelectedPriceRange] = useState(initialPrice);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state if URL changes externally
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== searchQuery) setSearchQuery(q);

    const cat = searchParams.get("category");
    if (cat !== null && cat !== selectedCategory) setSelectedCategory(cat);

    const t = searchParams.get("type") as ProductTypeFilter;
    if (t && t !== selectedType) setSelectedType(t);
  }, [searchParams]);

  const categories = getCategories();
  const [allTests, setAllTests] = useState<MockTest[]>(initialTests || getAllTests());
  const allSeries = getAllTestSeries();

  useEffect(() => {
    if (initialTests && initialTests.length > 0) {
      setAllTests(initialTests);
    }

    // Always fetch fresh canonical tests from Firestore on client mount
    import("@/lib/data/testService").then(({ fetchCanonicalPublishedTests }) => {
      fetchCanonicalPublishedTests().then((fresh) => {
        if (fresh && fresh.length > 0) {
          setAllTests(fresh);
        }
      });
    });

    const handleUpdate = () => {
      import("@/lib/data/testService").then(({ fetchCanonicalPublishedTests }) => {
        fetchCanonicalPublishedTests().then((fresh) => {
          if (fresh && fresh.length > 0) {
            setAllTests(fresh);
          }
        });
      });
    };

    window.addEventListener("testorbit_admin_data_updated", handleUpdate);
    return () => window.removeEventListener("testorbit_admin_data_updated", handleUpdate);
  }, [initialTests]);


  const filterState: FilterState = useMemo(
    () => ({
      searchQuery,
      category: selectedCategory,
      difficulty: selectedDifficulty,
      priceRange: selectedPriceRange,
      productType: selectedType,
      sortBy,
    }),
    [
      searchQuery,
      selectedCategory,
      selectedDifficulty,
      selectedPriceRange,
      selectedType,
      sortBy,
    ]
  );

  const filteredItems = useMemo(
    () => filterMarketplaceItems(filterState, allTests),
    [filterState, allTests]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (selectedType !== "all") count++;
    if (selectedDifficulty !== "all") count++;
    if (selectedPriceRange !== "all") count++;
    return count;
  }, [
    selectedCategory,
    selectedType,
    selectedDifficulty,
    selectedPriceRange,
  ]);


  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedType("all");
    setSelectedDifficulty("all");
    setSelectedPriceRange("all");
    setSortBy("relevance");
    router.push("/explore");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Page Title & Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-600">
              Mock Assessment Marketplace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Tests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified mock examinations, subject drills, and full-length bundles.
          </p>
        </div>

        {/* Search Bar Inline */}
        <div className="relative w-full md:w-80">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exams, subjects, skills..."
            className="w-full h-10 pl-9 pr-8 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Mobile Filter Button */}
        <div className="w-full lg:hidden flex items-center justify-between py-2 border-b border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(true)}
            className="gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>

          <span className="text-xs text-slate-500">
            {filteredItems.length} {filteredItems.length === 1 ? "result" : "results"}
          </span>
        </div>

        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6 bg-slate-50/70 p-5 pb-6 rounded-xl border border-slate-200/90 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain custom-scrollbar">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 sticky top-0 bg-slate-50/95 backdrop-blur-xs z-10 -mt-2 pt-2 -mx-1 px-1">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-semibold text-slate-900">Filters</h2>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>


          {/* Product Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Format Type
            </label>
            <div className="flex flex-col space-y-1">
              {[
                { id: "all", label: "All Items" },
                { id: "tests", label: "Individual Tests" },
                { id: "series", label: "Test Series Bundles" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedType(opt.id as ProductTypeFilter)}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    selectedType === opt.id
                      ? "bg-indigo-600 text-white font-medium shadow-xs"
                      : "text-slate-700 hover:bg-slate-200/70"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Category
            </label>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white font-medium shadow-xs"
                    : "text-slate-700 hover:bg-slate-200/70"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                    selectedCategory === cat.slug
                      ? "bg-indigo-600 text-white font-medium shadow-xs"
                      : "text-slate-700 hover:bg-slate-200/70"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Difficulty
            </label>
            <div className="flex flex-col space-y-1">
              {["all", "Beginner", "Intermediate", "Advanced"].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedDifficulty(level)}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    selectedDifficulty.toLowerCase() === level.toLowerCase()
                      ? "bg-indigo-600 text-white font-medium shadow-xs"
                      : "text-slate-700 hover:bg-slate-200/70"
                  }`}
                >
                  {level === "all" ? "All Levels" : level}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
              Price Range
            </label>
            <div className="flex flex-col space-y-1">
              {[
                { id: "all", label: "All Prices" },
                { id: "free", label: "Free Only" },
                { id: "under-299", label: "Under ₹299" },
                { id: "299-499", label: "₹299 to ₹499" },
                { id: "500-plus", label: "₹500 and above" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPriceRange(p.id)}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-md transition-colors ${
                    selectedPriceRange === p.id
                      ? "bg-indigo-600 text-white font-medium shadow-xs"
                      : "text-slate-700 hover:bg-slate-200/70"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Results Column */}
        <main className="flex-1 w-full space-y-5">
          {/* Controls Bar: Count, Active Filter Tags & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-900">
                {filteredItems.length}
              </span>
              <span>{filteredItems.length === 1 ? "item found" : "items found"}</span>
              {activeFiltersCount > 0 && (
                <span className="hidden sm:inline text-slate-400">
                  (filtered from {allTests.length + allSeries.length} total)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs text-slate-500 whitespace-nowrap">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort tests by"
                className="h-8 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="duration">Longest Duration</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pills */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-medium">Applied:</span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Category: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory("all")} aria-label="Remove category filter">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </Badge>
              )}
              {selectedType !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Format: {selectedType === "tests" ? "Individual Tests" : "Bundles"}
                  <button onClick={() => setSelectedType("all")} aria-label="Remove format filter">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </Badge>
              )}
              {selectedDifficulty !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Difficulty: {selectedDifficulty}
                  <button onClick={() => setSelectedDifficulty("all")} aria-label="Remove difficulty filter">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </Badge>
              )}
              {selectedPriceRange !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Price: {selectedPriceRange}
                  <button onClick={() => setSelectedPriceRange("all")} aria-label="Remove price filter">
                    <X className="w-3 h-3 ml-0.5" />
                  </button>
                </Badge>
              )}
              <button
                onClick={resetAllFilters}
                className="text-xs text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Items Grid or Empty State */}
          {filteredItems.length === 0 ? (
            <EmptyState onResetFilters={resetAllFilters} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                if (item.type === "series") {
                  const seriesData = allSeries.find((s) => s.id === item.id);
                  return seriesData ? (
                    <TestSeriesCard key={item.id} series={seriesData} />
                  ) : null;
                } else {
                  const testData = allTests.find((t) => t.id === item.id);
                  return testData ? (
                    <TestCard key={item.id} test={testData} />
                  ) : null;
                }
              })}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Filters</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Format Filter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Format
              </span>
              <div className="flex flex-col space-y-1">
                {[
                  { id: "all", label: "All Items" },
                  { id: "tests", label: "Individual Tests" },
                  { id: "series", label: "Test Series Bundles" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedType(opt.id as ProductTypeFilter)}
                    className={`text-left text-xs px-3 py-2 rounded-md ${
                      selectedType === opt.id
                        ? "bg-indigo-600 text-white font-medium"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Category Filter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Category
              </span>
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`text-left text-xs px-3 py-2 rounded-md ${
                    selectedCategory === "all"
                      ? "bg-indigo-600 text-white font-medium"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`text-left text-xs px-3 py-2 rounded-md ${
                      selectedCategory === cat.slug
                        ? "bg-indigo-600 text-white font-medium"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Difficulty Filter */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Difficulty
              </span>
              <div className="flex flex-col space-y-1">
                {["all", "Beginner", "Intermediate", "Advanced"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedDifficulty(lvl)}
                    className={`text-left text-xs px-3 py-2 rounded-md ${
                      selectedDifficulty.toLowerCase() === lvl.toLowerCase()
                        ? "bg-indigo-600 text-white font-medium"
                        : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {lvl === "all" ? "All Levels" : lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions in Mobile Drawer */}
            <div className="pt-4 border-t border-slate-200 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="flex-1"
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-1"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
