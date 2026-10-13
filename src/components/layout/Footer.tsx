"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on active CBT examination window
  if (pathname?.endsWith("/take") || pathname?.includes("/take/")) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50/50 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200/80">
          <div>
            <Link href="/" className="inline-block transition-opacity hover:opacity-90">
              <Image
                src="/logo-nav.png"
                alt="TestOrbit"
                width={140}
                height={39}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="mt-2 text-xs text-slate-500 max-w-sm">
              Curriculum-aligned mock tests and standardized practice simulations for schools, colleges, and competitive exams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
            <Link
              href="/about"
              className="hover:text-slate-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:text-slate-900 transition-colors"
            >
              Help / Contact
            </Link>
            <Link
              href="/terms"
              className="hover:text-slate-900 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-slate-900 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/refund"
              className="hover:text-slate-900 transition-colors"
            >
              Refund Policy
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <p>© 2026 TestOrbit. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Curriculum-Aligned Assessment Platform</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

