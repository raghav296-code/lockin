import * as React from "react";
import {
  Brain,
  Sparkles,
  Award,
  Crown,
} from "lucide-react";
import type {
  MasteryLevel,
  ConceptRelationType,
  ConceptImportance,
} from "@/lib/validations/concept";

export interface MasteryConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  ringColor: string;
  dotColor: string;
  description: string;
}

export const MASTERY_LEVELS: Record<MasteryLevel, MasteryConfig> = {
  NOVICE: {
    label: "Novice",
    icon: Brain,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    border: "border-blue-500/25",
    ringColor: "#007AFF",
    dotColor: "bg-blue-500",
    description: "Just started learning this concept.",
  },
  FAMILIAR: {
    label: "Familiar",
    icon: Sparkles,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
    border: "border-purple-500/25",
    ringColor: "#AF52DE",
    dotColor: "bg-purple-500",
    description: "Understand the core principles and syntax.",
  },
  PROFICIENT: {
    label: "Proficient",
    icon: Award,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-500/25",
    ringColor: "#34C759",
    dotColor: "bg-emerald-500",
    description: "Can apply knowledge in complex scenarios.",
  },
  MASTERED: {
    label: "Mastered",
    icon: Crown,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    border: "border-amber-500/25",
    ringColor: "#FF9500",
    dotColor: "bg-amber-500",
    description: "Deep, intuitive mental model with zero friction.",
  },
};

export interface ImportanceConfig {
  label: string;
  badgeClass: string;
}

export const IMPORTANCE_CONFIGS: Record<ConceptImportance, ImportanceConfig> = {
  LOW: {
    label: "Low",
    badgeClass: "bg-muted-bg text-secondary border-border",
  },
  MEDIUM: {
    label: "Medium",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  HIGH: {
    label: "High",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  CRITICAL: {
    label: "Critical",
    badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-semibold",
  },
};

export const RELATION_LABELS: Record<ConceptRelationType, { label: string; symbol: string }> = {
  PREREQUISITE_FOR: { label: "Prerequisite for", symbol: "→" },
  RELATED_TO: { label: "Related to", symbol: "↔" },
  PART_OF: { label: "Part of", symbol: "⊂" },
  EXTENDS: { label: "Extends", symbol: "⤅" },
};
