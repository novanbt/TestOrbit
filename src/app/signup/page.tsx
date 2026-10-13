"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, User, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import EmailVerificationScreen from "@/components/auth/EmailVerificationScreen";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const targetDestination = redirectParam || "/dashboard";

  const { signUp, signInWithGoogle, user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);

  // If already logged in, redirect directly to targetDestination
  React.useEffect(() => {
    if (user) {
      router.push(targetDestination);
    }
  }, [user, router, targetDestination]);

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        if (res.error) {
          setErrorMessage(res.error);
        }
      } else {
        router.push(targetDestination);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred during Google sign up."
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMessage(null);

    // Validation
    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
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
      const res = await signUp(email, password, name.trim());
      if (!res.success) {
        setErrorMessage(res.error || "Failed to create account. Please try again.");
      } else if (res.requiresVerification) {
        setVerificationEmail(res.email || email);
        router.push(`/verify-email?email=${encodeURIComponent(res.email || email)}`);
      } else {
        router.push(targetDestination);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected sign up error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (verificationEmail) {
    return <EmailVerificationScreen email={verificationEmail} />;
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
            Create your student account
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Sign up to unlock your student dashboard, save mock tests, and track progress
          </p>
        </div>

        {/* Auth Form Card */}
        <div className="mt-6 bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-xl sm:px-10">
          {/* Mock Examination Required Banner */}
          {redirectParam && (
            <div
              className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-2.5 text-xs text-indigo-900 mb-4 font-medium"
              role="alert"
            >
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span>Create your account to start your mock examination and record your scorecard.</span>
            </div>
          )}
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

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-2xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isGoogleLoading ? "Connecting with Google..." : "Continue with Google"}</span>
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or register with email</span>
            </div>
          </div>

          <form
            className="space-y-4"
            action="#"
            method="POST"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
          >


            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Minimum 6 characters
              </p>
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
                {redirectParam ? "Create Account & Start Examination" : "Create Account & Go to Dashboard"}
              </Button>
            </div>

            {/* Toggle to Sign In */}
            <div className="text-center pt-2">
              <Link
                href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : "/login"}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <React.Suspense fallback={<div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-slate-50/60" />}>
      <SignUpForm />
    </React.Suspense>
  );
}
