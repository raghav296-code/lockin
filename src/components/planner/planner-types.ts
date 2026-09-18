import * as React from "react";
import {
  Timer,
  Zap,
  BookOpen,
  Brain,
} from "lucide-react";
import type {
  TaskPriority,
  SessionType,
} from "@/lib/validations/planner";

export type CalendarViewMode = "day" | "week" | "month" | "semester";

export interface PriorityConfig {
  label: string;
  badgeClass: string;
  dotColor: string;
}

export const PRIORITY_CONFIGS: Record<TaskPriority, PriorityConfig> = {
  LOW: {
    label: "Low",
    badgeClass: "bg-muted-bg text-secondary border-border",
    dotColor: "bg-secondary",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    dotColor: "bg-blue-500",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    dotColor: "bg-purple-500",
  },
  URGENT: {
    label: "Urgent",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-semibold",
    dotColor: "bg-rose-500 animate-pulse",
  },
};

export interface SessionTypeConfig {
  label: string;
  defaultMinutes: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  ringColor: string;
  description: string;
}

export const SESSION_TYPE_CONFIGS: Record<SessionType, SessionTypeConfig> = {
  POMODORO: {
    label: "Pomodoro Focus",
    defaultMinutes: 25,
    icon: Timer,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
    ringColor: "#FF3B30",
    description: "25 minutes of intense, single-task focus followed by a 5m break.",
  },
  DEEP_WORK: {
    label: "Deep Work Sprint",
    defaultMinutes: 50,
    icon: Zap,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25",
    ringColor: "#AF52DE",
    description: "50 minutes of deep creative & analytical problem-solving.",
  },
  REVIEW: {
    label: "Spaced Review",
    defaultMinutes: 15,
    icon: Brain,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
    ringColor: "#007AFF",
    description: "15 minutes active recall & concept reinforcement.",
  },
  QUICK_STUDY: {
    label: "Quick Study",
    defaultMinutes: 10,
    icon: BookOpen,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    ringColor: "#34C759",
    description: "10-minute micro-learning burst or reading checkpoint.",
  },
};

export function formatMinutesToHours(minutes: number): string {
  if (!minutes || minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Formats a Date or date string to local "YYYY-MM-DD" key safely without UTC timezone drift.
 */
export function toDateKey(dateInput: Date | string | number): string {
  if (!dateInput) return "";
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parses a "YYYY-MM-DD" string or Date object into a midday local Date to avoid timezone boundaries.
 */
export function parseLocalDate(dateInput: Date | string): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === "string" && dateInput.includes("-")) {
    const parts = dateInput.split("T")[0].split("-").map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
  }
  return new Date(dateInput);
}

