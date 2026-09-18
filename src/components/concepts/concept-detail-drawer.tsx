"use client";

import * as React from "react";
import {
  X,
  Star,
  Edit2,
  Trash2,
  ChevronRight,
  GitFork,
  ArrowRight,
  Link2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConceptItem } from "@/actions/concepts";
import type { MasteryLevel } from "@/lib/validations/concept";
import {
  MASTERY_LEVELS,
  IMPORTANCE_CONFIGS,
} from "./concept-types";

interface ConceptDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  concept: ConceptItem | null;
  onEdit: (concept: ConceptItem) => void;
  onDelete: (id: string) => void;
  onMasteryChange: (id: string, level: MasteryLevel) => void;
  onToggleFavorite: (id: string) => void;
  onSelectConceptById: (id: string) => void;
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

const MASTERY_ORDER: MasteryLevel[] = [
  "NOVICE",
  "FAMILIAR",
  "PROFICIENT",
  "MASTERED",
];

export function ConceptDetailDrawer({
  isOpen,
  onClose,
  concept,
  onEdit,
  onDelete,
  onMasteryChange,
  onToggleFavorite,
  onSelectConceptById,
}: ConceptDetailDrawerProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !concept) return null;

  const masteryCfg =
    MASTERY_LEVELS[concept.masteryLevel] || MASTERY_LEVELS.NOVICE;
  const importanceCfg =
    IMPORTANCE_CONFIGS[concept.importance] || IMPORTANCE_CONFIGS.MEDIUM;
  const categoryCrumbs = getCategoryCrumbs(concept.category);

  const currentIndex = MASTERY_ORDER.indexOf(concept.masteryLevel);
  const canLevelUp = currentIndex < MASTERY_ORDER.length - 1;
  const canLevelDown = currentIndex > 0;

  const handleLevelUp = () => {
    if (canLevelUp) {
      onMasteryChange(concept.id, MASTERY_ORDER[currentIndex + 1]);
    }
  };

  const handleLevelDown = () => {
    if (canLevelDown) {
      onMasteryChange(concept.id, MASTERY_ORDER[currentIndex - 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg h-full bg-surface border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-250"
        role="dialog"
        aria-modal="true"
        aria-labelledby="concept-drawer-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/80 flex items-center justify-between bg-surface/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(concept.id)}
              className={cn(
                "p-1.5 rounded-xl transition-all",
                concept.isFavorite
                  ? "text-amber-500 hover:bg-amber-500/10"
                  : "text-muted hover:text-foreground hover:bg-muted-bg"
              )}
              aria-label="Toggle favorite"
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  concept.isFavorite && "fill-amber-500 stroke-amber-500"
                )}
              />
            </button>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium border",
                importanceCfg.badgeClass
              )}
            >
              {importanceCfg.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(concept)}
              className="p-1.5 rounded-xl text-secondary hover:text-foreground hover:bg-muted-bg transition-colors"
              aria-label="Edit concept"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(concept.id)}
              className="p-1.5 rounded-xl text-muted hover:text-danger hover:bg-danger-tint transition-colors"
              aria-label="Delete concept"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-colors ml-1"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Breadcrumbs & Title */}
          <div className="space-y-2">
            {categoryCrumbs && categoryCrumbs.length > 0 && (
              <div className="inline-flex items-center gap-1 text-[11.5px] text-muted font-medium">
                {categoryCrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRight className="w-3 h-3 text-muted/60" />}
                    <span>{crumb}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
            <h1
              id="concept-drawer-title"
              className="text-2xl font-bold text-foreground tracking-tight"
            >
              {concept.title}
            </h1>
          </div>

          {/* Mastery Level Progression Box */}
          <div className="p-4 rounded-2xl border border-border bg-muted-bg/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
                Mastery Progression
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleLevelDown}
                  disabled={!canLevelDown}
                  className="px-2 py-1 rounded-lg text-[11px] font-medium border border-border bg-surface text-secondary hover:text-foreground disabled:opacity-40 transition-colors"
                >
                  ◀ Demote
                </button>
                <button
                  type="button"
                  onClick={handleLevelUp}
                  disabled={!canLevelUp}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition-colors"
                >
                  Promote ▶
                </button>
              </div>
            </div>

            {/* Stepper Display */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {MASTERY_ORDER.map((lvl, index) => {
                const isCurrent = lvl === concept.masteryLevel;
                const isPassed = index < currentIndex;
                const cfg = MASTERY_LEVELS[lvl];
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => onMasteryChange(concept.id, lvl)}
                    className={cn(
                      "py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer",
                      isCurrent
                        ? cn("font-bold shadow-xs", cfg.bg, cfg.border)
                        : isPassed
                        ? "bg-muted-bg/70 border-border text-foreground opacity-80"
                        : "bg-surface border-border/60 text-muted opacity-50"
                    )}
                  >
                    <div className="text-[11px] font-semibold truncate">
                      {cfg.label}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] text-secondary leading-relaxed">
              {masteryCfg.description}
            </p>
          </div>

          {/* Definition / Summary */}
          {concept.summary && (
            <div className="space-y-1.5">
              <h2 className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
                Summary & Intuition
              </h2>
              <p className="text-[14px] text-foreground leading-relaxed">
                {concept.summary}
              </p>
            </div>
          )}

          {/* Graph Connections: Prerequisites & Dependents */}
          <div className="space-y-3">
            <h2 className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
              Knowledge Graph Relations
            </h2>

            {/* Prerequisites */}
            <div className="space-y-1.5">
              <span className="text-[12px] font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5" />
                <span>Prerequisites ({concept.prerequisites.length})</span>
              </span>

              {concept.prerequisites.length === 0 ? (
                <p className="text-[12px] text-muted pl-5">
                  No prerequisite concepts assigned.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {concept.prerequisites.map((p) => {
                    const pCfg =
                      MASTERY_LEVELS[p.masteryLevel] || MASTERY_LEVELS.NOVICE;
                    return (
                      <div
                        key={p.relationId}
                        onClick={() => onSelectConceptById(p.conceptId)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-surface hover:border-accent hover:bg-muted-bg/30 transition-all cursor-pointer text-[13px]"
                      >
                        <span className="font-medium text-foreground truncate">
                          {p.title}
                        </span>
                        <span
                          className={cn(
                            "text-[10.5px] px-2 py-0.5 rounded-md font-semibold shrink-0",
                            pCfg.bg
                          )}
                        >
                          {pCfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dependents */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[12px] font-medium text-accent flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Unlocks Next ({concept.dependents.length})</span>
              </span>

              {concept.dependents.length === 0 ? (
                <p className="text-[12px] text-muted pl-5">
                  No dependent concepts assigned.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {concept.dependents.map((d) => {
                    const dCfg =
                      MASTERY_LEVELS[d.masteryLevel] || MASTERY_LEVELS.NOVICE;
                    return (
                      <div
                        key={d.relationId}
                        onClick={() => onSelectConceptById(d.conceptId)}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-surface hover:border-accent hover:bg-muted-bg/30 transition-all cursor-pointer text-[13px]"
                      >
                        <span className="font-medium text-foreground truncate">
                          {d.title}
                        </span>
                        <span
                          className={cn(
                            "text-[10.5px] px-2 py-0.5 rounded-md font-semibold shrink-0",
                            dCfg.bg
                          )}
                        >
                          {dCfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Connected Resources */}
          <div className="space-y-2">
            <h2 className="text-[12px] font-semibold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5" />
              <span>Connected Study Resources ({concept.resources.length})</span>
            </h2>

            {concept.resources.length === 0 ? (
              <p className="text-[12px] text-muted">
                No study materials linked to this concept yet.
              </p>
            ) : (
              <div className="space-y-2">
                {concept.resources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface text-[13px]"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted-bg font-mono uppercase">
                        {res.type}
                      </span>
                      <span className="font-medium text-foreground truncate">
                        {res.title}
                      </span>
                    </div>
                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-lg text-secondary hover:text-accent hover:bg-muted-bg transition-colors"
                        aria-label="Open resource external link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deep Notes */}
          {concept.notes && (
            <div className="space-y-2">
              <h2 className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
                Notes & Formulas
              </h2>
              <div className="p-4 rounded-2xl border border-border bg-muted-bg/20 font-mono text-[12.5px] whitespace-pre-wrap leading-relaxed text-foreground">
                {concept.notes}
              </div>
            </div>
          )}

          {/* Tags */}
          {concept.tags.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-[12px] font-semibold text-secondary uppercase tracking-wider">
                Tags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {concept.tags.map((t) => (
                  <span
                    key={t.id}
                    className="px-2.5 py-0.5 rounded-lg bg-muted-bg text-[11.5px] font-medium text-foreground"
                  >
                    #{t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/80 bg-muted-bg/30 flex items-center justify-between">
          <span className="text-[11px] text-muted">
            Updated {new Date(concept.updatedAt).toLocaleDateString()}
          </span>
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-xl text-[12.5px] px-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
