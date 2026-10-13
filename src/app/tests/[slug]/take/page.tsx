import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { connection } from "next/server";
import { MockTest } from "@/types";
import {
  getCanonicalTestBySlug,
  fetchCanonicalTestBySlug,
  fetchCanonicalQuestionsForTest,
} from "@/data/tests";
import { TestRunner } from "@/components/test-runner/TestRunner";

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let test = getCanonicalTestBySlug(slug);
  if (!test) {
    test = await fetchCanonicalTestBySlug(slug);
  }

  if (!test) {
    return {
      title: "Test Not Found — TestOrbit",
    };
  }

  return {
    title: `Live Examination — ${test.title} | TestOrbit`,
    description: `Official mock examination simulator for ${test.title}. Timed questions, negative marking, and instant evaluation.`,
  };
}

async function ExamLoader({ slug, test }: { slug: string; test: MockTest }) {
  const questions = await fetchCanonicalQuestionsForTest(slug, test);
  return <TestRunner test={test} questions={questions} />;
}

export default async function TakeTestPage({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  let test = getCanonicalTestBySlug(slug);
  if (!test) {
    test = await fetchCanonicalTestBySlug(slug);
  }

  if (!test) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-slate-400">Loading examination environment...</p>
        </div>
      }
    >
      <ExamLoader slug={slug} test={test} />
    </Suspense>
  );
}
