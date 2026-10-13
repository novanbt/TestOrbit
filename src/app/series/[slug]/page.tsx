import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { connection } from "next/server";
import { fetchCanonicalBundleBySlug } from "@/lib/data/bundleService";
import SeriesDetailsClient from "./SeriesDetailsClient";

export const instant = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await fetchCanonicalBundleBySlug(slug);

  if (!series) {
    return {
      title: "Test Series Bundle Not Found — TestOrbit",
    };
  }

  return {
    title: `${series.title} — TestOrbit`,
    description: series.shortDescription || series.description,
  };
}

export default async function SeriesDetailsPage({ params }: PageProps) {
  await connection();
  const { slug } = await params;
  const series = await fetchCanonicalBundleBySlug(slug);

  if (!series) {
    notFound();
  }

  return <SeriesDetailsClient series={series} />;
}
