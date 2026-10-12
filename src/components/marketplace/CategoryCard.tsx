import React from "react";
import Link from "next/link";
import {
  GraduationCap,
  Target,
  Building2,
  Code2,
  BrainCircuit,
  Briefcase,
  Layers,
  ArrowRight,
  Languages,
} from "lucide-react";
import { Category } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap,
  Target,
  Building2,
  Code2,
  BrainCircuit,
  Briefcase,
  Languages,
};

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const IconComponent = iconMap[category.iconName] || Layers;

  return (
    <Link
      href={`/explore?category=${category.slug}`}
      className="group relative flex flex-col p-5 bg-white rounded-xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white">
          <IconComponent className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-medium text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
          {category.testCount} tests
          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>

      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1.5">
        {category.name}
      </h3>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
        {category.description}
      </p>
    </Link>
  );
}
