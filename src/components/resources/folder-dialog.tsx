"use client";

import * as React from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MacFolderIcon } from "./mac-folder-icon";
import type { CategoryNode } from "@/actions/categories";
import { createCategoryAction, renameCategoryAction } from "@/actions/categories";

interface FolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: CategoryNode | null;
  onSuccess: () => void;
}

export function FolderDialog({
  isOpen,
  onClose,
  editingCategory,
  onSuccess,
}: FolderDialogProps) {
  const [name, setName] = React.useState(editingCategory?.name || "");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(editingCategory?.name || "");
    setError(null);
  }, [editingCategory, isOpen]);

  if (!isOpen) return null;

  const isEditing = !!editingCategory;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && editingCategory) {
        const res = await renameCategoryAction({
          id: editingCategory.id,
          name: name.trim(),
        });
        if (res.ok) {
          onSuccess();
          onClose();
        } else {
          setError(res.error || "Failed to rename folder");
        }
      } else {
        // Flat top-level collection folder (level 1)
        const res = await createCategoryAction({
          name: name.trim(),
          parentId: null,
          level: 1,
        });
        if (res.ok) {
          onSuccess();
          onClose();
          setName("");
        } else {
          setError(res.error || "Failed to create folder");
        }
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MacFolderIcon size="sm" variant="blue" />
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                {isEditing ? "Rename Collection" : "New Collection"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing ? "Update collection name" : "Create a curated study shelf"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Folder Name *
            </label>
            <Input
              type="text"
              placeholder="e.g. Web Design, Machine Learning, Reels to Study"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-10 text-sm bg-muted/30 border-border/60"
              autoFocus
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl text-xs h-9 px-4 border-border/60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl text-xs font-semibold h-9 px-5 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25 border border-blue-400/30"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Name"
              ) : (
                "Create Folder"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
