"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode") || searchParams.get("code") || "";

  const { verifyResetCode, confirmReset } = useAuth();

  const [email, setEmail] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Verify the reset code when the page loads
  useEffect(() => {
    let isMounted = true;

    async function checkCode() {
      if (!oobCode) {
        setIsVerifyingCode(false);
        setCodeError("No password reset code was provided in this link. Please request a new one.");
        return;
      }

      setIsVerifyingCode(true);
      setCodeError(null);

      try {
        const res = await verifyResetCode(oobCode);
        if (!isMounted) return;

        if (res.success && res.email) {
          setEmail(res.email);
        } else {
          setCodeError(res.error || "This password reset link is invalid or has expired.");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setCodeError(
          err instanceof Error ? err.message : "Unable to verify this password reset link."
        );
      } finally {
        if (isMounted) {
          setIsVerifyingCode(false);
        }
      }
    }

    checkCode();

    return () => {
      isMounted = false;
    };
  }, [oobCode, verifyResetCode]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isSubmitting) return;

    setErrorMessage(null);

    // Validation
    if (!password) {
      setErrorMessage("Please enter your new password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (!confirmPassword) {
      setErrorMessage("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify and retype your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await confirmReset(oobCode, password);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to reset password. Please try again or request a new link.");
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred while resetting your password."
      );
    } finally {
      setIsSubmitting(false);
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

        {/* Brand Logo */}
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
            Reset your password
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {email ? (
              <>
                Enter a new password for{" "}
                <span className="font-semibold text-slate-700 break-all">{email}</span>
              </>
            ) : (
              "Choose a strong new password to protect your account"
            )}
          </p>
        </div>

        <div className="mt-5 bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-xl sm:px-10">
          {/* State 1: Verifying Reset Code */}
          {isVerifyingCode ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Verifying your reset link...</p>
            </div>
          ) : /* State 2: Code Invalid / Expired */
          codeError ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>

              <h2 className="text-base font-semibold text-slate-900 mb-2">
                Invalid or Expired Link
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                {codeError}
              </p>

              <div className="space-y-3">
                <Link
                  href="/forgot-password"
                  className="block w-full py-2.5 px-4 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs"
                >
                  Request a new reset link
                </Link>

                <Link
                  href="/login"
                  className="block text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Return to sign in
                </Link>
              </div>
            </div>
          ) : /* State 3: Password Reset Successfully */
          isSuccess ? (
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>

              <h2 className="text-base font-semibold text-slate-900 mb-2">
                Password reset complete!
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>

              <Link
                href="/login"
                className="block w-full py-2.5 px-4 text-center text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg transition-colors shadow-xs"
              >
                Sign In to TestOrbit
              </Link>
            </div>
          ) : (
            /* State 4: Reset Password Form (Enter Twice) */
            <>
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
                {/* New Password Field */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="new-password"
                      name="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      disabled={isSubmitting}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Must be at least 6 characters.
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      disabled={isSubmitting}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-9 pr-10 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Match Indicator */}
                {password && confirmPassword && (
                  <div className="flex items-center gap-1.5 text-xs pt-1">
                    {password === confirmPassword ? (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Passwords do not match
                      </span>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    disabled={isSubmitting || (password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword)}
                    className="w-full font-medium"
                  >
                    Save New Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
