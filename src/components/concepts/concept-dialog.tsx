"use client";

import * as React from "react";
import {
  X,
  Folder,
  Tag,
  Link2,
  GitFork,
  ArrowRight,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TreePicker } from "@/components/categories/tree-picker";
import { cn } from "@/lib/utils";
import type { CategoryNode } from "@/actions/categories";
import type { ConceptItem } from "@/actions/concepts";
import type {
  CreateConceptInput,
  UpdateConceptInput,
  MasteryLevel,
  ConceptImportance,
} from "@/lib/validations/concept";

export interface SimpleResourceOption {
  id: string;
  title: string;
  type: string;
}

interface ConceptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateConceptInput | UpdateConceptInput) => Promise<boolean>;
  concept?: ConceptItem | null;
  categories: CategoryNode[];
  allConcepts: ConceptItem[];
  availableResources: SimpleResourceOption[];
}

interface ConceptFormProps {
  concept?: ConceptItem | null;
  categories: CategoryNode[];
  allConcepts: ConceptItem[];
  availableResources: SimpleResourceOption[];
  onClose: () => void;
  onSubmit: (data: CreateConceptInput | UpdateConceptInput) => Promise<boolean>;
}

function ConceptForm({
  concept,
  categories,
  allConcepts,
  availableResources,
  onClose,
  onSubmit,
}: ConceptFormProps) {
  const isEditing = Boolean(concept);

  const [title, setTitle] = React.useState(concept?.title ?? "");
  const [categoryId, setCategoryId] = React.useState<string | null>(
    concept?.category?.id ?? null
  );
  const [summary, setSummary] = React.useState(concept?.summary ?? "");
  const [notes, setNotes] = React.useState(concept?.notes ?? "");
  const [masteryLevel, setMasteryLevel] = React.useState<MasteryLevel>(
    concept?.masteryLevel ?? "NOVICE"
  );
  const [importance, setImportance] = React.useState<ConceptImportance>(
    concept?.importance ?? "MEDIUM"
  );
  const [isFavorite] = React.useState(concept?.isFavorite ?? false);
  const [tagInput, setTagInput] = React.useState("");
  const [tags, setTags] = React.useState<string[]>(
    concept?.tags.map((t) => t.name) ?? []
  );
  const [prerequisiteIds, setPrerequisiteIds] = React.useState<string[]>(
    concept?.prerequisites.map((p) => p.conceptId) ?? []
  );
  const [dependentIds, setDependentIds] = React.useState<string[]>(
    concept?.dependents.map((d) => d.conceptId) ?? []
  );
  const [resourceIds, setResourceIds] = React.useState<string[]>(
    concept?.resources.map((r) => r.id) ?? []
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);

  // Filter out self from prerequisite & dependent lists
  const availableConceptOptions = allConcepts.filter(
    (c) => !concept || c.id !== concept.id
  );

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const togglePrerequisite = (id: string) => {
    setPrerequisiteIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleDependent = (id: string) => {
    setDependentIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const toggleResource = (id: string) => {
    setResourceIds((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Concept title is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = isEditing && concept
        ? {
            id: concept.id,
            title: title.trim(),
            categoryId: categoryId || null,
            summary: summary.trim() || null,
            notes: notes.trim() || null,
            masteryLevel,
            importance,
            isFavorite,
            tagNames: tags,
            prerequisiteIds,
            dependentIds,
            resourceIds,
          }
        : {
            title: title.trim(),
            categoryId: categoryId || null,
            summary: summary.trim() || null,
            notes: notes.trim() || null,
            masteryLevel,
            importance,
            isFavorite,
            tagNames: tags,
            prerequisiteIds,
            dependentIds,
            resourceIds,
          };

      const success = await onSubmit(payload);
      if (success) {
        onClose();
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save concept."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-tint border border-danger/20 text-danger text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Concept Title <span className="text-danger">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. Backpropagation, Dynamic Programming, Fourier Transform"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="h-10 text-[14px] rounded-xl"
          />
        </div>

        {/* Category Picker Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-medium text-foreground">
              Domain Category
            </label>
            {categoryId && (
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                className="text-[11.5px] text-accent hover:underline cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCategoryPicker((prev) => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-border bg-surface text-[13px] text-left hover:border-border-hover transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 truncate">
              <Folder className="w-4 h-4 text-secondary shrink-0" />
              <span className={categoryId ? "text-foreground font-medium" : "text-muted"}>
                {categoryId
                  ? "Selected category (click to change)"
                  : "Assign a category..."}
              </span>
            </div>
            <span className="text-[11px] text-accent font-medium">
              {showCategoryPicker ? "Collapse" : "Browse"}
            </span>
          </button>

          {showCategoryPicker && (
            <div className="p-3 mt-1 rounded-2xl border border-border bg-muted-bg/30 max-h-56 overflow-y-auto">
              <TreePicker
                categories={categories}
                selectedId={categoryId}
                onSelect={(id) => {
                  setCategoryId(id);
                  setShowCategoryPicker(false);
                }}
                placeholder="Find parent category..."
              />
            </div>
          )}
        </div>

        {/* Mastery Level & Importance Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mastery */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Mastery Level
            </label>
            <select
              value={masteryLevel}
              onChange={(e) => setMasteryLevel(e.target.value as MasteryLevel)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <option value="NOVICE">Novice (Just Started)</option>
              <option value="FAMILIAR">Familiar (Core Principles)</option>
              <option value="PROFICIENT">Proficient (Practical Application)</option>
              <option value="MASTERED">Mastered (Intuitive Model)</option>
            </select>
          </div>

          {/* Importance */}
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Importance Level
            </label>
            <select
              value={importance}
              onChange={(e) =>
                setImportance(e.target.value as ConceptImportance)
              }
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical Core</option>
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Core Definition / Summary
          </label>
          <textarea
            rows={2}
            placeholder="Concise 1-2 sentence high-level definition..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>

        {/* Markdown Notes */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Deep Notes & Mental Models (Markdown)
          </label>
          <textarea
            rows={4}
            placeholder="Formulas, key intuition, edge cases, theorems..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full font-mono text-[12.5px] px-3.5 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          />
        </div>

        {/* Prerequisites Selector */}
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-purple-500" />
            <span>Prerequisites (Concepts to learn BEFORE this)</span>
          </label>
          <div className="max-h-36 overflow-y-auto p-2.5 rounded-xl border border-border bg-muted-bg/20 space-y-1">
            {availableConceptOptions.length === 0 ? (
              <p className="text-[12px] text-muted p-1">No other concepts created yet.</p>
            ) : (
              availableConceptOptions.map((opt) => {
                const isChecked = prerequisiteIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => togglePrerequisite(opt.id)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors",
                      isChecked
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-300 font-medium"
                        : "hover:bg-muted-bg text-secondary"
                    )}
                  >
                    <span className="truncate">{opt.title}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dependents Selector */}
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-accent" />
            <span>Dependents (Concepts unlocked AFTER mastering this)</span>
          </label>
          <div className="max-h-36 overflow-y-auto p-2.5 rounded-xl border border-border bg-muted-bg/20 space-y-1">
            {availableConceptOptions.length === 0 ? (
              <p className="text-[12px] text-muted p-1">No other concepts created yet.</p>
            ) : (
              availableConceptOptions.map((opt) => {
                const isChecked = dependentIds.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleDependent(opt.id)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors",
                      isChecked
                        ? "bg-accent-tint text-accent font-medium"
                        : "hover:bg-muted-bg text-secondary"
                    )}
                  >
                    <span className="truncate">{opt.title}</span>
                    {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Connected Resources */}
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-secondary" />
            <span>Link Study Resources</span>
          </label>
          <div className="max-h-36 overflow-y-auto p-2.5 rounded-xl border border-border bg-muted-bg/20 space-y-1">
            {availableResources.length === 0 ? (
              <p className="text-[12px] text-muted p-1">No study resources found in library.</p>
            ) : (
              availableResources.map((res) => {
                const isChecked = resourceIds.includes(res.id);
                return (
                  <div
                    key={res.id}
                    onClick={() => toggleResource(res.id)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors",
                      isChecked
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-medium"
                        : "hover:bg-muted-bg text-secondary"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted-bg font-mono uppercase">
                        {res.type}
                      </span>
                      <span className="truncate">{res.title}</span>
                    </div>
                    {isChecked && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-foreground flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-secondary" />
            <span>Tags</span>
          </label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="h-9 text-[13px] rounded-xl"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddTag}
              className="h-9 px-3 text-[12px] rounded-xl"
            >
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-muted-bg text-[11px] text-foreground font-medium"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-muted hover:text-danger p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/80 bg-muted-bg/20">
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
          {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Concept"}
        </Button>
      </div>
    </form>
  );
}

export function ConceptDialog({
  isOpen,
  onClose,
  onSubmit,
  concept,
  categories,
  allConcepts,
  availableResources,
}: ConceptDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[26px] border border-border bg-surface shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="concept-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80">
          <div>
            <h2
              id="concept-dialog-title"
              className="text-[17px] font-semibold text-foreground tracking-tight"
            >
              {concept ? "Edit Concept" : "Create New Concept"}
            </h2>
            <p className="text-[12px] text-secondary">
              Connect mental models, prerequisites, and study resources.
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

        {/* Dynamic Form with unique key per concept */}
        <ConceptForm
          key={concept?.id ?? "new-concept"}
          concept={concept}
          categories={categories}
          allConcepts={allConcepts}
          availableResources={availableResources}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
