"use client";

import * as React from "react";
import {
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  BookOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResourceItem } from "@/actions/resources";
import type { ResourceStatus } from "@/lib/validations/resource";
import {
  RESOURCE_TYPES,
  RESOURCE_STATUSES,
  formatMinutes,
} from "./resource-types";

interface ResourceTableProps {
  resources: ResourceItem[];
  onView: (resource: ResourceItem) => void;
  onEdit: (resource: ResourceItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ResourceStatus) => void;
  onToggleFavorite: (id: string) => void;
}

export function ResourceTable({
  resources,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  onToggleFavorite,
}: ResourceTableProps) {
  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[22px] border border-border bg-surface overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted-bg/60 text-[11px] font-semibold text-muted uppercase tracking-wider select-none">
              <th className="py-3.5 px-4 w-10"></th>
              <th className="py-3.5 px-4">Title & Breadcrumb</th>
              <th className="py-3.5 px-4">Type</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Time Spent</th>
              <th className="py-3.5 px-4">Tags</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {resources.map((resource) => {
              const typeConfig =
                RESOURCE_TYPES[resource.type] || RESOURCE_TYPES.OTHER;
              const TypeIcon = typeConfig.icon;
              const statusConfig =
                RESOURCE_STATUSES[resource.status] || RESOURCE_STATUSES.BACKLOG;

              // Build category hierarchy
              const categoryStr = resource.category
                ? [
                    resource.category.parent?.parent?.name,
                    resource.category.parent?.name,
                    resource.category.name,
                  ]
                    .filter(Boolean)
                    .join(" › ")
                : null;

              return (
                <tr
                  key={resource.id}
                  className="hover:bg-muted-bg/40 transition-colors group cursor-pointer"
                  onClick={() => onView(resource)}
                >
                  {/* Star Favorite Column */}
                  <td
                    className="py-3.5 px-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(resource.id);
                    }}
                  >
                    <button
                      type="button"
                      className={cn(
                        "p-1 rounded-lg transition-transform active:scale-90 cursor-pointer",
                        resource.isFavorite
                          ? "text-amber-500"
                          : "text-muted/40 hover:text-foreground"
                      )}
                      aria-label="Toggle favorite"
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          resource.isFavorite && "fill-amber-500 stroke-amber-500"
                        )}
                      />
                    </button>
                  </td>

                  {/* Title & Category */}
                  <td className="py-3.5 px-4 max-w-xs">
                    <div className="font-semibold text-[14px] text-foreground tracking-tight truncate group-hover:text-accent transition-colors">
                      {resource.title}
                    </div>
                    {categoryStr && (
                      <div className="text-[11px] text-secondary font-medium truncate mt-0.5">
                        {categoryStr}
                      </div>
                    )}
                  </td>

                  {/* Type Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border shadow-2xs",
                        typeConfig.bg
                      )}
                    >
                      <TypeIcon className="w-3.5 h-3.5" />
                      <span>{typeConfig.label}</span>
                    </span>
                  </td>

                  {/* Status Dropdown */}
                  <td
                    className="py-3.5 px-4 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-flex items-center">
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full absolute left-2.5 pointer-events-none",
                          statusConfig.dotColor
                        )}
                      />
                      <select
                        value={resource.status}
                        onChange={(e) =>
                          onStatusChange(
                            resource.id,
                            e.target.value as ResourceStatus
                          )
                        }
                        className={cn(
                          "text-[11px] font-semibold pl-5 pr-5 py-1 rounded-lg border appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
                          statusConfig.badgeClass
                        )}
                        aria-label="Status selection"
                      >
                        <option value="BACKLOG">Backlog</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                  </td>

                  {/* Time Spent */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-secondary font-mono text-[12px]">
                    <span className="px-2 py-0.5 rounded-md bg-muted-bg font-semibold">
                      {formatMinutes(resource.actualMinutes)}
                    </span>
                    {resource.estimatedMinutes && (
                      <span className="text-muted text-[11px] ml-1">
                        / {formatMinutes(resource.estimatedMinutes)}
                      </span>
                    )}
                  </td>

                  {/* Tags */}
                  <td className="py-3.5 px-4 max-w-[180px]">
                    <div className="flex items-center gap-1 flex-wrap">
                      {resource.tags?.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="text-[10px] py-0.5 px-2 font-normal rounded-md bg-surface-secondary text-secondary border-border"
                        >
                          #{tag.name}
                        </Badge>
                      ))}
                      {(resource.tags?.length || 0) > 2 && (
                        <span className="text-[10px] text-muted font-medium">
                          +{(resource.tags?.length || 0) - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3.5 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-secondary hover:text-accent hover:bg-muted-bg transition-colors"
                          title="Open URL"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onView(resource)}
                        className="p-1.5 rounded-lg text-secondary hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
                        title="View notes"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(resource)}
                        className="p-1.5 rounded-lg text-secondary hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
                        title="Edit resource"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(resource.id)}
                        className="p-1.5 rounded-lg text-secondary hover:text-danger hover:bg-danger-tint transition-colors cursor-pointer"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
