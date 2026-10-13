"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Search, Download, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StudioBadge, StudioEmptyState } from "@/components/admin/StudioUI";
import { getAllOrders } from "@/lib/admin/adminDataService";
import { CommerceOrder } from "@/types/admin";

export default function TransactionsAdminPage() {
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Financial Ledger & Transactions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable settlement records, payment gateway IDs, and verified audit logs.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading ledger...</p>
          </div>
        ) : orders.length === 0 ? (
          <StudioEmptyState
            icon={Receipt}
            title="No settlement transactions recorded"
            description="All processed learner payments will show in this financial ledger with gateway IDs."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {ord.paymentRef || `txn_${ord.id.slice(-6)}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{ord.id}</td>
                    <td className="py-3 px-4">{new Date(ord.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      ₹{(ord.amountInPaise / 100).toFixed(0)}
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500">
                      {ord.paymentProvider}
                    </td>
                    <td className="py-3 px-4">
                      <StudioBadge variant={ord.status === "completed" ? "completed" : "refunded"} size="sm">
                        {ord.status}
                      </StudioBadge>
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
