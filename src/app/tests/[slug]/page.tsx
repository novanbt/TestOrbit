import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { connection } from "next/server";
import { fetchCanonicalTestBySlug } from "@/data/tests";
import TestDetailsClient from "./TestDetailsClient";

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const test = await fetchCanonicalTestBySlug(slug);

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
  await connection();
  const { slug } = await params;
  const test = await fetchCanonicalTestBySlug(slug);

  if (!test) {
    notFound();
  }

  return <TestDetailsClient initialTest={test} />;
}
