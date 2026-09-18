"use client";

import * as React from "react";
import {
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  BookOpen,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConceptItem } from "@/actions/concepts";
import type { MasteryLevel } from "@/lib/validations/concept";
import { MASTERY_LEVELS, IMPORTANCE_CONFIGS } from "./concept-types";

interface ConceptTableProps {
  concepts: ConceptItem[];
  onView: (concept: ConceptItem) => void;
  onEdit: (concept: ConceptItem) => void;
  onDelete: (id: string) => void;
  onMasteryChange: (id: string, level: MasteryLevel) => void;
  onToggleFavorite: (id: string) => void;
}

function getCategoryName(category: ConceptItem["category"]) {
  if (!category) return "Unassigned";
  if (category.parent) {
    return `${category.parent.name} › ${category.name}`;
  }
  return category.name;
}

export function ConceptTable({
  concepts,
  onView,
  onEdit,
  onDelete,
  onMasteryChange,
  onToggleFavorite,
}: ConceptTableProps) {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);

  React.useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        activeMenuId &&
        !(e.target as HTMLElement).closest(".table-action-menu")
      ) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeMenuId]);

  if (concepts.length === 0) {
    return (
      <div className="rounded-[22px] border border-border bg-surface p-12 text-center">
        <p className="text-[14px] text-secondary">No concepts match your filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[22px] border border-border bg-surface overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted-bg/40 text-[12px] font-semibold text-secondary uppercase tracking-wider">
              <th className="py-3 px-4 w-10 text-center">★</th>
              <th className="py-3 px-4">Concept & Category</th>
              <th className="py-3 px-4 w-44">Mastery</th>
              <th className="py-3 px-4 w-28">Importance</th>
              <th className="py-3 px-4 w-32">Graph Rel</th>
              <th className="py-3 px-4 w-28">Resources</th>
              <th className="py-3 px-4 w-16 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 text-[13px]">
            {concepts.map((concept) => {
              const masteryCfg =
                MASTERY_LEVELS[concept.masteryLevel] || MASTERY_LEVELS.NOVICE;
              const importanceCfg =
                IMPORTANCE_CONFIGS[concept.importance] ||
                IMPORTANCE_CONFIGS.MEDIUM;
              const categoryStr = getCategoryName(concept.category);

              return (
                <tr
                  key={concept.id}
                  className="hover:bg-muted-bg/30 transition-colors group cursor-pointer"
                  onClick={() => onView(concept)}
                >
                  {/* Favorite Toggle */}
                  <td
                    className="py-3 px-4 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(concept.id);
                    }}
                  >
                    <button
                      type="button"
                      className="p-1 rounded-lg hover:bg-muted-bg text-muted transition-colors"
                      aria-label="Toggle favorite"
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          concept.isFavorite
                            ? "fill-amber-500 stroke-amber-500"
                            : "hover:text-foreground"
                        )}
                      />
                    </button>
                  </td>

                  {/* Title & Hierarchy */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground group-hover:text-accent transition-colors">
                        {concept.title}
                      </span>
                      <span className="text-[11.5px] text-muted truncate max-w-xs">
                        {categoryStr}
                      </span>
                    </div>
                  </td>

                  {/* Mastery Dropdown */}
                  <td
                    className="py-3 px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
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
                          onMasteryChange(
                            concept.id,
                            e.target.value as MasteryLevel
                          )
                        }
                        className={cn(
                          "text-[11.5px] font-semibold pl-6 pr-6 py-1 rounded-xl border appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
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
                      <span className="pointer-events-none absolute right-2 text-[8px] opacity-60">
                        ▼
                      </span>
                    </div>
                  </td>

                  {/* Importance */}
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border",
                        importanceCfg.badgeClass
                      )}
                    >
                      {importanceCfg.label}
                    </span>
                  </td>

                  {/* Graph Relations */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {concept.prerequisites.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                          {concept.prerequisites.length} in
                        </span>
                      )}
                      {concept.dependents.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-accent-tint text-accent font-medium">
                          {concept.dependents.length} out
                        </span>
                      )}
                      {concept.prerequisites.length === 0 &&
                        concept.dependents.length === 0 && (
                          <span className="text-muted text-[11px]">—</span>
                        )}
                    </div>
                  </td>

                  {/* Connected Resources */}
                  <td className="py-3 px-4">
                    {concept.resources.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[12px] text-secondary font-medium">
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{concept.resources.length}</span>
                      </span>
                    ) : (
                      <span className="text-muted text-[11px]">0</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-block table-action-menu">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(
                            activeMenuId === concept.id ? null : concept.id
                          )
                        }
                        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === concept.id && (
                        <div className="absolute right-0 mt-1 w-36 rounded-2xl border border-border bg-surface/95 backdrop-blur-2xl shadow-xl p-1.5 z-40 text-left text-[12px]">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onView(concept);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-muted-bg"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-secondary" />
                            <span>Inspect</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onEdit(concept);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-foreground hover:bg-muted-bg"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-secondary" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onDelete(concept.id);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-danger hover:bg-danger-tint"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
