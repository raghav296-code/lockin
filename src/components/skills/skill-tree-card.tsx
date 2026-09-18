"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Minus,
  Award,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SkillItem } from "./skill-types";

interface SkillTreeCardProps {
  skill: SkillItem;
  onEdit: (skill: SkillItem) => void;
  onDelete: (id: string, name: string) => void;
  onAddSubSkill: (parentSkill: SkillItem) => void;
  onUpdateProgress: (id: string, newProgress: number) => void;
}

export function SkillTreeCard({
  skill,
  onEdit,
  onDelete,
  onAddSubSkill,
  onUpdateProgress,
}: SkillTreeCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);

  const subSkills = skill.children || [];
  const hasSubSkills = subSkills.length > 0;

  const handleStepProgress = (id: string, current: number, delta: number) => {
    const next = Math.max(0, Math.min(100, current + delta));
    if (next !== current) {
      onUpdateProgress(id, next);
    }
  };

  const getProficiencyLabel = (progress: number) => {
    if (progress >= 100) return "Mastered";
    if (progress >= 75) return "Advanced";
    if (progress >= 40) return "Intermediate";
    return "Beginner";
  };

  return (
    <div className="group rounded-[18px] border border-border/80 bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-all duration-200 hover:border-border-hover overflow-hidden">
      {/* Top Parent Skill Header */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Auto Tech Icon Squircle Badge */}
            <div className="w-11 h-11 rounded-[12px] bg-surface-secondary/70 border border-border/70 flex items-center justify-center shrink-0 p-2 shadow-xs group-hover:scale-105 transition-transform">
              {skill.iconUrl && !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={skill.iconUrl}
                  alt={skill.name}
                  className="w-full h-full object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <Award className="w-5 h-5 text-accent" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-semibold text-foreground tracking-tight truncate">
                  {skill.name}
                </h3>
                {skill.progress === 100 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success-tint px-2 py-0.5 rounded-full shrink-0">
                    <Sparkles className="w-3 h-3" />
                    100%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                {skill.categoryName && (
                  <span className="text-[12px] text-secondary font-medium">
                    {skill.categoryName}
                  </span>
                )}
                {hasSubSkills && (
                  <>
                    <span className="text-muted text-[10px]">•</span>
                    <span className="text-[12px] text-accent font-medium flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {subSkills.length} sub-{subSkills.length === 1 ? "skill" : "skills"}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Toolbar (Edit & Delete) */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors"
              onClick={() => onEdit(skill)}
              title="Edit skill"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-secondary hover:text-danger hover:bg-danger-tint/20 transition-colors"
              onClick={() => onDelete(skill.id, skill.name)}
              title="Delete skill"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Description if present */}
        {skill.description && (
          <p className="text-[13px] text-secondary leading-relaxed line-clamp-2">
            {skill.description}
          </p>
        )}

        {/* Main Progress Bar (6px Apple HIG) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-secondary font-medium">
              {hasSubSkills ? "Overall proficiency (Average)" : "Proficiency"}
            </span>
            <span className="font-semibold text-foreground">
              {skill.progress}% • {getProficiencyLabel(skill.progress)}
            </span>
          </div>

          <div className="relative w-full h-[6px] rounded-full bg-border/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                skill.progress >= 100
                  ? "bg-success"
                  : skill.progress >= 70
                  ? "bg-accent"
                  : skill.progress >= 40
                  ? "bg-purple"
                  : "bg-amber-500"
              }`}
              style={{ width: `${skill.progress}%` }}
            />
          </div>

          {/* Stepper only if standalone (without sub-skills) */}
          {!hasSubSkills && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="w-6 h-6 rounded-md border border-border bg-surface-secondary text-secondary hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-40"
                  onClick={() => handleStepProgress(skill.id, skill.progress, -5)}
                  disabled={skill.progress <= 0}
                  title="Decrease 5%"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  className="w-6 h-6 rounded-md border border-border bg-surface-secondary text-secondary hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-40"
                  onClick={() => handleStepProgress(skill.id, skill.progress, 5)}
                  disabled={skill.progress >= 100}
                  title="Increase 5%"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <span className="text-[11px] text-muted">Direct adjust</span>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Skills Inset Group (Apple HIG Grouped List) */}
      <div className="border-t border-border/60 bg-muted-bg/30 px-5 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-1.5 text-[12px] font-semibold text-secondary hover:text-foreground transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            <span>Sub-skills ({subSkills.length})</span>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 rounded-lg text-[12px] font-medium text-accent hover:bg-accent-tint/30 flex items-center gap-1"
            onClick={() => onAddSubSkill(skill)}
          >
            <Plus className="w-3 h-3" />
            <span>Add sub-skill</span>
          </Button>
        </div>

        {/* Expandable Sub-skills Rows */}
        {isExpanded && (
          <div className="mt-3 space-y-2.5">
            {subSkills.length > 0 ? (
              subSkills.map((sub) => (
                <div
                  key={sub.id}
                  className="group/sub relative rounded-[12px] border border-border/70 bg-surface p-3 flex flex-col gap-2 transition-all hover:border-border-hover"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Sub-skill Logo */}
                      <div className="w-7 h-7 rounded-[8px] bg-surface-secondary/70 border border-border/60 flex items-center justify-center shrink-0 p-1">
                        {sub.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sub.iconUrl}
                            alt={sub.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-accent">
                            {sub.name.charAt(0)}
                          </span>
                        )}
                      </div>

                      <span className="text-[13.5px] font-medium text-foreground truncate">
                        {sub.name}
                      </span>
                    </div>

                    {/* Progress Percentage & Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] font-semibold text-foreground">
                        {sub.progress}%
                      </span>

                      {/* Stepper Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="w-5 h-5 rounded-md border border-border/60 bg-surface-secondary text-secondary hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-30"
                          onClick={() => handleStepProgress(sub.id, sub.progress, -5)}
                          disabled={sub.progress <= 0}
                          title="Decrease 5%"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <button
                          type="button"
                          className="w-5 h-5 rounded-md border border-border/60 bg-surface-secondary text-secondary hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-30"
                          onClick={() => handleStepProgress(sub.id, sub.progress, 5)}
                          disabled={sub.progress >= 100}
                          title="Increase 5%"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Sub-skill Delete Button */}
                      <button
                        type="button"
                        className="w-6 h-6 rounded-md text-muted hover:text-danger hover:bg-danger-tint/20 flex items-center justify-center transition-colors opacity-70 group-hover/sub:opacity-100"
                        onClick={() => onDelete(sub.id, sub.name)}
                        title={`Delete ${sub.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-skill 4px progress bar */}
                  <div className="w-full h-[4px] rounded-full bg-border/40 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        sub.progress >= 100
                          ? "bg-success"
                          : sub.progress >= 70
                          ? "bg-accent"
                          : "bg-purple"
                      }`}
                      style={{ width: `${sub.progress}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center rounded-[10px] border border-dashed border-border/70 text-[12px] text-muted">
                No sub-skills yet. Add frameworks, libraries, or sub-topics!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
