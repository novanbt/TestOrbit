"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, AlertCircle, CheckCircle, Search } from "lucide-react";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { getAllOrders } from "@/lib/admin/adminDataService";
import { CommerceOrder } from "@/types/admin";

export default function RefundsAdminPage() {
  const [refunds, setRefunds] = useState<CommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllOrders().then((all) => {
      setRefunds(all.filter((o) => o.status === "refunded"));
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Refund Claims & Reversals ({refunds.length})
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          History of all refunded orders, audit rationales, and reversed entitlements.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading refunds...</p>
          </div>
        ) : refunds.length === 0 ? (
          <StudioEmptyState
            icon={RotateCcw}
            title="No refund transactions processed"
            description="When an administrator processes a refund from the Orders workspace, it will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Learner</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Refunded Amount</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Refunded On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {refunds.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.id}</td>
                    <td className="py-3 px-4">{r.userName || r.userEmail}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.itemTitle}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">
                      ₹{(r.amountInPaise / 100).toFixed(0)}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.refundReason || "Requested by student"}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {r.refundedAt ? new Date(r.refundedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
