"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Network,
  LayoutGrid,
  Table as TableIcon,
  Star,
  Folder,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TreePicker } from "@/components/categories/tree-picker";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/actions/categories";
import type { MasteryLevel, ConceptImportance } from "@/lib/validations/concept";
import { MASTERY_LEVELS } from "./concept-types";

export type ViewMode = "graph" | "grid" | "table";

interface ConceptFiltersProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedMastery: MasteryLevel | "ALL";
  onMasteryChange: (mastery: MasteryLevel | "ALL") => void;
  selectedImportance: ConceptImportance | "ALL";
  onImportanceChange: (importance: ConceptImportance | "ALL") => void;
  selectedCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  isFavoriteOnly: boolean;
  onToggleFavoriteOnly: () => void;
  categories: CategoryNode[];
  counts: {
    total: number;
    NOVICE: number;
    FAMILIAR: number;
    PROFICIENT: number;
    MASTERED: number;
    favorites: number;
  };
  onNewConcept: () => void;
}

function findCategoryName(nodes: CategoryNode[], id: string): string | null {
  for (const node of nodes) {
    if (node.id === id) return node.name;
    if (node.children && node.children.length > 0) {
      const found = findCategoryName(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function ConceptFilters({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  selectedMastery,
  onMasteryChange,
  selectedImportance,
  onImportanceChange,
  selectedCategoryId,
  onCategoryChange,
  isFavoriteOnly,
  onToggleFavoriteOnly,
  categories,
  counts,
  onNewConcept,
}: ConceptFiltersProps) {
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);
  const categoryPickerRef = React.useRef<HTMLDivElement>(null);

  // Close category picker on click outside
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        categoryPickerRef.current &&
        !categoryPickerRef.current.contains(e.target as Node)
      ) {
        setShowCategoryPicker(false);
      }
    }
    if (showCategoryPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCategoryPicker]);

  const selectedCategoryName = selectedCategoryId
    ? findCategoryName(categories, selectedCategoryId)
    : null;

  return (
    <div className="space-y-4">
      {/* Top Bar: View Segmented Switcher, Search, and New Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Apple Segmented View Mode Picker */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-muted-bg border border-border self-start">
          <button
            type="button"
            onClick={() => onViewModeChange("graph")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer",
              viewMode === "graph"
                ? "bg-surface text-foreground shadow-xs font-semibold"
                : "text-secondary hover:text-foreground"
            )}
          >
            <Network className="w-4 h-4" />
            <span>Graph View</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer",
              viewMode === "grid"
                ? "bg-surface text-foreground shadow-xs font-semibold"
                : "text-secondary hover:text-foreground"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer",
              viewMode === "table"
                ? "bg-surface text-foreground shadow-xs font-semibold"
                : "text-secondary hover:text-foreground"
            )}
          >
            <TableIcon className="w-4 h-4" />
            <span>Table</span>
          </button>
        </div>

        {/* Search and Action Button */}
        <div className="flex items-center gap-2.5 flex-1 sm:justify-end">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search concepts or notes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-8 text-[13px] h-10 rounded-2xl bg-surface border-border"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            onClick={onNewConcept}
            className="rounded-2xl h-10 px-4 bg-accent hover:bg-accent-hover text-white font-medium text-[13px] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Concept</span>
          </Button>
        </div>
      </div>

      {/* Secondary Row: Mastery Level Filter Pills & Category Filter */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        {/* Mastery Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => onMasteryChange("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer border",
              selectedMastery === "ALL"
                ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                : "bg-surface text-secondary border-border hover:border-border-hover hover:text-foreground"
            )}
          >
            All ({counts.total})
          </button>

          {(Object.keys(MASTERY_LEVELS) as MasteryLevel[]).map((level) => {
            const cfg = MASTERY_LEVELS[level];
            const isSelected = selectedMastery === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => onMasteryChange(level)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer border",
                  isSelected
                    ? cn("font-semibold shadow-xs border-current", cfg.bg)
                    : "bg-surface text-secondary border-border hover:border-border-hover hover:text-foreground"
                )}
              >
                <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dotColor)} />
                <span>{cfg.label}</span>
                <span className="opacity-70 text-[11px]">({counts[level] || 0})</span>
              </button>
            );
          })}

          {/* Favorite Filter Toggle */}
          <button
            type="button"
            onClick={onToggleFavoriteOnly}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all cursor-pointer border",
              isFavoriteOnly
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold"
                : "bg-surface text-secondary border-border hover:border-border-hover hover:text-foreground"
            )}
          >
            <Star
              className={cn(
                "w-3.5 h-3.5",
                isFavoriteOnly ? "fill-amber-500 stroke-amber-500" : ""
              )}
            />
            <span>Favorites</span>
            <span className="opacity-70 text-[11px]">({counts.favorites})</span>
          </button>
        </div>

        {/* Category & Importance Pickers */}
        <div className="flex items-center gap-2">
          {/* Category Picker Popover */}
          <div className="relative" ref={categoryPickerRef}>
            <button
              type="button"
              onClick={() => setShowCategoryPicker((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium border transition-all cursor-pointer",
                selectedCategoryId
                  ? "bg-accent-tint text-accent border-accent/30 font-semibold"
                  : "bg-surface text-secondary border-border hover:border-border-hover hover:text-foreground"
              )}
            >
              <Folder className="w-3.5 h-3.5" />
              <span>{selectedCategoryName || "Category Filter"}</span>
              {selectedCategoryId && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCategoryChange(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      onCategoryChange(null);
                    }
                  }}
                  className="hover:opacity-75 p-0.5 rounded ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>

            {showCategoryPicker && (
              <div className="absolute right-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl border border-border bg-surface/95 backdrop-blur-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <span className="text-[12px] font-semibold text-foreground">
                    Filter by Category
                  </span>
                  {selectedCategoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        onCategoryChange(null);
                        setShowCategoryPicker(false);
                      }}
                      className="text-[11px] text-accent hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <TreePicker
                  categories={categories}
                  selectedId={selectedCategoryId}
                  onSelect={(id) => {
                    onCategoryChange(id);
                    setShowCategoryPicker(false);
                  }}
                  placeholder="Filter category tree..."
                />
              </div>
            )}
          </div>

          {/* Importance Selector */}
          <select
            value={selectedImportance}
            onChange={(e) =>
              onImportanceChange(e.target.value as ConceptImportance | "ALL")
            }
            className="text-[12px] font-medium px-2.5 py-1.5 rounded-xl border border-border bg-surface text-secondary hover:text-foreground hover:border-border-hover cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            aria-label="Filter by importance"
          >
            <option value="ALL">All Importance</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>
    </div>
  );
}
