"use client";

import * as React from "react";
import { X, Layers, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SemesterPlanItem } from "@/actions/planner";
import type {
  CreateSemesterPlanInput,
  UpdateSemesterPlanInput,
} from "@/lib/validations/planner";

interface SemesterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSemesterPlanInput | UpdateSemesterPlanInput) => Promise<boolean>;
  semesterPlan?: SemesterPlanItem | null;
}

const COLOR_PRESETS = [
  { label: "Blue", hex: "#007AFF" },
  { label: "Purple", hex: "#AF52DE" },
  { label: "Emerald", hex: "#34C759" },
  { label: "Amber", hex: "#FF9500" },
  { label: "Rose", hex: "#FF2D55" },
  { label: "Indigo", hex: "#5856D6" },
];

export function SemesterDialog({
  isOpen,
  onClose,
  onSubmit,
  semesterPlan,
}: SemesterDialogProps) {
  const isEditing = Boolean(semesterPlan);

  const [title, setTitle] = React.useState(semesterPlan?.title ?? "");
  const [startDate, setStartDate] = React.useState(
    semesterPlan
      ? new Date(semesterPlan.startDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = React.useState(
    semesterPlan
      ? new Date(semesterPlan.endDate).toISOString().split("T")[0]
      : new Date(new Date().setMonth(new Date().getMonth() + 4))
          .toISOString()
          .split("T")[0]
  );
  const [color, setColor] = React.useState(semesterPlan?.color ?? "#007AFF");
  const [targetWeeklyHours, setTargetWeeklyHours] = React.useState(
    semesterPlan?.targetWeeklyHours ?? 20
  );
  const [goalSummary, setGoalSummary] = React.useState(
    semesterPlan?.goalSummary ?? ""
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Semester title is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = isEditing && semesterPlan
        ? {
            id: semesterPlan.id,
            title: title.trim(),
            startDate,
            endDate,
            color,
            goalSummary: goalSummary.trim() || null,
            targetWeeklyHours: Number(targetWeeklyHours),
          }
        : {
            title: title.trim(),
            startDate,
            endDate,
            color,
            goalSummary: goalSummary.trim() || null,
            targetWeeklyHours: Number(targetWeeklyHours),
          };

      const success = await onSubmit(payload);
      if (success) {
        onClose();
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save semester plan."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg flex flex-col rounded-[26px] border border-border bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="semester-dialog-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80">
          <div>
            <h2
              id="semester-dialog-title"
              className="text-[17px] font-semibold text-foreground tracking-tight flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-accent" />
              <span>{isEditing ? "Edit Semester Plan" : "Create Semester Plan"}</span>
            </h2>
            <p className="text-[12px] text-secondary">
              Define academic terms, target weekly hours, and exam timelines.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-tint border border-danger/20 text-danger text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Semester / Term Name <span className="text-danger">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Fall Semester 2026, Q4 Masterclass Sprint"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-10 text-[14px] rounded-xl"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">
                Term Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="h-10 text-[13px] rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">
                Term End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="h-10 text-[13px] rounded-xl"
              />
            </div>
          </div>

          {/* Color & Target Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Color */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">
                Accent Theme Color
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.hex}
                    type="button"
                    onClick={() => setColor(p.hex)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all cursor-pointer",
                      color === p.hex
                        ? "ring-2 ring-offset-2 ring-accent scale-110"
                        : "opacity-75 hover:opacity-100"
                    )}
                    style={{ backgroundColor: p.hex }}
                    title={p.label}
                  />
                ))}
              </div>
            </div>

            {/* Target Weekly Study Load */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-foreground">
                Weekly Target (Hours)
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={targetWeeklyHours}
                onChange={(e) => setTargetWeeklyHours(Number(e.target.value))}
                className="h-10 text-[13px] rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Goal Summary */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Semester Vision & Milestone Goals
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Master Linear Algebra & Machine Learning foundations, score A in Finals."
              value={goalSummary}
              onChange={(e) => setGoalSummary(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl text-[13px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-5 bg-accent hover:bg-accent-hover text-white text-[13px] font-medium shadow-xs"
            >
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
