"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Info, CheckCircle2, ShieldCheck, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "./Button";
import { formatPriceInRupees } from "@/lib/utils";

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  priceInPaise: number;
  slug?: string;
  itemType?: "test" | "series";
}

export function EnrollmentModal({
  isOpen,
  onClose,
  title,
  priceInPaise,
  slug,
  itemType = "test",
}: EnrollmentModalProps) {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 400);
  };

  const handleModalClose = () => {
    setSubmitted(false);
    setEmail("");
    setCandidateName("");
    onClose();
  };

  const handleStartExam = () => {
    handleModalClose();
    if (slug) {
      router.push(`/tests/${slug}/take`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={handleModalClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-600 block mb-0.5">
              Candidate Enrollment
            </span>
            <h3 id="modal-headline" className="text-base font-bold text-slate-900 leading-snug">
              {title}
            </h3>
          </div>
        </div>

        <div className="space-y-3 text-sm text-slate-600 border-t border-b border-slate-100 py-3.5 my-3">
          <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">Access Status:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
              Full Simulation Unlocked
            </span>
          </div>

          <div className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p>
              Includes timed examination window, negative marking calibration, question palette, and verified step-by-step solutions.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-2 space-y-3">
            <div className="inline-flex p-2.5 bg-emerald-50 text-emerald-600 rounded-full">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Enrollment Verified!
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Candidate account <strong>{email}</strong> is ready for examination.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              {slug && itemType === "test" ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartExam}
                  className="w-full gap-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  Enter Examination Window
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                onClick={handleModalClose}
                className="w-full text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                htmlFor="candidate-name"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Candidate Name
              </label>
              <input
                id="candidate-name"
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="candidate-email"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="candidate-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your student email"
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                className="flex-1 text-xs"
                onClick={handleModalClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                className="flex-1 text-xs font-semibold"
              >
                Confirm & Start
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
