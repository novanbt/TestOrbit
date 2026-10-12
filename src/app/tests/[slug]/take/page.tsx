import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTestBySlug, getAllTests } from "@/data/tests";
import { getQuestionsForTest } from "@/data/question-bank";
import { TestRunner } from "@/components/test-runner/TestRunner";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const tests = getAllTests();
  return tests.map((t) => ({
    slug: t.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const test = getTestBySlug(slug);

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

export default async function TakeTestPage({ params }: PageProps) {
  const { slug } = await params;
  const test = getTestBySlug(slug);

  if (!test) {
    notFound();
  }

  const questions = getQuestionsForTest(test);

  return <TestRunner test={test} questions={questions} />;
}
