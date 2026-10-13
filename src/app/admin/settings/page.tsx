"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  Clock,
  Shield,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  Sliders,
} from "lucide-react";
import { StudioBadge } from "@/components/admin/StudioUI";
import { PlatformSettings } from "@/types/admin";
import { savePlatformSettingsAction } from "@/app/actions/adminStudioActions";

const DEFAULT_SETTINGS: PlatformSettings = {
  platformName: "TestOrbit",
  supportEmail: "support@testorbit.in",
  defaultCurrency: "INR",
  currencySymbol: "₹",
  timezone: "Asia/Kolkata",
  defaultExamDurationMinutes: 60,
  defaultPassingPercentage: 40,
  enableNegativeMarking: true,
  defaultNegativeMarkingRate: 0.25,
  allowReviewLater: true,
  autoSaveIntervalSeconds: 15,
  allowCalculator: false,
  resultReleasePolicy: "immediate",
  maintenanceMode: false,
};

export default function AdminGeneralSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings/platform");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setSettings(data.settings);
        }
      } catch {}
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await savePlatformSettingsAction(settings);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.error || "Failed to update platform settings.");
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">General Settings</h1>
            <StudioBadge variant="info">Global Config</StudioBadge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure examination engine parameters, currency defaults, and security policies.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Saving Changes..." : "Save Configuration"}
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Platform settings saved successfully to authoritative Firestore configuration document.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Platform Identity & Support */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Platform Identity & Localization</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Currency
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.defaultCurrency}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className="w-1/2 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                  placeholder="Symbol (₹)"
                  className="w-1/2 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Platform Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+05:30)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Exam Engine Parameters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-slate-900">Examination Engine Defaults</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="360"
                value={settings.defaultExamDurationMinutes}
                onChange={(e) => setSettings({ ...settings, defaultExamDurationMinutes: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Passing Score (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.defaultPassingPercentage}
                onChange={(e) => setSettings({ ...settings, defaultPassingPercentage: parseInt(e.target.value) || 40 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Autosave Interval (Seconds)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={settings.autoSaveIntervalSeconds}
                onChange={(e) => setSettings({ ...settings, autoSaveIntervalSeconds: parseInt(e.target.value) || 15 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Result Release Policy
              </label>
              <select
                value={settings.resultReleasePolicy}
                onChange={(e) => setSettings({ ...settings, resultReleasePolicy: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="immediate">Immediate: Show Score & Answers on Submission</option>
                <option value="scheduled">Scheduled: Release Answers after Window Closes</option>
                <option value="manual">Manual: Require Administrator Approval Before Release</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Negative Marking Penalty Rate (Ratio of Question Mark)
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.defaultNegativeMarkingRate}
                onChange={(e) => setSettings({ ...settings, defaultNegativeMarkingRate: parseFloat(e.target.value) || 0.25 })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Standard: 0.25 (i.e. -1 for a 4-mark question)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <input
                type="checkbox"
                checked={settings.enableNegativeMarking}
                onChange={(e) => setSettings({ ...settings, enableNegativeMarking: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Negative Marking</span>
                <span className="text-[11px] text-slate-500">Apply score penalty for wrong answers</span>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <input
                type="checkbox"
                checked={settings.allowReviewLater}
                onChange={(e) => setSettings({ ...settings, allowReviewLater: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Mark for Review</span>
                <span className="text-[11px] text-slate-500">Allow candidate bookmarking in runner</span>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-3 border border-slate-100 rounded-lg hover:bg-slate-50">
              <input
                type="checkbox"
                checked={settings.allowCalculator}
                onChange={(e) => setSettings({ ...settings, allowCalculator: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">Virtual Calculator</span>
                <span className="text-[11px] text-slate-500">Enable on-screen scientific calculator</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Safety & Maintenance */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-rose-600" />
            <h2 className="text-sm font-semibold text-slate-900">Emergency & Maintenance Mode</h2>
          </div>

          <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="w-4 h-4 text-rose-600 rounded mt-0.5"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Enable Maintenance Mode</span>
              <span className="text-xs text-slate-500 leading-relaxed block mt-0.5">
                When enabled, the public storefront shows a maintenance notice while administrative operations remain accessible to authenticated staff.
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save All Platform Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
