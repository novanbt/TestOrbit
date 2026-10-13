"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Palette,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Eye,
  Type,
  MapPin,
} from "lucide-react";
import { StudioBadge } from "@/components/admin/StudioUI";
import { BrandingSettings } from "@/types/admin";
import { saveBrandingSettingsAction } from "@/app/actions/adminStudioActions";

const DEFAULT_BRANDING: BrandingSettings = {
  brandName: "TestOrbit",
  tagline: "India's Premier Computer-Based Test Simulation Platform",
  primaryColor: "#0284c7",
  accentColor: "#3b82f6",
  fontFamily: "Inter, system-ui, sans-serif",
  contactAddress: "Bengaluru, Karnataka, India",
};

export default function AdminBrandingPage() {
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBranding() {
      try {
        const res = await fetch("/api/admin/settings/branding");
        if (res.ok) {
          const data = await res.json();
          if (data.branding) setBranding(data.branding);
        }
      } catch {}
    }
    loadBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await saveBrandingSettingsAction(branding);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Failed to update branding settings.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Branding & Visuals</h1>
            <StudioBadge variant="info">Visual Identity</StudioBadge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage TestOrbit visual tokens, color scheme, logos, and typographic styles.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving Changes..." : "Save Branding"}
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Branding tokens saved successfully. Updated for the storefront and studio.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Live Brand Preview Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
            <Eye className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Live Brand Preview</h2>
          </div>

          <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md"
                style={{ backgroundColor: branding.primaryColor }}
              >
                TO
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: branding.fontFamily }}>
                  {branding.brandName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{branding.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm"
                style={{ backgroundColor: branding.primaryColor }}
              >
                Primary Button
              </button>
              <button
                type="button"
                className="px-4 py-2 text-xs font-semibold rounded-lg border shadow-xs"
                style={{ color: branding.primaryColor, borderColor: branding.primaryColor }}
              >
                Secondary
              </button>
            </div>
          </div>
        </div>

        {/* Brand Identifiers */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Brand Elements</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={branding.brandName}
                onChange={(e) => setBranding({ ...branding, brandName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tagline</label>
              <input
                type="text"
                value={branding.tagline}
                onChange={(e) => setBranding({ ...branding, tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Font Family</label>
              <select
                value={branding.fontFamily}
                onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter, system-ui, sans-serif">Inter (Modern & Clean - Default)</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Outfit', sans-serif">Outfit</option>
                <option value="system-ui, sans-serif">System Native Sans</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Address</label>
              <input
                type="text"
                value={branding.contactAddress || ""}
                onChange={(e) => setBranding({ ...branding, contactAddress: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Color Palette */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Palette className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-slate-900">Color Tokens</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Brand Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Used for primary action buttons, links, and badges.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Accent Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="w-10 h-10 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={branding.accentColor}
                  onChange={(e) => setBranding({ ...branding, accentColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Used for highlights, borders, and gradient highlights.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Branding Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
}
