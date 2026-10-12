"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  isHero?: boolean;
}

export function SearchBar({
  initialQuery = "",
  onSearch,
  isHero = false,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    } else {
      const trimmed = query.trim();
      if (trimmed) {
        router.push(`/explore?q=${encodeURIComponent(trimmed)}`);
      } else {
        router.push("/explore");
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative w-full ${isHero ? "max-w-2xl mx-auto" : "max-w-xl"}`}
      role="search"
    >
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (onSearch) {
              onSearch(e.target.value);
            }
          }}
          placeholder="Search exams, subjects, classes, or skills..."
          className="w-full h-12 pl-10 pr-24 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
        <div className="absolute right-1.5">
          <Button
            type="submit"
            size="sm"
            variant="primary"
            className="h-9 px-4 font-medium"
          >
            Search
          </Button>
        </div>
      </div>
    </form>
  );
}
