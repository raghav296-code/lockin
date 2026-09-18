import * as React from "react";
import {
  FileText,
  Book,
  Video,
  GraduationCap,
  ScrollText,
  Code2,
  Bookmark,
  CheckCircle2,
  Clock,
  Inbox,
  Archive,
} from "lucide-react";
import type { ResourceType, ResourceStatus } from "@/lib/validations/resource";

export interface TypeConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  iconBg: string;
}

export const RESOURCE_TYPES: Record<ResourceType, TypeConfig> = {
  ARTICLE: {
    label: "Article",
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    iconBg: "bg-blue-500 text-white shadow-blue-500/20",
  },
  BOOK: {
    label: "Book",
    icon: Book,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    iconBg: "bg-amber-500 text-white shadow-amber-500/20",
  },
  VIDEO: {
    label: "Video",
    icon: Video,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    iconBg: "bg-rose-500 text-white shadow-rose-500/20",
  },
  COURSE: {
    label: "Course",
    icon: GraduationCap,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    iconBg: "bg-purple-500 text-white shadow-purple-500/20",
  },
  PAPER: {
    label: "Paper",
    icon: ScrollText,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    iconBg: "bg-emerald-500 text-white shadow-emerald-500/20",
  },
  DOCUMENTATION: {
    label: "Docs",
    icon: Code2,
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
    iconBg: "bg-cyan-500 text-white shadow-cyan-500/20",
  },
  OTHER: {
    label: "Resource",
    icon: Bookmark,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    iconBg: "bg-indigo-500 text-white shadow-indigo-500/20",
  },
};

export interface StatusConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  badgeClass: string;
  dotColor: string;
}

export const RESOURCE_STATUSES: Record<ResourceStatus, StatusConfig> = {
  BACKLOG: {
    label: "Backlog",
    icon: Inbox,
    color: "text-secondary",
    bg: "bg-muted-bg",
    badgeClass: "bg-muted-bg text-secondary border-border",
    dotColor: "bg-muted",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Clock,
    color: "text-accent",
    bg: "bg-accent-tint",
    badgeClass: "bg-accent-tint text-accent border-accent/25 font-semibold",
    dotColor: "bg-accent animate-pulse",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-success",
    bg: "bg-success-tint",
    badgeClass: "bg-success-tint text-success border-success/25 font-semibold",
    dotColor: "bg-success",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Archive,
    color: "text-muted",
    bg: "bg-muted-bg/50",
    badgeClass: "bg-muted-bg/50 text-muted border-border/50",
    dotColor: "bg-muted/60",
  },
};

export function formatMinutes(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
