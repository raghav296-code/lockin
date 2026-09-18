"use client";

import * as React from "react";
import {
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  ChevronRight,
  BookOpen,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConceptItem } from "@/actions/concepts";
import type { MasteryLevel } from "@/lib/validations/concept";
import {
  MASTERY_LEVELS,
  IMPORTANCE_CONFIGS,
} from "./concept-types";

interface ConceptCardProps {
  concept: ConceptItem;
  onView: (concept: ConceptItem) => void;
  onEdit: (concept: ConceptItem) => void;
  onDelete: (id: string) => void;
  onMasteryChange: (id: string, level: MasteryLevel) => void;
  onToggleFavorite: (id: string) => void;
}

function getCategoryCrumbs(category: ConceptItem["category"]) {
  if (!category) return null;
  const parts: string[] = [];
  if (category.parent?.parent) {
    parts.push(category.parent.parent.name);
  }
  if (category.parent) {
    parts.push(category.parent.name);
  }
  parts.push(category.name);
  return parts;
}

export function ConceptCard({
  concept,
  onView,
  onEdit,
  onDelete,
  onMasteryChange,
  onToggleFavorite,
}: ConceptCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const masteryCfg =
    MASTERY_LEVELS[concept.masteryLevel] || MASTERY_LEVELS.NOVICE;
  const importanceCfg =
    IMPORTANCE_CONFIGS[concept.importance] || IMPORTANCE_CONFIGS.MEDIUM;

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const categoryCrumbs = getCategoryCrumbs(concept.category);

  return (
    <div className="group relative rounded-[22px] border border-border bg-surface p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 hover:border-border-hover hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)]">
      {/* Header Row */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          {/* Mastery Selector Pill */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative inline-flex items-center">
              <span
                className={cn(
                  "w-2 h-2 rounded-full absolute left-2.5 pointer-events-none",
                  masteryCfg.dotColor
                )}
              />
              <select
                value={concept.masteryLevel}
                onChange={(e) =>
                  onMasteryChange(concept.id, e.target.value as MasteryLevel)
                }
                className={cn(
                  "text-[12px] font-semibold pl-6 pr-6 py-1 rounded-xl border appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                  masteryCfg.bg,
                  masteryCfg.border
                )}
                aria-label="Change mastery level"
              >
                <option value="NOVICE">Novice</option>
                <option value="FAMILIAR">Familiar</option>
                <option value="PROFICIENT">Proficient</option>
                <option value="MASTERED">Mastered</option>
              </select>
              <span className="pointer-events-none absolute right-2 text-[9px] opacity-60">
                ▼
              </span>
            </div>

            {/* Importance Pill */}
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium border",
                importanceCfg.badgeClass
              )}
            >
              {importanceCfg.label}
            </span>
          </div>

          {/* Quick Actions (Favorite & More) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggleFavorite(concept.id)}
              className={cn(
                "p-1.5 rounded-xl transition-all cursor-pointer active:scale-90",
                concept.isFavorite
                  ? "text-amber-500 hover:bg-amber-500/10"
                  : "text-muted hover:text-foreground hover:bg-muted-bg"
              )}
              title={
                concept.isFavorite
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              aria-label="Favorite toggle"
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  concept.isFavorite && "fill-amber-500 stroke-amber-500"
                )}
              />
            </button>

            {/* More Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1.5 w-40 rounded-2xl border border-border bg-surface/95 backdrop-blur-2xl shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 text-[13px]">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onView(concept);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted-bg text-left cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 stroke-[1.75] text-secondary" />
                    <span>Inspect Graph</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(concept);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-foreground hover:bg-muted-bg text-left cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 stroke-[1.75] text-secondary" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(concept.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-danger hover:bg-danger-tint text-left cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 stroke-[1.75]" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category Hierarchy Breadcrumbs */}
        {categoryCrumbs && categoryCrumbs.length > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted-bg/60 text-[11px] font-medium text-secondary truncate max-w-full">
            {categoryCrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ChevronRight className="w-3 h-3 text-muted shrink-0" />
                )}
                <span className="truncate">{crumb}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Title & Summary */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onView(concept)}
            className="text-left font-semibold text-[17px] text-foreground tracking-tight line-clamp-2 hover:text-accent transition-colors cursor-pointer leading-snug"
          >
            {concept.title}
          </button>
        </div>

        {concept.summary && (
          <p className="text-[13px] text-secondary leading-relaxed line-clamp-2">
            {concept.summary}
          </p>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="pt-4 mt-4 border-t border-border/60 space-y-3">
        {/* Prerequisite & Dependents Badges */}
        <div className="flex items-center gap-2 flex-wrap text-[11.5px]">
          {concept.prerequisites.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
              <span>{concept.prerequisites.length} Prereqs</span>
            </span>
          )}

          {concept.dependents.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-accent-tint text-accent font-medium">
              <span>{concept.dependents.length} Dependents</span>
            </span>
          )}

          {concept.resources.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted-bg text-secondary font-medium ml-auto">
              <Link2 className="w-3 h-3" />
              <span>{concept.resources.length} resources</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
