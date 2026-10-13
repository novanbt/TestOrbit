import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TestOrbit — Online Mock Test Marketplace",
  description:
    "Discover curriculum-aligned mock tests and test series across school education, competitive exams, university degrees, and professional skills.",
  keywords: [
    "mock tests",
    "JEE Main",
    "NEET",
    "SSC CGL",
    "Class 10 CBSE",
    "Python programming mock test",
    "competitive exams",
    "aptitude test",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full scroll-smooth antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
        <AuthProvider>
          <Suspense fallback={<div className="h-16 border-b border-slate-200 bg-white" />}>
            <Header />
          </Suspense>
          <main className="flex-1 flex flex-col">{children}</main>
          <Suspense fallback={null}>
            <Footer />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
