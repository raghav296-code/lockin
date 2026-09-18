import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { globalSearchAction } from "@/actions/search";
import { SearchResultsView } from "@/components/search/search-results-view";
import { Search } from "lucide-react";
import * as React from "react";

export const metadata: Metadata = {
  title: "Global Search — Lock In",
  description: "Search across the unified learning graph, resources, concepts, and skills.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

async function SearchContent({ searchParams }: SearchPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { q } = await searchParams;
  const initialQuery = q || "";
  const searchRes = await globalSearchAction(initialQuery);

  const initialResults =
    searchRes.ok && searchRes.data
      ? searchRes.data
      : {
        resources: [],
        concepts: [],
        skills: [],
        projects: [],
        tasks: [],
        categories: [],
        total: 0,
      };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-accent-tint text-accent">
            <Search className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Search Learning Graph
          </h1>
        </div>
        <p className="text-[13.5px] text-secondary max-w-2xl">
          Unified query engine across concepts, research papers, study tasks, and competencies.
        </p>
      </div>

      <SearchResultsView
        initialQuery={initialQuery}
        initialResults={initialResults}
      />
    </div>
  );
}

export default function SearchPage(props: SearchPageProps) {
  return (
    <React.Suspense fallback={<div className="p-8 text-secondary">Loading search results...</div>}>
      <SearchContent {...props} />
    </React.Suspense>
  );
}
