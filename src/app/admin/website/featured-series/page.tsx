"use client";

import React, { useState, useEffect } from "react";
import { Layers, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchCanonicalBundles } from "@/lib/data/bundleService";
import { saveSeriesAction } from "@/app/actions/adminStudioActions";
import { TestBundle } from "@/types";

export default function FeaturedSeriesCMSPage() {
  const [seriesList, setSeriesList] = useState<TestBundle[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCanonicalBundles().then(setSeriesList);
  }, []);

  const handleToggleFeatured = async (series: TestBundle) => {
    setSavingId(series.id);
    const updated = { ...series, isFeatured: !series.isFeatured, updatedAt: new Date().toISOString() };
    const res = await saveSeriesAction(updated);
    if (res.success) {
      setSeriesList((prev) => prev.map((s) => (s.id === series.id ? updated : s)));
    }
    setSavingId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Featured Test Series Shelf
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Curate which test series packages appear on the homepage showcase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {seriesList.map((s) => (
          <div key={s.id} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">₹{(s.priceInPaise / 100).toFixed(0)}</span>
                {s.isFeatured ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    Featured Shelf
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Standard</span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{s.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <Button
                variant={s.isFeatured ? "outline" : "primary"}
                size="sm"
                disabled={savingId === s.id}
                onClick={() => handleToggleFeatured(s)}
                className="h-7 text-xs"
              >
                {s.isFeatured ? "Remove from Shelf" : "Feature on Homepage"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
