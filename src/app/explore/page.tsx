import React, { Suspense } from "react";
import ExploreClient from "./ExploreClient";
import { getAllCanonicalPublishedTests } from "@/data/tests";

export const metadata = {
  title: "Explore Tests — TestOrbit",
  description:
    "Filter and discover mock tests across School Education, Competitive Exams, College Mocks, and Software Development.",
};

export default function ExplorePage() {
  const initialTests = getAllCanonicalPublishedTests();

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Loading test catalogue...</p>
        </div>
      }
    >
      <ExploreClient initialTests={initialTests} />
    </Suspense>
  );
}

