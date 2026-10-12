"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EmailVerificationScreen from "@/components/auth/EmailVerificationScreen";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return <EmailVerificationScreen email={email} />;
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
