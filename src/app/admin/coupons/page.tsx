"use client";

import React, { useState, useEffect } from "react";
import { Percent, Plus, Tag, Calendar, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { getAllCoupons } from "@/lib/admin/adminDataService";
import { saveCouponAction, deleteCouponAction } from "@/app/actions/adminStudioActions";
import { Coupon } from "@/types/admin";

export default function CouponsAdminPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState(20); // 20%
  const [minOrder, setMinOrder] = useState(199);
  const [validDays, setValidDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const list = await getAllCoupons();
      setCoupons(list);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSaving(true);
    const expiry = new Date(Date.now() + validDays * 86400000).toISOString();
    const couponToSave: Coupon = {
      id: "cpn_" + Date.now().toString(36),
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      minOrderInPaise: minOrder * 100,
      validUntil: expiry,
      usageCount: 0,
      active: true,
      createdAt: new Date().toISOString(),
    };

    const res = await saveCouponAction(couponToSave);
    if (res.success) {
      setCoupons((prev) => [couponToSave, ...prev]);
      setFeedback(`Coupon "${couponToSave.code}" created successfully.`);
      setModalOpen(false);
      setTimeout(() => setFeedback(null), 3000);
    }
    setSaving(false);
  };

  const handleDeleteCoupon = async (c: Coupon) => {
    if (!window.confirm(`Delete coupon "${c.code}"?`)) return;
    const res = await deleteCouponAction(c.id);
    if (res.success) {
      setCoupons((prev) => prev.filter((item) => item.id !== c.id));
      setFeedback(`Coupon "${c.code}" deleted successfully.`);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Coupons & Promotional Discounts ({coupons.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create discount vouchers, scholarship promo codes, and minimum cart rules.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>New Promo Code</span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-20 text-center space-y-3 bg-white border border-slate-200/80 rounded-2xl">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading discount vouchers...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="col-span-full">
            <StudioEmptyState
              icon={Percent}
              title="No active coupons configured"
              description="Create a promotional discount code for students to apply during checkout."
              action={
                <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="text-xs">
                  Create First Promo Code
                </Button>
              }
            />
          </div>
        ) : (
          coupons.map((c) => (
            <div
              key={c.id}
              className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200/60">
                    {c.code}
                  </span>
                  <StudioBadge variant={c.active ? "completed" : "draft"} size="sm">
                    {c.active ? "Active" : "Disabled"}
                  </StudioBadge>
                </div>

                <div className="text-base font-bold text-slate-900 pt-1">
                  {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                </div>

                <p className="text-xs text-slate-500">
                  Min order: ₹{((c.minOrderInPaise || 0) / 100).toFixed(0)} • Used: {c.usageCount} times
                </p>

                <p className="text-[11px] text-slate-400">
                  Valid until {new Date(c.validUntil).toLocaleDateString()}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleDeleteCoupon(c)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete coupon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Create Promotional Coupon
            </h3>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., TEST2026, SCHOLAR20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full h-9 px-3 font-mono font-bold uppercase bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                    className="w-full h-9 px-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (₹)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Discount Value</label>
                  <input
                    type="number"
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={minOrder}
                    onChange={(e) => setMinOrder(parseInt(e.target.value) || 0)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                    className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={saving}>
                  {saving ? "Creating..." : "Save Coupon"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
