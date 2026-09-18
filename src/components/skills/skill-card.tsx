"use client";

import * as React from "react";
import { MoreHorizontal, Edit, Trash2, Award, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SkillItem } from "./skill-types";

interface SkillCardProps {
  skill: SkillItem;
  onEdit: (skill: SkillItem) => void;
  onDelete: (id: string) => void;
  onUpdateProgress: (id: string, newProgress: number) => void;
}

export function SkillCard({
  skill,
  onEdit,
  onDelete,
  onUpdateProgress,
}: SkillCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const handleStepProgress = (delta: number) => {
    const next = Math.max(0, Math.min(100, skill.progress + delta));
    if (next !== skill.progress) {
      onUpdateProgress(skill.id, next);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-success text-success";
    if (progress >= 60) return "bg-accent text-accent";
    if (progress >= 30) return "bg-purple text-purple";
    return "bg-secondary text-secondary";
  };

  return (
    <div className="group relative rounded-[14px] border border-border bg-surface p-5 transition-all duration-200 hover:border-border-hover">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-semibold text-foreground tracking-tight truncate">
              {skill.name}
            </h3>
            {skill.progress === 100 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success bg-success-tint px-2 py-0.5 rounded-md">
                <Award className="w-3 h-3" />
                Mastered
              </span>
            )}
          </div>

          {skill.categoryName && (
            <span className="text-[12px] text-secondary font-medium">
              {skill.categoryName}
            </span>
          )}
        </div>

        {/* Options Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-lg text-secondary hover:text-foreground"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-36 rounded-xl border border-border bg-surface shadow-lg py-1 z-30 animate-in fade-in-50 zoom-in-95">
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[13px] text-foreground hover:bg-surface-hover flex items-center gap-2 transition-colors"
                onClick={() => {
                  setShowMenu(false);
                  onEdit(skill);
                }}
              >
                <Edit className="w-3.5 h-3.5 text-secondary" />
                Edit skill
              </button>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[13px] text-danger hover:bg-danger-tint/20 flex items-center gap-2 transition-colors"
                onClick={() => {
                  setShowMenu(false);
                  onDelete(skill.id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {skill.description && (
        <p className="text-[13px] text-secondary line-clamp-2 leading-relaxed mb-4">
          {skill.description}
        </p>
      )}

      {/* Progress Bar (6px tall per Apple spec) */}
      <div className="space-y-2 mt-auto pt-2">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-secondary font-medium">Proficiency</span>
          <span className="font-semibold text-foreground">
            {skill.progress}%
          </span>
        </div>

        <div className="relative w-full h-[6px] rounded-full bg-border/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              skill.progress >= 100
                ? "bg-success"
                : skill.progress >= 60
                ? "bg-accent"
                : "bg-purple"
            }`}
            style={{ width: `${skill.progress}%` }}
          />
        </div>

        {/* Quick Stepper Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="w-6 h-6 rounded-md border border-border bg-surface-hover/50 text-secondary hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-40"
              onClick={() => handleStepProgress(-5)}
              disabled={skill.progress <= 0}
              title="Decrease 5%"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              className="w-6 h-6 rounded-md border border-border bg-surface-hover/50 text-secondary hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-40"
              onClick={() => handleStepProgress(5)}
              disabled={skill.progress >= 100}
              title="Increase 5%"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <span className="text-[11px] text-muted">
            {skill.progress < 25
              ? "Beginner"
              : skill.progress < 60
              ? "Intermediate"
              : skill.progress < 90
              ? "Advanced"
              : "Mastered"}
          </span>
        </div>
      </div>
    </div>
  );
}
