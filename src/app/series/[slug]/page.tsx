import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getTestSeriesBySlug, getAllTestSeries } from "@/data/test-series";
import SeriesDetailsClient from "./SeriesDetailsClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const series = getAllTestSeries();
  return series.map((s) => ({
    slug: s.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = getTestSeriesBySlug(slug);

  if (!series) {
    return {
      title: "Test Series Not Found — TestOrbit",
    };
  }

  return {
    title: `${series.title} — TestOrbit`,
    description: series.description,
  };
}

export default async function SeriesDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  const series = getTestSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  return <SeriesDetailsClient series={series} />;
}
