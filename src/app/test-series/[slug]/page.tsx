import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getCanonicalBundleBySlug, getAllCanonicalPublishedBundles } from "@/lib/data/bundleService";
import SeriesDetailsClient from "@/app/series/[slug]/SeriesDetailsClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const bundles = getAllCanonicalPublishedBundles();
  return bundles.map((b) => ({
    slug: b.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = getCanonicalBundleBySlug(slug);

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

export default async function TestSeriesDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const series = getCanonicalBundleBySlug(slug);

  if (!series) {
    notFound();
  }

  return <SeriesDetailsClient series={series} />;
}
