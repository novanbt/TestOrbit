import React from "react";
import { Metadata } from "next";
import { Layers } from "lucide-react";
import { connection } from "next/server";
import { fetchCanonicalPublishedBundles } from "@/lib/data/bundleService";
import { CATEGORIES } from "@/data/categories";
import SeriesCatalogClient from "./SeriesCatalogClient";

export const instant = false;

export const metadata: Metadata = {
  title: "Curated Test Series & Exam Bundles — TestOrbit",
  description:
    "Explore multi-test curated packages and chapter-wise test series. Single purchase unlocks all included mock tests with authentic marking keys and analytics.",
};

export default async function SeriesCatalogPage() {
  await connection();
  const publishedBundles = await fetchCanonicalPublishedBundles();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
          <Layers className="w-3.5 h-3.5" />
          <span>Multi-Test Curriculum Packages</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Curated Test Series Bundles
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Complete more of your syllabus with handpicked mock tests in one convenient package. Purchase once and get instant unlocked access to every included examination paper.
        </p>
      </div>

      <SeriesCatalogClient bundles={publishedBundles} categories={CATEGORIES} />
    </div>
  );
}
