"use client";

import React, { useState, useEffect } from "react";
import { Globe, Save, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSiteCMSConfig } from "@/lib/admin/adminDataService";
import { saveSiteCMSAction } from "@/app/actions/adminStudioActions";
import { SiteCMSConfig } from "@/types/admin";

export default function HomepageCMSPage() {
  const [config, setConfig] = useState<SiteCMSConfig>({
    heroTitle: "Standardized Computer-Based Test Simulations",
    heroSubtitle: "Practice real curriculum-aligned exam formats with instant scoring and detailed topic breakdowns.",
    featuredTestIds: [],
    featuredSeriesIds: [],
    announcementBanner: {
      active: true,
      text: "🎓 All 2026 JEE Main & NEET UG Practice Mocks are now live with updated syllabus patterns!",
      type: "info",
    },
    faqs: [],
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    getSiteCMSConfig().then(setConfig);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await saveSiteCMSAction(config);
    if (res.success) {
      setFeedback("Homepage CMS configuration published live!");
      setTimeout(() => setFeedback(null), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Homepage Content Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure primary headlines, student messaging, and promotional announcements.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          disabled={saving}
          onClick={handleSave}
          className="text-xs"
        >
          <Save className="w-3.5 h-3.5 mr-1" />
          <span>{saving ? "Publishing..." : "Publish to Live Site"}</span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-5 text-xs">
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700">Hero Section Main Title</label>
          <input
            type="text"
            value={config.heroTitle || ""}
            onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
            className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-slate-700">Hero Subtitle</label>
          <textarea
            rows={2}
            value={config.heroSubtitle || ""}
            onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
            className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-3">
          <span className="font-bold text-slate-900 block">Promotional Top Announcement</span>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bannerActive"
              checked={config.announcementBanner?.active ?? true}
              onChange={(e) =>
                setConfig({
                  ...config,
                  announcementBanner: {
                    active: e.target.checked,
                    text: config.announcementBanner?.text || "",
                    type: "info",
                  },
                })
              }
              className="rounded text-indigo-600"
            />
            <label htmlFor="bannerActive" className="text-xs font-medium text-slate-700 cursor-pointer">
              Enable announcement banner on public storefront
            </label>
          </div>

          <input
            type="text"
            value={config.announcementBanner?.text || ""}
            onChange={(e) =>
              setConfig({
                ...config,
                announcementBanner: {
                  active: config.announcementBanner?.active ?? true,
                  text: e.target.value,
                  type: "info",
                },
              })
            }
            placeholder="Banner announcement message..."
            className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none"
          />
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <Button type="submit" variant="primary" size="sm" disabled={saving} className="text-xs">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
