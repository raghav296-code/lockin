"use client";

import * as React from "react";
import {
  X,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  BookOpen,
  Video,
  Globe,
  FileText,
  Code2,
  Sparkles,
  Star,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoryNode } from "@/actions/categories";
import type { ResourceItem } from "@/actions/resources";
import type {
  ResourceType,
  ResourceStatus,
} from "@/lib/validations/resource";
import { cn } from "@/lib/utils";

export interface ResourceFormData {
  id?: string;
  title: string;
  url?: string | null;
  type: ResourceType;
  status: ResourceStatus;
  categoryId?: string | null;
  author?: string | null;
  rating?: number | null;
  estimatedMinutes?: number | null;
  actualMinutes?: number;
  isFavorite?: boolean;
  summary?: string | null;
  notes?: string | null;
  tagNames?: string[];
}

interface ResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryNode[];
  initialResource?: ResourceItem | null;
  defaultCategoryId?: string | null;
  defaultType?: ResourceType;
  onSubmit: (data: ResourceFormData) => Promise<{ ok: boolean; error?: string }>;
}

const TYPE_OPTIONS: { type: ResourceType; label: string; icon: React.ElementType; color: string }[] = [
  { type: "BOOK", label: "Book", icon: BookOpen, color: "text-amber-500" },
  { type: "VIDEO", label: "Video / Reel", icon: Video, color: "text-rose-500" },
  { type: "OTHER", label: "Website / Link", icon: Globe, color: "text-cyan-500" },
  { type: "PAPER", label: "Paper / Article", icon: FileText, color: "text-purple" },
  { type: "DOCUMENTATION", label: "Documentation", icon: Code2, color: "text-emerald-500" },
];

export function ResourceDialog({
  isOpen,
  onClose,
  categories,
  initialResource,
  defaultCategoryId,
  defaultType,
  onSubmit,
}: ResourceDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl max-h-[90vh] rounded-3xl border border-border/80 bg-card shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <ResourceFormInner
          key={initialResource?.id || defaultCategoryId || "new"}
          onClose={onClose}
          categories={categories}
          initialResource={initialResource}
          defaultCategoryId={defaultCategoryId}
          defaultType={defaultType}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}

function ResourceFormInner({
  onClose,
  categories,
  initialResource,
  defaultCategoryId,
  defaultType,
  onSubmit,
}: {
  onClose: () => void;
  categories: CategoryNode[];
  initialResource?: ResourceItem | null;
  defaultCategoryId?: string | null;
  defaultType?: ResourceType;
  onSubmit: (data: ResourceFormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const isEditing = !!initialResource;

  const [title, setTitle] = React.useState(initialResource?.title || "");
  const [url, setUrl] = React.useState(initialResource?.url || "");
  const [type, setType] = React.useState<ResourceType>(
    initialResource?.type || defaultType || "ARTICLE"
  );
  const [status, setStatus] = React.useState<ResourceStatus>(
    initialResource?.status || "BACKLOG"
  );
  const [categoryId, setCategoryId] = React.useState<string | null>(
    initialResource?.category?.id || defaultCategoryId || null
  );
  const [author, setAuthor] = React.useState(initialResource?.author || "");
  const [estimatedMinutes, setEstimatedMinutes] = React.useState<string>(
    initialResource?.estimatedMinutes ? String(initialResource.estimatedMinutes) : ""
  );
  const [isFavorite, setIsFavorite] = React.useState(
    initialResource?.isFavorite || false
  );
  const [notes, setNotes] = React.useState(initialResource?.notes || "");

  const [detectedBadge, setDetectedBadge] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Smart URL Type Auto-Detection
  const handleUrlChange = (value: string) => {
    setUrl(value);
    const lower = value.toLowerCase().trim();

    if (!isEditing && lower) {
      if (
        lower.includes("instagram.com/reel") ||
        lower.includes("instagram.com/p/") ||
        lower.includes("tiktok.com/")
      ) {
        setType("VIDEO");
        setDetectedBadge("Detected Instagram / Short Video");
      } else if (
        lower.includes("youtube.com/") ||
        lower.includes("youtu.be/") ||
        lower.includes("vimeo.com/") ||
        lower.includes("loom.com/")
      ) {
        setType("VIDEO");
        setDetectedBadge("Detected Video");
      } else if (
        lower.includes("arxiv.org") ||
        lower.includes(".pdf") ||
        lower.includes("biorxiv.org") ||
        lower.includes("sciencedirect.com")
      ) {
        setType("PAPER");
        setDetectedBadge("Detected Research Paper / PDF");
      } else if (
        lower.includes("github.com") ||
        lower.includes("docs.") ||
        lower.includes("gitbook.io") ||
        lower.includes("developer.mozilla.org") ||
        lower.includes("nextjs.org/docs")
      ) {
        setType("DOCUMENTATION");
        setDetectedBadge("Detected Documentation");
      } else if (
        lower.includes("amazon.com") ||
        lower.includes("goodreads.com")
      ) {
        setType("BOOK");
        setDetectedBadge("Detected Book");
      } else if (lower.startsWith("http://") || lower.startsWith("https://")) {
        setType("OTHER");
        setDetectedBadge("Detected Website Link");
      } else {
        setDetectedBadge(null);
      }
    } else {
      setDetectedBadge(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const parsedEstimated = estimatedMinutes ? parseInt(estimatedMinutes, 10) : null;
      const res = await onSubmit({
        id: initialResource?.id,
        title: title.trim(),
        url: url.trim() || null,
        type,
        status,
        categoryId: categoryId || null,
        author: author.trim() || null,
        estimatedMinutes: parsedEstimated && !isNaN(parsedEstimated) ? parsedEstimated : null,
        isFavorite,
        notes: notes.trim() || null,
      });

      if (res.ok) {
        onClose();
      } else {
        setError(res.error || "Failed to save resource");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border/60 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {isEditing ? "Edit Resource" : "Add Resource"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Save a link, video, reel, book, or paper into your collection
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
        {error && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* URL Input with Auto-detection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">
              Link / URL (Optional)
            </label>
            {detectedBadge && (
              <span className="text-[10px] font-medium text-accent bg-accent-tint px-2 py-0.5 rounded-full border border-accent/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {detectedBadge}
              </span>
            )}
          </div>
          <div className="relative">
            <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="url"
              placeholder="Paste Instagram reel, YouTube link, website, or article URL..."
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="pl-9 rounded-xl h-10 text-xs"
            />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Title *
          </label>
          <Input
            type="text"
            placeholder="e.g. Clean Architecture, 3Blue1Brown Neural Networks, Next.js Docs"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl h-10 text-xs"
            required
            autoFocus={!url}
          />
        </div>

        {/* Type Selector Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Type / Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = type === opt.type || (opt.type === "OTHER" && type === "ARTICLE");
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    setType(opt.type);
                    setDetectedBadge(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left",
                    isSelected
                      ? "bg-accent text-white border-accent shadow-xs font-semibold"
                      : "bg-muted/30 border-border/60 text-secondary hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", isSelected ? "text-white" : opt.color)} />
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Folder Collection */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Folder / Collection
          </label>
          <select
            value={categoryId || ""}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">-- No Folder (Unfiled) --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                📁 {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Author & Reading Time Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Author / Source
            </label>
            <Input
              type="text"
              placeholder="e.g. @creators, Martin Fowler"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="rounded-xl h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Estimated Time (mins)
            </label>
            <Input
              type="number"
              min="0"
              placeholder="e.g. 15"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="rounded-xl h-9 text-xs"
            />
          </div>
        </div>

        {/* Status Chips & Favorite */}
        <div className="flex items-center justify-between gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground block">
              Study Status
            </label>
            <div className="flex items-center gap-1.5">
              {[
                { key: "BACKLOG", label: "Backlog" },
                { key: "IN_PROGRESS", label: "Reading / In Progress" },
                { key: "COMPLETED", label: "Completed" },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setStatus(st.key as ResourceStatus)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all",
                    status === st.key
                      ? "bg-accent text-white border-accent font-semibold shadow-xs"
                      : "bg-muted/40 border-border/60 text-secondary hover:text-foreground"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shrink-0 mt-4",
              isFavorite
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                : "bg-muted/30 border-border/60 text-secondary hover:text-foreground"
            )}
          >
            <Star className={cn("w-3.5 h-3.5", isFavorite && "fill-amber-500")} />
            <span>Starred</span>
          </button>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Quick Notes / Summary
          </label>
          <textarea
            rows={2}
            placeholder="Key takeaways or ideas..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="rounded-xl text-xs font-semibold h-9 px-5 bg-primary text-primary-foreground shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Resource"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
