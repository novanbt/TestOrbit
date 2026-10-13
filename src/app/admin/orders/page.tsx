"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { getAllOrders } from "@/lib/admin/adminDataService";
import { processRefundAction } from "@/app/actions/adminStudioActions";
import { CommerceOrder } from "@/types/admin";

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [refundModalOrder, setRefundModalOrder] = useState<CommerceOrder | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await getAllOrders();
      setOrders(list);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder) return;

    setProcessing(true);
    const res = await processRefundAction(refundModalOrder.id, refundReason || "Requested by customer");
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === refundModalOrder.id ? { ...o, status: "refunded", refundReason } : o
        )
      );
      setFeedback(`Processed refund for order ${refundModalOrder.id}.`);
      setRefundModalOrder(null);
      setTimeout(() => setFeedback(null), 3000);
    }
    setProcessing(false);
  };

  const filteredOrders = orders.filter((o) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!o.id.toLowerCase().includes(q) && !o.itemTitle.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Learner Purchases & Orders ({orders.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified transaction records, entitlement grants, and refund operations.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID, product title..."
            className="w-full h-9 pl-9 pr-3 rounded-lg text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <StudioEmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="When learners purchase mock tests or series, orders will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Order ID & Date</th>
                  <th className="py-3.5 px-4">Learner</th>
                  <th className="py-3.5 px-4">Purchased Product</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 block">{ord.id}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 block">{ord.userName || "Learner"}</span>
                      <span className="text-[11px] text-slate-400">{ord.userEmail || "—"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 block">{ord.itemTitle}</span>
                      <span className="text-[10px] text-indigo-600 uppercase font-semibold">{ord.itemType}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                      ₹{(ord.amountInPaise / 100).toFixed(0)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StudioBadge variant={ord.status === "completed" ? "completed" : "refunded"} size="sm">
                        {ord.status}
                      </StudioBadge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {ord.status === "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRefundModalOrder(ord)}
                          className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          <span>Refund</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Process Order Refund
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Initiate a verified refund for Order <strong className="text-slate-900">{refundModalOrder.id}</strong> (₹{(refundModalOrder.amountInPaise / 100).toFixed(0)}).
            </p>

            <form onSubmit={handleRefund} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reason for Refund</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Syllabus calibration adjustment / User request"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setRefundModalOrder(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={processing} className="bg-rose-600 hover:bg-rose-700">
                  {processing ? "Processing..." : "Confirm Refund"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
