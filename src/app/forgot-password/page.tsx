"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isLoading) return;

    setErrorMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await sendPasswordReset(trimmed);
      if (!res.success) {
        setErrorMessage(res.error || "Unable to process password reset request. Please try again.");
      } else {
        setSubmittedEmail(trimmed);
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/60">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>

        {/* Brand Logo & Heading */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-3">
            <Image
              src="/logo-nav.png"
              alt="TestOrbit"
              width={160}
              height={38}
              className="h-10 w-auto mx-auto object-contain"
              priority
            />
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Forgot your password?
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Enter your registered email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <div className="mt-5 bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-xl sm:px-10">
          {/* Success State */}
          {isSuccess ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>

              <h2 className="text-base font-semibold text-slate-900 mb-2">
                Check your inbox
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                If an account is associated with{" "}
                <span className="font-semibold text-slate-900 break-all">{submittedEmail}</span>,
                you will receive an email with instructions to reset your password shortly.
              </p>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-left mb-6">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  • The reset link is valid for 1 hour.
                  <br />
                  • If you don&apos;t see the email, check your spam or junk folder.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full py-2.5 px-4 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs"
                >
                  Return to sign in
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setErrorMessage(null);
                  }}
                  className="w-full text-xs text-slate-500 hover:text-slate-800 font-medium py-1.5 transition-colors cursor-pointer"
                >
                  Try another email address
                </button>
              </div>
            </div>
          ) : (
            /* Reset Request Form */
            <>
              {/* Error Message */}
              {errorMessage && (
                <div
                  className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700 mb-4"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
              >
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      disabled={isLoading}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="w-full font-medium"
                  >
                    Send Reset Link
                  </Button>
                </div>

                {/* Link to Sign In */}
                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Return to sign in
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
