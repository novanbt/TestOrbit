"use client";

import React, { useState, useEffect } from "react";
import { MockTest } from "@/types";
import { TestCard } from "./TestCard";

interface FeaturedTestsClientProps {
  initialTests: MockTest[];
}

export function FeaturedTestsClient({ initialTests }: FeaturedTestsClientProps) {
  const [tests, setTests] = useState<MockTest[]>(initialTests !== undefined ? initialTests : []);

  useEffect(() => {
    if (initialTests !== undefined) {
      setTests(initialTests);
    }

    // Refresh from Firestore upon mount to guarantee live freshness
    import("@/lib/data/testService").then(({ fetchCanonicalFeaturedTests }) => {
      fetchCanonicalFeaturedTests().then((fresh) => {
        if (Array.isArray(fresh)) {
          setTests(fresh);
        }
      });
    });
  }, [initialTests]);

  if (tests.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
        <p className="text-sm font-medium text-slate-600">No mock tests currently published</p>
        <p className="text-xs text-slate-400 mt-1">Check back soon or explore our curated test series bundles below.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {tests.map((test) => (
        <TestCard key={test.id} test={test} />
      ))}
    </div>
  );
}
