"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, AlertCircle, CheckCircle2, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";
import EmailVerificationScreen from "@/components/auth/EmailVerificationScreen";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // If already logged in, can directly view dashboard
  React.useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!email || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn(email, password);
      if (!res.success) {
        if (res.unverifiedEmail) {
          setUnverifiedEmail(res.unverifiedEmail);
          router.push(`/verify-email?email=${encodeURIComponent(res.unverifiedEmail)}`);
          return;
        }
        setErrorMessage(res.error || "Failed to sign in. Please check credentials.");
      } else {
        setSuccessMessage("Authentication successful! Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 600);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected authentication error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (unverifiedEmail) {
    return <EmailVerificationScreen email={unverifiedEmail} />;
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50/60">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to homepage
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
            Sign in to TestOrbit
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Access your saved mock tests and preparation history
          </p>
        </div>

        {/* Firebase Status Banner */}
        <div className="mt-6">
          {isFirebaseConfigured ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Firebase Auth Connected:</strong> Live user session management is active.
              </span>
            </div>
          ) : (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-start gap-3 text-xs text-slate-700">
              <KeyRound className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-900 mb-0.5">
                  <span>Student Sign In</span>
                  <Badge variant="success" size="sm">
                    Instant Access
                  </Badge>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Sign in with any student email to unlock your dashboard preview.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-xl sm:px-10">
          <form
            className="space-y-4"
            action="#"
            method="POST"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
          >
            {/* Error & Success Messages */}
            {errorMessage && (
              <div
                className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-xs text-rose-700"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-2 text-xs text-emerald-800"
                role="alert"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

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
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full font-medium"
              >
                Sign In
              </Button>
            </div>

            {/* Link to Sign Up */}
            <div className="text-center pt-2">
              <Link
                href="/signup"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                Don&apos;t have an account? Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
