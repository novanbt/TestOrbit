"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Clock, MessageSquare, Send, CheckCircle2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to homepage
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700">
            Help & Academic Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How can our academic team help you?
          </h1>
          <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
            Have questions regarding syllabus alignment, test series enrollments, or technical access? We are here to assist your learning journey.
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Direct Email</h3>
            <p className="text-xs text-slate-500">Reach our dedicated support inbox</p>
            <p className="text-sm font-medium text-indigo-600">support@testorbit.in</p>
          </div>

          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Response Window</h3>
            <p className="text-xs text-slate-500">Typically within 24 business hours</p>
            <p className="text-sm font-medium text-slate-800">Mon – Sat • 9 AM – 7 PM IST</p>
          </div>

          <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Advisory Inquiries</h3>
            <p className="text-xs text-slate-500">Get guidance on which series fits you</p>
            <p className="text-sm font-medium text-slate-800">advisors@testorbit.in</p>
          </div>
        </div>

        {/* Contact Form & FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <div className="p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Send Us a Message</h2>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-emerald-900">Message Received!</h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Thank you for reaching out. A TestOrbit academic advisor will review your query and reply to <strong>{email}</strong> shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya Patel"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ananya@example.com"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Question on JEE Main Test Series coverage"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe your question or issue in detail..."
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>

                <Button type="submit" variant="primary" size="md" className="w-full gap-2">
                  <Send className="w-4 h-4" />
                  Submit Inquiry
                </Button>
              </form>
            )}
          </div>

          {/* FAQ sidebar */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-1.5">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                How do I access mock tests after enrolling?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed pl-6">
                Enrolled tests immediately appear in your personal Student Dashboard under the &ldquo;My Tests&rdquo; and &ldquo;My Test Series&rdquo; tabs.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-1.5">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                Are test questions aligned with current year patterns?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed pl-6">
                Yes. Our academic curriculum team continually reviews official examination syllabi to ensure updated marking schemes and sectional formats.
              </p>
            </div>

            <div className="p-5 bg-white border border-slate-200/90 rounded-xl shadow-xs space-y-1.5">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                How do refund requests work?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed pl-6">
                Review our Refund Policy page. We offer a 48-hour eligibility window before you have completed more than 10% of test questions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
