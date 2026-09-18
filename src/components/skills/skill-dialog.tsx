"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSkillSchema, type CreateSkillInput } from "@/lib/validations/skill";
import { createSkillAction, updateSkillAction } from "@/actions/skills";
import { detectSkillIcon } from "@/lib/skill-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Award, Sparkles, Layers, Image as ImageIcon } from "lucide-react";
import type { SkillItem, SkillCategoryOption, ParentSkillOption } from "./skill-types";

interface SkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: SkillCategoryOption[];
  parentSkills: ParentSkillOption[];
  editSkill?: SkillItem | null;
  defaultParentId?: string | null;
}

export function SkillDialog({
  isOpen,
  onClose,
  onSuccess,
  categories,
  parentSkills,
  editSkill,
  defaultParentId,
}: SkillDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showCustomIconInput, setShowCustomIconInput] = React.useState(false);

  const isEditing = Boolean(editSkill);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateSkillInput>({
    resolver: zodResolver(createSkillSchema),
    defaultValues: {
      name: "",
      parentId: defaultParentId || "",
      categoryId: "",
      description: "",
      iconUrl: "",
      progress: 50,
    },
  });

  const skillName = watch("name") || "";
  const manualIconUrl = watch("iconUrl") || "";
  const progressValue = watch("progress") ?? 50;
  const parentIdValue = watch("parentId") || "";

  // Auto-detected icon
  const detectedIcon = React.useMemo(() => {
    if (manualIconUrl) return manualIconUrl;
    return detectSkillIcon(skillName);
  }, [skillName, manualIconUrl]);

  React.useEffect(() => {
    if (editSkill) {
      reset({
        name: editSkill.name,
        parentId: editSkill.parentId || "",
        categoryId: editSkill.categoryId || "",
        description: editSkill.description || "",
        iconUrl: editSkill.iconUrl || "",
        progress: editSkill.progress,
      });
      setShowCustomIconInput(Boolean(editSkill.iconUrl));
    } else {
      reset({
        name: "",
        parentId: defaultParentId || "",
        categoryId: "",
        description: "",
        iconUrl: "",
        progress: 50,
      });
      setShowCustomIconInput(false);
    }
    setError(null);
  }, [editSkill, defaultParentId, isOpen, reset]);

  if (!isOpen) return null;

  async function onSubmit(data: CreateSkillInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      const finalIconUrl = data.iconUrl || detectSkillIcon(data.name) || null;

      if (isEditing && editSkill) {
        const res = await updateSkillAction({
          id: editSkill.id,
          name: data.name,
          parentId: data.parentId || null,
          categoryId: data.categoryId || null,
          description: data.description || null,
          iconUrl: finalIconUrl,
          progress: data.progress,
        });

        if (!res.ok) {
          setError(res.error || "Failed to update skill");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createSkillAction({
          ...data,
          iconUrl: finalIconUrl,
        });

        if (!res.ok) {
          setError(res.error || "Failed to create skill");
          setIsSubmitting(false);
          return;
        }
      }

      onSuccess();
      onClose();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-md animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-[20px] border border-border/80 bg-surface shadow-2xl p-6 sm:p-7 z-10 animate-in fade-in-0 zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <h2 className="text-[18px] font-semibold text-foreground tracking-tight">
              {isEditing ? "Edit skill" : "Add skill"}
            </h2>
            <p className="text-[13px] text-secondary mt-0.5">
              {isEditing
                ? "Update your competency details and proficiency"
                : "Add a parent competency or sub-skill with automatic tech icon detection"}
            </p>
          </div>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-foreground hover:bg-surface-secondary transition-colors"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-danger-tint border border-danger/20 text-danger text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Skill Name & Auto-Icon Preview */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Skill name
            </label>
            <div className="flex items-center gap-2.5">
              {/* Live Detected Logo Badge */}
              <div className="w-10 h-10 rounded-[10px] bg-surface-secondary border border-border/80 flex items-center justify-center shrink-0 p-1.5 shadow-xs">
                {detectedIcon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detectedIcon}
                    alt="Skill Logo"
                    className="w-full h-full object-contain animate-in fade-in duration-200"
                  />
                ) : (
                  <Sparkles className="w-4 h-4 text-muted" />
                )}
              </div>

              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="e.g. Python, PyTorch, Pandas, React, Rust, Docker"
                  disabled={isSubmitting}
                  {...register("name")}
                  className="h-[40px]"
                />
              </div>
            </div>
            {errors.name && (
              <p className="text-[12px] text-danger">{errors.name.message}</p>
            )}
            {detectedIcon && !manualIconUrl && (
              <p className="text-[11.5px] text-accent flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3" />
                Auto-detected tech logo
              </p>
            )}
          </div>

          {/* Hierarchy: Parent Skill selector */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-secondary" />
              Hierarchy (Parent skill)
            </label>
            <select
              className="w-full h-[38px] px-3 rounded-[10px] border border-border bg-surface text-foreground text-[13.5px] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              disabled={isSubmitting}
              {...register("parentId")}
            >
              <option value="">None (Top-level parent skill)</option>
              {parentSkills
                .filter((p) => !editSkill || p.id !== editSkill.id)
                .map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    ↳ Under &quot;{parent.name}&quot;
                  </option>
                ))}
            </select>
            <p className="text-[11.5px] text-muted">
              {parentIdValue
                ? "This will be grouped as a sub-skill under the selected parent."
                : "Creates a main umbrella skill (e.g. Python, Machine Learning)."}
            </p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Academic / Subject Category (optional)
            </label>
            <select
              className="w-full h-[38px] px-3 rounded-[10px] border border-border bg-surface text-foreground text-[13.5px] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              disabled={isSubmitting}
              {...register("categoryId")}
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.level === 1 ? "📁 " : cat.level === 2 ? "  📂 " : "    📄 "}
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Proficiency Slider (Apple HIG) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-accent" />
                Current proficiency
              </label>
              <span className="text-[13px] font-semibold text-foreground">
                {progressValue}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={progressValue}
              onChange={(e) => setValue("progress", parseInt(e.target.value, 10))}
              disabled={isSubmitting}
              className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-accent"
            />

            <div className="flex justify-between text-[11px] text-muted">
              <span>0% Beginner</span>
              <span>50% Intermediate</span>
              <span>100% Mastered</span>
            </div>
          </div>

          {/* Custom Icon URL Toggle */}
          <div className="pt-1">
            {!showCustomIconInput ? (
              <button
                type="button"
                className="text-[12px] text-secondary hover:text-foreground flex items-center gap-1.5 transition-colors"
                onClick={() => setShowCustomIconInput(true)}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Override with custom icon URL</span>
              </button>
            ) : (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-[12px] font-medium text-secondary">
                  Custom Icon / Logo URL
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/logo.svg"
                  disabled={isSubmitting}
                  {...register("iconUrl")}
                  className="h-[36px] text-[13px]"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Description / Notes (optional)
            </label>
            <textarea
              className="w-full min-h-[75px] p-3 rounded-[10px] border border-border bg-surface text-foreground text-[13.5px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-y"
              placeholder="Key concepts, APIs, or libraries mastered under this skill..."
              disabled={isSubmitting}
              {...register("description")}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isEditing ? "Save changes" : "Add skill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
