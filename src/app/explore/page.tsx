import React, { Suspense } from "react";
import { connection } from "next/server";
import ExploreClient from "./ExploreClient";
import { fetchCanonicalPublishedTests } from "@/lib/data/testService";
import { fetchCanonicalPublishedBundles } from "@/lib/data/bundleService";

export const metadata = {
  title: "Explore Tests — TestOrbit",
  description:
    "Filter and discover mock tests across School Education, Competitive Exams, College Mocks, and Software Development.",
};

async function ExploreCatalogue() {
  await connection();
  const [initialTests, initialSeries] = await Promise.all([
    fetchCanonicalPublishedTests(),
    fetchCanonicalPublishedBundles(),
  ]);
  return <ExploreClient initialTests={initialTests} initialSeries={initialSeries} />;
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading test catalogue...</p>
        </div>
      }
    >
      <ExploreCatalogue />
    </Suspense>
  );
}
