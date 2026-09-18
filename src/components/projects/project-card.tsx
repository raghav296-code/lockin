"use client";

import * as React from "react";
import {
  ExternalLink,
  Monitor,
  Edit,
  Trash2,
  Sparkles,
  FolderGit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProjectItem } from "@/components/skills/skill-types";

interface ProjectCardProps {
  project: ProjectItem;
  onPreview: (project: ProjectItem) => void;
  onEdit: (project: ProjectItem) => void;
  onDelete: (id: string, name: string) => void;
}

export function ProjectCard({
  project,
  onPreview,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const getStatusBadge = (status: ProjectItem["status"]) => {
    switch (status) {
      case "COMPLETED":
        return { label: "Completed", class: "bg-success-tint text-success" };
      case "IN_PROGRESS":
        return { label: "In progress", class: "bg-accent-tint text-accent" };
      case "PLANNING":
        return { label: "Planning", class: "bg-purple-tint text-purple" };
      case "ARCHIVED":
        return { label: "Archived", class: "bg-muted-bg text-secondary" };
      default:
        return { label: status, class: "bg-surface-secondary text-secondary" };
    }
  };

  const statusBadge = getStatusBadge(project.status);

  return (
    <div className="group relative rounded-[18px] border border-border/80 bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] p-5 flex flex-col justify-between transition-all duration-200 hover:border-border-hover">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-[10px] bg-accent-tint text-accent border border-accent/20 flex items-center justify-center shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-semibold text-foreground tracking-tight truncate">
                {project.name}
              </h3>
              <span
                className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md mt-0.5 ${statusBadge.class}`}
              >
                {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Edit / Delete actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-secondary hover:text-foreground"
              onClick={() => onEdit(project)}
              title="Edit project"
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg text-secondary hover:text-danger hover:bg-danger-tint/20"
              onClick={() => onDelete(project.id, project.name)}
              title="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-[13px] text-secondary leading-relaxed line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Linked Skills Chips */}
        {project.skills && project.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.skills.map((skill) => (
              <div
                key={skill.id}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-border/70 bg-surface-secondary text-[11.5px] font-medium text-secondary"
              >
                {skill.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={skill.iconUrl}
                    alt={skill.name}
                    className="w-3.5 h-3.5 object-contain"
                  />
                ) : (
                  <Sparkles className="w-2.5 h-2.5 text-accent" />
                )}
                <span>{skill.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer: Live Preview & External Links */}
      <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-2.5 rounded-lg border border-border bg-surface text-secondary hover:text-foreground text-[12px] font-medium flex items-center gap-1.5 transition-colors"
              title="View on GitHub"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          )}

          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-2.5 rounded-lg border border-border bg-surface text-secondary hover:text-foreground text-[12px] font-medium flex items-center gap-1.5 transition-colors"
              title="Open deployed live site"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live site</span>
            </a>
          )}
        </div>

        {/* Prominent In-App Live Preview Button */}
        {(project.url || project.repoUrl) && (
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-lg text-[12px] font-medium shadow-xs flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white"
            onClick={() => onPreview(project)}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Live preview</span>
          </Button>
        )}
      </div>
    </div>
  );
}
