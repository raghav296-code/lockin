"use client";

import * as React from "react";
import {
  Clock,
  CheckSquare,
  Brain,
  BookOpen,
  Sparkles,
  TrendingUp,
  Download,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConsistencyHeatmap } from "./consistency-heatmap";
import { StudyVelocityChart } from "./study-velocity-chart";
import { SubjectDistribution } from "./subject-distribution";
import { ConceptMasteryFunnel } from "./concept-mastery-funnel";
import type { AnalyticsData } from "./analytics-types";

interface AnalyticsContainerProps {
  data: AnalyticsData;
}

export function AnalyticsContainer({ data }: AnalyticsContainerProps) {
  const { streak, totals, heatmapDays, velocity, subjectDistribution, conceptMastery } = data;

  const handleExportData = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lockin-analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 4 Primary Apple HIG Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Focus Hours */}
        <div className="rounded-[18px] border border-border/80 bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-secondary">
              Total focus time
            </span>
            <div className="w-7 h-7 rounded-lg bg-accent-tint text-accent flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {totals.totalFocusHours}
            </span>
            <span className="text-[13px] font-medium text-secondary">hours</span>
          </div>
          <p className="text-[11.5px] text-muted">
            Across Pomodoro & Deep Work
          </p>
        </div>

        {/* Tasks Completed */}
        <div className="rounded-[18px] border border-border/80 bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-secondary">
              Tasks completed
            </span>
            <div className="w-7 h-7 rounded-lg bg-success-tint text-success flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-success">
              {totals.totalTasksCompleted}
            </span>
            <span className="text-[13px] font-medium text-secondary">tasks</span>
          </div>
          <p className="text-[11.5px] text-muted">
            Time-blocked calendar items
          </p>
        </div>

        {/* Mastered Concepts */}
        <div className="rounded-[18px] border border-border/80 bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-secondary">
              Mastered concepts
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-tint text-purple flex items-center justify-center">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-purple">
              {totals.totalConceptsMastered}
            </span>
            <span className="text-[13px] font-medium text-secondary">of {conceptMastery.total}</span>
          </div>
          <p className="text-[11.5px] text-muted">
            Knowledge graph nodes
          </p>
        </div>

        {/* Completed Resources */}
        <div className="rounded-[18px] border border-border/80 bg-surface shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.2)] p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-secondary">
              Resources read
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-amber-500">
              {totals.totalResourcesRead}
            </span>
            <span className="text-[13px] font-medium text-secondary">items</span>
          </div>
          <p className="text-[11.5px] text-muted">
            Papers, books, & courses
          </p>
        </div>
      </div>

      {/* 365-Day Consistency Heatmap */}
      <ConsistencyHeatmap
        days={heatmapDays}
        currentStreak={streak.currentStreak}
        longestStreak={streak.longestStreak}
        activeDaysPastYear={streak.activeDaysPastYear}
      />

      {/* 90-Day Learning Velocity & Focus Chart */}
      <StudyVelocityChart velocity={velocity} />

      {/* 2-Column Grid: Subject Breakdown & Concept Mastery Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <SubjectDistribution distribution={subjectDistribution} />
        <ConceptMasteryFunnel mastery={conceptMastery} />
      </div>

      {/* Export & Action Footer */}
      <div className="rounded-[16px] border border-border/60 bg-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-2 text-secondary">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>Analytics updated in real-time on every study session and task completion.</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 rounded-lg text-[12px] font-medium flex items-center gap-1.5 shrink-0"
          onClick={handleExportData}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export analytics JSON</span>
        </Button>
      </div>
    </div>
  );
}
