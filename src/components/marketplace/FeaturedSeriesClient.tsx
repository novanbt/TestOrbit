"use client";

import React, { useState, useEffect } from "react";
import { TestBundle } from "@/types";
import { TestSeriesCard } from "./TestSeriesCard";

interface FeaturedSeriesClientProps {
  initialSeries: TestBundle[];
}

export function FeaturedSeriesClient({ initialSeries }: FeaturedSeriesClientProps) {
  const [seriesList, setSeriesList] = useState<TestBundle[]>(
    initialSeries !== undefined ? initialSeries : []
  );

  useEffect(() => {
    if (initialSeries !== undefined) {
      setSeriesList(initialSeries);
    }

    // Refresh from Firestore upon mount to guarantee live freshness
    import("@/lib/data/bundleService").then(({ fetchCanonicalFeaturedBundles }) => {
      fetchCanonicalFeaturedBundles().then((fresh) => {
        if (Array.isArray(fresh)) {
          setSeriesList(fresh);
        }
      });
    });
  }, [initialSeries]);

  if (seriesList.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
        <p className="text-xs text-slate-500">
          New test series packages are being prepared by curriculum experts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {seriesList.map((series) => (
        <TestSeriesCard key={series.id} series={series} />
      ))}
    </div>
  );
}
