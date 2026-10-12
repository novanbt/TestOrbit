"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { MailCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmailVerificationScreenProps {
  email: string;
}

export default function EmailVerificationScreen({ email }: EmailVerificationScreenProps) {
  const displayEmail = email || "your email";

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
        </div>

        {/* Verification Card */}
        <div className="mt-4 bg-white py-8 px-6 shadow-xs border border-slate-200 rounded-xl sm:px-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
            <MailCheck className="w-7 h-7 text-indigo-600" />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2">
            Verify your email address
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            We have sent you a verification email to{" "}
            <span className="font-semibold text-slate-900 break-all">{displayEmail}</span>.
            {" "}Please verify it and log in.
          </p>

          {/* Login Button */}
          <div className="space-y-3">
            <Link href="/login" className="block w-full">
              <Button
                variant="primary"
                size="md"
                className="w-full font-medium flex items-center justify-center gap-2"
              >
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <p className="text-[11px] text-slate-400">
              Didn&apos;t receive it? Please check your Spam / Junk folder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
