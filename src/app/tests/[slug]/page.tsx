import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getAllTests, getCanonicalTestBySlug } from "@/data/tests";
import TestDetailsClient from "./TestDetailsClient";

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
  const test = getCanonicalTestBySlug(slug);

  if (!test) {
    return {
      title: "Test Not Found — TestOrbit",
    };
  }

  return {
    title: `${test.title} — TestOrbit`,
    description: test.description,
  };
}

export default async function TestDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const test = getCanonicalTestBySlug(slug);

  if (!test) {
    notFound();
  }

  return <TestDetailsClient test={test} />;
}

