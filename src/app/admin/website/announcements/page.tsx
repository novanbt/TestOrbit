"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSiteCMSConfig } from "@/lib/admin/adminDataService";
import { saveSiteCMSAction } from "@/app/actions/adminStudioActions";
import { SiteCMSConfig } from "@/types/admin";

export default function AnnouncementsCMSPage() {
  const [config, setConfig] = useState<SiteCMSConfig | null>(null);
  const [bannerText, setBannerText] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    getSiteCMSConfig().then((data) => {
      setConfig(data);
      setBannerText(data.announcementBanner?.text || "");
      setActive(data.announcementBanner?.active ?? true);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    const updated: SiteCMSConfig = {
      ...config,
      announcementBanner: {
        active,
        text: bannerText.trim(),
        type: "info",
      },
    };

    const res = await saveSiteCMSAction(updated);
    if (res.success) {
      setFeedback("Promotional announcement banner updated!");
      setTimeout(() => setFeedback(null), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Storefront Announcement Banner
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Display platform-wide alert ribbons for admissions, exam dates, and new test drops.
        </p>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="bannerStatus"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="rounded text-indigo-600"
          />
          <label htmlFor="bannerStatus" className="font-bold text-slate-700 cursor-pointer">
            Banner Visible on Public Website
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700">Announcement Copy</label>
          <textarea
            rows={2}
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? "Saving..." : "Save Announcement"}
          </Button>
        </div>
      </form>
    </div>
  );
}
