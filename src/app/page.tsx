import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SearchBar } from "@/components/marketplace/SearchBar";
import { CategoryCard } from "@/components/marketplace/CategoryCard";
import { TestCard } from "@/components/marketplace/TestCard";
import { TestSeriesCard } from "@/components/marketplace/TestSeriesCard";
import { getCategories } from "@/data/categories";
import { getCanonicalFeaturedTests } from "@/data/tests";
import { getAllTestSeries } from "@/data/test-series";

export default function HomePage() {
  const categories = getCategories();
  const featuredTests = getCanonicalFeaturedTests();
  const testSeries = getAllTestSeries().slice(0, 3);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-14 md:pt-24 md:pb-20 border-b border-slate-100 bg-linear-to-b from-slate-50/70 via-white to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Category Highlight Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 mb-6 text-xs text-indigo-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>Curriculum-Aligned Practice Tests & Examination Series</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5 max-w-3xl mx-auto">
            Your next goal starts with a test.
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            Discover mock tests across academics, competitive exams, and professional skills. Practice smarter and understand your preparation.
          </p>

          {/* Prominent Search Bar */}
          <div className="mb-6">
            <SearchBar isHero={true} />
          </div>

          {/* Simple Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/explore">
              <Button variant="primary" size="md" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Explore Tests
              </Button>
            </Link>
            <a href="#categories">
              <Button variant="outline" size="md" className="gap-2">
                Browse Categories
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* 2. Browse by Category */}
      <section id="categories" className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Browse by Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Select your academic stage or target examination to see focused assessments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 3. Featured Tests */}
      <section className="py-14 bg-slate-50/60 border-t border-b border-slate-100 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Featured Tests
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Calibrated to authentic timing, sectional marks, and question formats.
              </p>
            </div>
            <Link
              href="/explore?type=tests"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start md:self-auto"
            >
              Browse all individual tests
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredTests.map((test) => (
              <TestCard key={test.id} test={test} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Test Series */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Curated Test Series
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Multi-test packages designed for complete syllabus coverage and progressive difficulty.
            </p>
          </div>
          <Link
            href="/explore?type=series"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start md:self-auto"
          >
            Explore all test series
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testSeries.map((series) => (
            <TestSeriesCard key={series.id} series={series} />
          ))}
        </div>
      </section>

      {/* 5. Student Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6">
        <div className="p-8 sm:p-10 bg-linear-to-r from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Ready to accelerate your exam readiness?
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl leading-relaxed">
              Join students practicing with authentic question formats, detailed solutions, and curriculum-aligned test packages.
            </p>
          </div>
          <Link href="/signup">
            <Button size="md" className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold border-none whitespace-nowrap shadow-sm">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
