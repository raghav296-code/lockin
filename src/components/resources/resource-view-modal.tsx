"use client";

import * as React from "react";
import {
  X,
  ExternalLink,
  Star,
  Edit2,
  Trash2,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResourceItem } from "@/actions/resources";
import type { ResourceStatus } from "@/lib/validations/resource";
import {
  RESOURCE_TYPES,
  RESOURCE_STATUSES,
  formatMinutes,
} from "./resource-types";

interface ResourceViewModalProps {
  resource: ResourceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (resource: ResourceItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ResourceStatus) => void;
  onToggleFavorite: (id: string) => void;
}

function getCategoryCrumbs(category: ResourceItem["category"]) {
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

export function ResourceViewModal({
  resource,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleFavorite,
}: ResourceViewModalProps) {
  if (!isOpen || !resource) return null;

  const categoryCrumbs = getCategoryCrumbs(resource.category);
  const typeConfig = RESOURCE_TYPES[resource.type] || RESOURCE_TYPES.OTHER;
  const TypeIcon = typeConfig.icon;
  const statusConfig =
    RESOURCE_STATUSES[resource.status] || RESOURCE_STATUSES.BACKLOG;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-[24px] border border-border bg-surface shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[12px] font-semibold border",
                typeConfig.bg
              )}
            >
              <TypeIcon className="w-3.5 h-3.5" />
              <span>{typeConfig.label}</span>
            </span>

            {/* Status Select */}
            <select
              value={resource.status}
              onChange={(e) =>
                onStatusChange(resource.id, e.target.value as ResourceStatus)
              }
              className={cn(
                "text-[12px] font-semibold px-3 py-1 rounded-xl border appearance-none pr-6 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                statusConfig.badgeClass
              )}
            >
              <option value="BACKLOG">Backlog</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(resource.id)}
              className={cn(
                "p-2 rounded-xl transition-colors cursor-pointer",
                resource.isFavorite
                  ? "text-amber-500 bg-amber-500/10"
                  : "text-muted hover:text-foreground hover:bg-muted-bg"
              )}
              title={
                resource.isFavorite
                  ? "Remove from favorites"
                  : "Add to favorites"
              }
              aria-label="Toggle favorite"
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  resource.isFavorite && "fill-amber-500 stroke-amber-500"
                )}
              />
            </button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(resource);
              }}
              className="h-9 px-3 rounded-xl gap-1.5 text-[13px]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Category Breadcrumbs */}
          {categoryCrumbs && (
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-secondary">
              {categoryCrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-muted shrink-0" />
                  )}
                  <span className="truncate">{crumb}</span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* YouTube / Media Preview in Modal */}
          {resource.url && resource.url.includes("youtube.com") && (
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-black/40 border border-border/60 shadow-md">
              <img
                src={`https://img.youtube.com/vi/${
                  resource.url.split("v=")[1]?.split("&")[0] ||
                  resource.url.split("youtu.be/")[1]?.split("?")[0] ||
                  ""
                }/hqdefault.jpg`}
                alt={resource.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <ExternalLink className="w-5 h-5 ml-0.5" />
                </a>
              </div>
            </div>
          )}

          {/* Master Headline */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-snug">
              {resource.title}
            </h1>
            {resource.author && (
              <p className="text-[14px] text-secondary font-medium">
                By {resource.author}
              </p>
            )}
          </div>

          {/* Summary Callout Banner */}
          {resource.summary && (
            <div className="p-4 rounded-2xl bg-accent-tint/60 border border-accent/15 text-[14px] text-foreground leading-relaxed">
              <p className="font-semibold text-[12px] text-accent uppercase tracking-wider mb-1">
                Summary
              </p>
              <p>{resource.summary}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border border-border bg-muted-bg/30 text-[13px]">
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted uppercase font-semibold">
                Time Spent
              </span>
              <p className="font-medium text-foreground">
                {formatMinutes(resource.actualMinutes)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted uppercase font-semibold">
                Estimated
              </span>
              <p className="font-medium text-foreground">
                {formatMinutes(resource.estimatedMinutes)}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted uppercase font-semibold">
                Rating
              </span>
              <p className="font-medium text-amber-500">
                {resource.rating ? `★ ${resource.rating}.0 / 5.0` : "Not rated"}
              </p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-muted uppercase font-semibold">
                Created
              </span>
              <p className="font-medium text-foreground">
                {new Date(resource.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="space-y-2">
              <span className="text-[12px] font-semibold text-muted uppercase tracking-wider">
                Tags
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {resource.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-[12px] py-1 px-3 rounded-lg"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Study Notes View */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-foreground font-semibold text-[15px]">
              <BookOpen className="w-4 h-4 text-accent" />
              <span>Study Notes & Takeaways</span>
            </div>

            {resource.notes ? (
              <div className="p-5 rounded-2xl border border-border bg-surface text-[14px] leading-relaxed text-foreground whitespace-pre-wrap font-sans">
                {resource.notes}
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-border bg-muted-bg/20 text-center space-y-2">
                <p className="text-[14px] text-muted">
                  No structured study notes added yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onEdit(resource);
                  }}
                  className="rounded-xl text-[12px]"
                >
                  Add Study Notes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-surface/80 backdrop-blur-md flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(resource.id);
            }}
            className="flex items-center gap-1.5 text-[13px] text-danger hover:underline cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete resource</span>
          </button>

          <div className="flex items-center gap-3">
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-[13px] hover:opacity-90 shadow-sm"
              >
                <span>Open Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
