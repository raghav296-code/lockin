"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProjectSchema, type CreateProjectInput, type ProjectStatus } from "@/lib/validations/project";
import { createProjectAction, updateProjectAction } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Loader2, Globe, Sparkles } from "lucide-react";
import type { ProjectItem, SkillItem } from "@/components/skills/skill-types";

interface ProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableSkills: SkillItem[];
  editProject?: ProjectItem | null;
}

export function ProjectDialog({
  isOpen,
  onClose,
  onSuccess,
  availableSkills,
  editProject,
}: ProjectDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedSkillIds, setSelectedSkillIds] = React.useState<string[]>([]);

  const isEditing = Boolean(editProject);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      repoUrl: "",
      status: "IN_PROGRESS",
      skillIds: [],
    },
  });

  // Flatten parent skills and sub-skills for multi-select
  const allFlattenedSkills = React.useMemo(() => {
    const list: { id: string; name: string; iconUrl: string | null }[] = [];
    for (const parent of availableSkills) {
      list.push({ id: parent.id, name: parent.name, iconUrl: parent.iconUrl });
      if (parent.children) {
        for (const child of parent.children) {
          list.push({ id: child.id, name: `${parent.name} / ${child.name}`, iconUrl: child.iconUrl });
        }
      }
    }
    return list;
  }, [availableSkills]);

  React.useEffect(() => {
    if (editProject) {
      reset({
        name: editProject.name,
        description: editProject.description || "",
        url: editProject.url || "",
        repoUrl: editProject.repoUrl || "",
        status: editProject.status,
      });
      setSelectedSkillIds(editProject.skills.map((s) => s.id));
    } else {
      reset({
        name: "",
        description: "",
        url: "",
        repoUrl: "",
        status: "IN_PROGRESS",
      });
      setSelectedSkillIds([]);
    }
    setError(null);
  }, [editProject, isOpen, reset]);

  if (!isOpen) return null;

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  async function onSubmit(data: CreateProjectInput) {
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && editProject) {
        const res = await updateProjectAction({
          id: editProject.id,
          name: data.name,
          description: data.description || null,
          url: data.url || null,
          repoUrl: data.repoUrl || null,
          status: data.status,
          skillIds: selectedSkillIds,
        });

        if (!res.ok) {
          setError(res.error || "Failed to update project");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await createProjectAction({
          ...data,
          skillIds: selectedSkillIds,
        });

        if (!res.ok) {
          setError(res.error || "Failed to create project");
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
              {isEditing ? "Edit project" : "Add project"}
            </h2>
            <p className="text-[13px] text-secondary mt-0.5">
              {isEditing
                ? "Update repository, live deployment, or skill links"
                : "Showcase an applied build, repository, and live interactive demo"}
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
          {/* Project Title */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Project title
            </label>
            <Input
              type="text"
              placeholder="e.g. Mini-LLM Inference Engine, Distributed Raft Cluster"
              disabled={isSubmitting}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[12px] text-danger">{errors.name.message}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Project status
            </label>
            <select
              className="w-full h-[38px] px-3 rounded-[10px] border border-border bg-surface text-foreground text-[13.5px] focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              disabled={isSubmitting}
              {...register("status")}
            >
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="PLANNING">Planning</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Live Deployment URL */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-accent" />
              Live Deployed Site URL (for in-app preview)
            </label>
            <Input
              type="url"
              placeholder="https://my-project.vercel.app"
              disabled={isSubmitting}
              {...register("url")}
            />
            {errors.url && (
              <p className="text-[12px] text-danger">{errors.url.message}</p>
            )}
          </div>

          {/* GitHub Repo URL */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 fill-current text-secondary" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub Repository URL
            </label>
            <Input
              type="url"
              placeholder="https://github.com/username/repository"
              disabled={isSubmitting}
              {...register("repoUrl")}
            />
            {errors.repoUrl && (
              <p className="text-[12px] text-danger">{errors.repoUrl.message}</p>
            )}
          </div>

          {/* Linked Skills Multi-Select */}
          <div className="space-y-2 pt-1">
            <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Linked Technologies & Skills
            </label>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-[12px] border border-border/70 bg-surface-secondary/40">
              {allFlattenedSkills.map((s) => {
                const isSelected = selectedSkillIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSkill(s.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all ${
                      isSelected
                        ? "bg-accent text-white shadow-xs"
                        : "bg-surface border border-border/70 text-secondary hover:text-foreground"
                    }`}
                  >
                    {s.iconUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.iconUrl}
                        alt={s.name}
                        className="w-3.5 h-3.5 object-contain"
                      />
                    )}
                    <span>{s.name}</span>
                  </button>
                );
              })}
              {allFlattenedSkills.length === 0 && (
                <p className="text-[12px] text-muted p-1">
                  No skills tracked yet. Add skills in the Skills tab first!
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Description / Highlights
            </label>
            <textarea
              className="w-full min-h-[75px] p-3 rounded-[10px] border border-border bg-surface text-foreground text-[13.5px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-y"
              placeholder="Architecture highlights, key features, performance benchmarks..."
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
              {isEditing ? "Save changes" : "Add project"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
