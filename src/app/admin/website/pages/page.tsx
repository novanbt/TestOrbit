"use client";

import React, { useState, useEffect } from "react";
import { FileQuestion, Plus, Trash2, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSiteCMSConfig } from "@/lib/admin/adminDataService";
import { saveSiteCMSAction } from "@/app/actions/adminStudioActions";
import { SiteCMSConfig } from "@/types/admin";

export default function StaticPagesCMSPage() {
  const [config, setConfig] = useState<SiteCMSConfig | null>(null);
  const [faqs, setFaqs] = useState<Array<{ id?: string; question: string; answer: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    getSiteCMSConfig().then((data) => {
      setConfig(data);
      setFaqs(data.faqs || []);
    });
  }, []);

  const handleAddFaq = () => {
    setFaqs([
      ...faqs,
      {
        id: "faq-" + Date.now().toString(36),
        question: "New Frequently Asked Question",
        answer: "Detailed informational response for learners.",
      },
    ]);
  };

  const handleRemoveFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  const handleUpdateFaq = (idx: number, field: "question" | "answer", val: string) => {
    setFaqs((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const updated: SiteCMSConfig = { ...config, faqs };
    const res = await saveSiteCMSAction(updated);
    if (res.success) {
      setFeedback("Frequently Asked Questions updated on live site!");
      setTimeout(() => setFeedback(null), 3000);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions & Content Pages
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student support Q&A content published on the homepage and help sections.
          </p>
        </div>

        <Button variant="primary" size="sm" disabled={saving} onClick={handleSave} className="text-xs">
          <Save className="w-3.5 h-3.5 mr-1" />
          <span>{saving ? "Saving..." : "Save FAQs"}</span>
        </Button>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">✕</button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            FAQ Items ({faqs.length})
          </span>
          <Button variant="outline" size="sm" onClick={handleAddFaq} className="text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Add FAQ</span>
          </Button>
        </div>

        {faqs.map((faq, idx) => (
          <div key={faq.id || idx} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700">FAQ #{idx + 1}</span>
              <button
                type="button"
                onClick={() => handleRemoveFaq(idx)}
                className="text-slate-400 hover:text-rose-600 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700">Question</label>
              <input
                type="text"
                value={faq.question}
                onChange={(e) => handleUpdateFaq(idx, "question", e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>

            <div className="space-y-1 text-xs">
              <label className="font-semibold text-slate-700">Answer</label>
              <textarea
                rows={2}
                value={faq.answer}
                onChange={(e) => handleUpdateFaq(idx, "answer", e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
