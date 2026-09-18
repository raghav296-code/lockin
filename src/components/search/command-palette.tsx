"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  BookOpen,
  Brain,
  Award,
  CalendarCheck,
  FolderGit2,
  Tag,
  ArrowRight,
  X,
  Sparkles,
  BarChart3,
  Loader2,
  CornerDownLeft,
} from "lucide-react";
import { globalSearchAction } from "@/actions/search";
import type { GroupedSearchResults, SearchResultItem } from "./search-types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GroupedSearchResults | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults(null);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  React.useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const res = await globalSearchAction(query);
      if (res.ok && res.data) {
        setResults(res.data);
      }
      setIsSearching(false);
      setSelectedIndex(0);
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Flatten active items for keyboard navigation
  const flatItems: (SearchResultItem | { isAction: true; title: string; href: string; icon: React.ElementType })[] =
    React.useMemo(() => {
      if (results && results.total > 0) {
        return [
          ...results.resources,
          ...results.concepts,
          ...results.skills,
          ...results.projects,
          ...results.tasks,
          ...results.categories,
        ];
      }

      // Default quick actions when query is empty
      return [
        { isAction: true, title: "Study Planner & Apple Calendar", href: "/planner", icon: CalendarCheck },
        { isAction: true, title: "Knowledge Graph & Concept Studio", href: "/concepts", icon: Brain },
        { isAction: true, title: "Resource Vault & Reading Backlog", href: "/resources", icon: BookOpen },
        { isAction: true, title: "Skills Matrix & Project Demos", href: "/skills", icon: Award },
        { isAction: true, title: "Analytics Studio & Activity Heatmap", href: "/analytics", icon: BarChart3 },
      ];
    }, [results]);

  // Keyboard navigation listener (ArrowUp, ArrowDown, Enter, Escape)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (flatItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % (flatItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = flatItems[selectedIndex];
        if (selected) {
          router.push(selected.href);
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flatItems, selectedIndex, router, onClose]);

  if (!isOpen) return null;

  const getEntityIcon = (type: string, iconUrl?: string | null) => {
    if (iconUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="Logo" className="w-3.5 h-3.5 object-contain" />
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      {/* Apple Spotlight Modal Container */}
      <div className="relative w-full max-w-2xl rounded-[22px] border border-border/80 bg-surface/95 backdrop-blur-2xl shadow-2xl overflow-hidden z-10 animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 h-14 border-b border-border/60 shrink-0">
          <Search className="w-5 h-5 text-muted mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search concepts, resources, skills, projects, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-[16px] text-foreground placeholder:text-muted focus:outline-none"
          />
          {isSearching && (
            <Loader2 className="w-4 h-4 text-secondary animate-spin mr-2 shrink-0" />
          )}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-md text-secondary hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="ml-2 px-2 py-0.5 text-[11px] font-semibold text-muted bg-surface-secondary rounded-md border border-border/80 hidden sm:inline-block">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-border/30">
          {results && results.total > 0 ? (
            <div className="space-y-1">
              {flatItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const searchItem = item as SearchResultItem;
                return (
                  <button
                    key={`${searchItem.type}-${searchItem.id}-${idx}`}
                    type="button"
                    className={`w-full px-3 py-2.5 rounded-[12px] flex items-center justify-between gap-3 text-left transition-all ${isSelected
                        ? "bg-accent text-white shadow-xs"
                        : "hover:bg-surface-secondary text-foreground"
                      }`}
                    onClick={() => {
                      router.push(searchItem.href);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 border ${isSelected
                            ? "bg-white/20 border-white/30 text-white"
                            : "bg-surface-secondary border-border/60"
                          }`}
                      >
                        {getEntityIcon(searchItem.type, searchItem.iconUrl)}
                      </div>

                      <div className="min-w-0">
                        <span
                          className={`text-[14px] font-medium tracking-tight block truncate ${isSelected ? "text-white font-semibold" : "text-foreground"
                            }`}
                        >
                          {searchItem.title}
                        </span>
                        {searchItem.subtitle && (
                          <span
                            className={`text-[12px] block truncate ${isSelected ? "text-white/80" : "text-secondary"
                              }`}
                          >
                            {searchItem.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {searchItem.badge && (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${isSelected
                              ? "bg-white/20 text-white"
                              : "bg-surface-secondary text-secondary border border-border/70"
                            }`}
                        >
                          {searchItem.badge}
                        </span>
                      )}
                      {isSelected && (
                        <CornerDownLeft className="w-4 h-4 text-white/90" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : query.trim() && !isSearching ? (
            <div className="p-8 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-muted mx-auto" />
              <p className="text-[14px] font-medium text-foreground">
                No matches found for &quot;{query}&quot;
              </p>
              <p className="text-[12px] text-secondary">
                Try searching for another concept, book title, or technology tag.
              </p>
            </div>
          ) : (
            /* Quick Nav Recommendations when query is empty */
            <div className="p-1 space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-muted uppercase tracking-wider">
                Quick Navigation
              </div>
              {flatItems.map((action, idx) => {
                const act = action as { title: string; href: string; icon: React.ElementType };
                const Icon = act.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={act.href}
                    type="button"
                    className={`w-full px-3 py-2 rounded-[12px] flex items-center justify-between gap-3 text-left transition-all ${isSelected
                        ? "bg-accent text-white shadow-xs"
                        : "hover:bg-surface-secondary text-foreground"
                      }`}
                    onClick={() => {
                      router.push(act.href);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-surface-secondary text-secondary"
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[13.5px] font-medium">
                        {act.title}
                      </span>
                    </div>

                    <ArrowRight
                      className={`w-4 h-4 ${isSelected ? "text-white" : "text-muted"}`}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Keyboard Helper Footer */}
        <div className="h-10 px-4 bg-muted-bg/50 border-t border-border/60 flex items-center justify-between text-[11px] text-muted shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface border border-border/80 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-surface border border-border/80 rounded">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface border border-border/80 rounded">↵</kbd>
              to select
            </span>
          </div>
          <span>Lock In Unified Graph Search</span>
        </div>
      </div>
    </div>
  );
}
