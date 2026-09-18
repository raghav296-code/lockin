"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Brain,
  Award,
  CalendarCheck,
  FolderGit2,
  Tag,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { globalSearchAction } from "@/actions/search";
import type { GroupedSearchResults, SearchEntityType, SearchResultItem } from "./search-types";

interface SearchResultsViewProps {
  initialQuery: string;
  initialResults: GroupedSearchResults;
}

export function SearchResultsView({
  initialQuery,
  initialResults,
}: SearchResultsViewProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<GroupedSearchResults>(initialResults);
  const [activeFilter, setActiveFilter] = React.useState<"all" | SearchEntityType>("all");
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = async (newQuery: string) => {
    setQuery(newQuery);
    if (!newQuery.trim()) {
      setResults({
        resources: [],
        concepts: [],
        skills: [],
        projects: [],
        tasks: [],
        categories: [],
        total: 0,
      });
      return;
    }

    setIsSearching(true);
    const res = await globalSearchAction(newQuery);
    if (res.ok && res.data) {
      setResults(res.data);
    }
    setIsSearching(false);
  };

  const allResultsList: SearchResultItem[] = React.useMemo(() => {
    return [
      ...results.resources,
      ...results.concepts,
      ...results.skills,
      ...results.projects,
      ...results.tasks,
      ...results.categories,
    ];
  }, [results]);

  const displayedResults = React.useMemo(() => {
    if (activeFilter === "all") return allResultsList;
    return allResultsList.filter((item) => item.type === activeFilter);
  }, [allResultsList, activeFilter]);

  const getEntityIcon = (type: string, iconUrl?: string | null) => {
    if (iconUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="Logo" className="w-4 h-4 object-contain" />
      );
    }
    switch (type) {
      case "resource":
        return <BookOpen className="w-4 h-4 text-amber-500" />;
      case "concept":
        return <Brain className="w-4 h-4 text-purple" />;
      case "skill":
        return <Award className="w-4 h-4 text-accent" />;
      case "project":
        return <FolderGit2 className="w-4 h-4 text-rose-500" />;
      case "task":
        return <CalendarCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Tag className="w-4 h-4 text-secondary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & Filter Pills */}
      <div className="space-y-3">
        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <Input
            type="text"
            placeholder="Search all resources, concepts, skills, tasks..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-11 text-[15px] rounded-[14px]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: `All (${results.total})` },
            { key: "concept", label: `Concepts (${results.concepts.length})` },
            { key: "resource", label: `Resources (${results.resources.length})` },
            { key: "skill", label: `Skills (${results.skills.length})` },
            { key: "project", label: `Projects (${results.projects.length})` },
            { key: "task", label: `Tasks (${results.tasks.length})` },
          ].map((pill) => (
            <button
              key={pill.key}
              type="button"
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all shrink-0 ${activeFilter === pill.key
                  ? "bg-accent text-white font-semibold shadow-xs"
                  : "bg-surface border border-border text-secondary hover:text-foreground hover:bg-surface-secondary"
                }`}
              onClick={() => setActiveFilter(pill.key as typeof activeFilter)}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      {displayedResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {displayedResults.map((item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.href}
              className="group rounded-[16px] border border-border/80 bg-surface p-4 flex items-center justify-between gap-3 transition-all duration-200 hover:border-border-hover hover:shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-surface-secondary border border-border/70 flex items-center justify-center shrink-0 p-2 group-hover:scale-105 transition-transform">
                  {getEntityIcon(item.type, item.iconUrl)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14.5px] font-semibold text-foreground tracking-tight truncate group-hover:text-accent transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-secondary text-muted">
                      {item.type}
                    </span>
                  </div>

                  {item.subtitle && (
                    <span className="text-[12.5px] text-secondary truncate block mt-0.5">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.badge && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-secondary text-secondary border border-border/70 capitalize">
                    {item.badge}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] border border-border/80 bg-surface p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-muted mx-auto" />
          <h3 className="text-[16px] font-semibold text-foreground">
            {query ? "No results found" : "Enter a search term"}
          </h3>
          <p className="text-[13px] text-secondary max-w-sm mx-auto">
            {query
              ? "No graph entities matched your query. Try searching with different keywords."
              : "Search across concepts, resources, skills, projects, and calendar tasks."}
          </p>
        </div>
      )}
    </div>
  );
}
