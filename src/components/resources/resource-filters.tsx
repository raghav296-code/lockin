"use client";

import * as React from "react";
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  X,
  Folder,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TreePicker } from "@/components/categories/tree-picker";
import type { CategoryNode } from "@/actions/categories";
import type { ResourceType, ResourceStatus } from "@/lib/validations/resource";
import { RESOURCE_TYPES } from "./resource-types";
import { cn } from "@/lib/utils";

interface ResourceFiltersProps {
  categories: CategoryNode[];
  search: string;
  onSearchChange: (val: string) => void;
  statusTab: ResourceStatus | "ALL" | "FAVORITES";
  onStatusTabChange: (tab: ResourceStatus | "ALL" | "FAVORITES") => void;
  typeFilter: ResourceType | "ALL";
  onTypeFilterChange: (type: ResourceType | "ALL") => void;
  categoryId: string | null;
  onCategoryIdChange: (id: string | null) => void;
  viewMode: "grid" | "table";
  onViewModeChange: (mode: "grid" | "table") => void;
  counts: {
    all: number;
    inProgress: number;
    backlog: number;
    completed: number;
    favorites: number;
  };
  onOpenCreate: () => void;
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

export function ResourceFilters({
  categories,
  search,
  onSearchChange,
  statusTab,
  onStatusTabChange,
  typeFilter,
  onTypeFilterChange,
  categoryId,
  onCategoryIdChange,
  viewMode,
  onViewModeChange,
  counts,
  onOpenCreate,
}: ResourceFiltersProps) {
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);
  const categoryPickerRef = React.useRef<HTMLDivElement>(null);

  // Close category picker popover when clicking outside
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

  const selectedCategoryName = categoryId
    ? findCategoryName(categories, categoryId)
    : null;

  const TABS = [
    { id: "ALL", label: "All Items", count: counts.all },
    { id: "IN_PROGRESS", label: "In Progress", count: counts.inProgress },
    { id: "BACKLOG", label: "Backlog", count: counts.backlog },
    { id: "COMPLETED", label: "Completed", count: counts.completed },
    { id: "FAVORITES", label: "Favorites", count: counts.favorites },
  ] as const;

  const hasActiveFilters =
    search.trim() !== "" || typeFilter !== "ALL" || categoryId !== null;

  return (
    <div className="space-y-4">
      {/* Top Level: Apple Segmented Status Tabs & View Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Apple Segmented Status Control */}
        <div className="p-1 rounded-2xl bg-muted-bg/80 border border-border inline-flex items-center gap-1 overflow-x-auto max-w-full scrollbar-none shadow-2xs">
          {TABS.map((tab) => {
            const isActive = statusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onStatusTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-surface text-foreground font-semibold shadow-xs border border-border/80"
                    : "text-secondary hover:text-foreground hover:bg-surface/50"
                )}
              >
                {tab.id === "FAVORITES" && (
                  <Star
                    className={cn(
                      "w-3.5 h-3.5",
                      isActive ? "fill-amber-500 text-amber-500" : "text-muted"
                    )}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-md font-mono font-semibold transition-colors",
                    isActive
                      ? "bg-accent/15 text-accent"
                      : "bg-surface text-muted border border-border/60"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Segmented Switcher & Primary Action */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto">
          {/* Apple View Mode Switcher */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-muted-bg/80 border border-border shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-surface text-foreground shadow-xs font-semibold"
                  : "text-secondary hover:text-foreground"
              )}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-surface text-foreground shadow-xs font-semibold"
                  : "text-secondary hover:text-foreground"
              )}
              title="Table view"
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Primary Create Button */}
          <Button
            onClick={onOpenCreate}
            className="h-10 px-4 rounded-2xl gap-2 font-semibold text-[13px] bg-accent hover:bg-accent-hover text-white shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.4]" />
            <span>Add Resource</span>
          </Button>
        </div>
      </div>

      {/* Second Level: Apple Search Bar & Filter Popovers */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none stroke-[2]" />
          <Input
            type="text"
            placeholder="Search resources by title, author, key notes..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-9 h-10 rounded-2xl bg-surface border-border text-[13px] placeholder:text-muted focus-visible:ring-1 focus-visible:ring-accent shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer p-1 rounded-lg"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Badges & Popovers */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Resource Type Selector */}
          <select
            value={typeFilter}
            onChange={(e) =>
              onTypeFilterChange(e.target.value as ResourceType | "ALL")
            }
            className={cn(
              "h-10 px-3.5 rounded-2xl border text-[13px] font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent shadow-xs transition-all",
              typeFilter !== "ALL"
                ? "bg-accent-tint text-accent border-accent/30 font-semibold"
                : "bg-surface border-border text-secondary hover:text-foreground hover:border-border-hover"
            )}
            aria-label="Filter by resource type"
          >
            <option value="ALL">All Types</option>
            {Object.entries(RESOURCE_TYPES).map(([k, cfg]) => (
              <option key={k} value={k}>
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Category TreePicker Popover Trigger */}
          <div className="relative" ref={categoryPickerRef}>
            <button
              type="button"
              onClick={() => setShowCategoryPicker((prev) => !prev)}
              className={cn(
                "h-10 flex items-center gap-2 px-3.5 rounded-2xl border text-[13px] font-medium transition-all cursor-pointer shadow-xs",
                categoryId
                  ? "bg-accent-tint text-accent border-accent/30 font-semibold"
                  : "bg-surface border-border text-secondary hover:text-foreground hover:border-border-hover"
              )}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="truncate max-w-[140px]">
                {selectedCategoryName || "All Categories"}
              </span>
              {categoryId ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCategoryIdChange(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      onCategoryIdChange(null);
                    }
                  }}
                  className="hover:opacity-75 p-0.5 rounded ml-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="text-[9px] opacity-60 ml-0.5">▼</span>
              )}
            </button>

            {/* Apple Floating Frosted Popover */}
            {showCategoryPicker && (
              <div className="absolute right-0 mt-2 w-80 max-h-84 overflow-y-auto rounded-2xl border border-border bg-surface/95 backdrop-blur-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                  <span className="text-[12.5px] font-semibold text-foreground">
                    Filter by Knowledge Domain
                  </span>
                  {categoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        onCategoryIdChange(null);
                        setShowCategoryPicker(false);
                      }}
                      className="text-[11.5px] text-accent font-medium hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <TreePicker
                  categories={categories}
                  selectedId={categoryId}
                  onSelect={(id) => {
                    onCategoryIdChange(id);
                    setShowCategoryPicker(false);
                  }}
                  placeholder="Search categories tree..."
                />
              </div>
            )}
          </div>

          {/* Reset Filters Pill */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onTypeFilterChange("ALL");
                onCategoryIdChange(null);
              }}
              className="h-10 px-3 rounded-2xl text-[12px] font-medium text-muted hover:text-danger hover:bg-danger-tint/50 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset search and filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
