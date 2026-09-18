"use client";

import * as React from "react";
import { Flame, Trophy, Calendar, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { HeatmapDay } from "./analytics-types";

interface ConsistencyHeatmapProps {
  days: HeatmapDay[];
  currentStreak: number;
  longestStreak: number;
  activeDaysPastYear: number;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const INTENSITY_COLORS = [
  "bg-surface-secondary/60 border-border/40 hover:border-border", // 0 (empty)
  "bg-emerald-500/25 border-emerald-500/30 dark:bg-emerald-500/30", // 1 (light)
  "bg-emerald-500/50 border-emerald-500/50 dark:bg-emerald-500/55", // 2 (medium)
  "bg-emerald-500/75 border-emerald-500/80 dark:bg-emerald-500/80", // 3 (high)
  "bg-emerald-500 border-emerald-400 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,199,89,0.35)]", // 4 (max)
];

export function ConsistencyHeatmap({
  days,
  currentStreak,
  longestStreak,
  activeDaysPastYear,
}: ConsistencyHeatmapProps) {
  const [hoveredDay, setHoveredDay] = React.useState<HeatmapDay | null>(null);

  // Group into 53 weeks of 7 days
  const weeks = React.useMemo(() => {
    const result: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    for (let i = 0; i < days.length; i++) {
      currentWeek.push(days[i]);
      if (currentWeek.length === 7 || i === days.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    return result;
  }, [days]);

  return (
    <div className="rounded-[20px] border border-border/80 bg-surface shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)] p-5 sm:p-6 space-y-5">
      {/* Header with Streak Badges */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-semibold text-foreground tracking-tight">
              Study Consistency & Activity Matrix
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              365 Days
            </span>
          </div>
          <p className="text-[13px] text-secondary mt-0.5">
            Daily focus blocks, tasks completed, and knowledge graph iterations
          </p>
        </div>

        {/* Streak Stats (Apple HIG Inset Chips) */}
        <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Current Streak */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <Flame className="w-4 h-4 fill-current animate-pulse" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                Streak
              </span>
              <span className="text-[14px] font-bold leading-none">
                {currentStreak} {currentStreak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 shrink-0">
            <Trophy className="w-4 h-4" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                Best
              </span>
              <span className="text-[14px] font-bold leading-none">
                {longestStreak} {longestStreak === 1 ? "day" : "days"}
              </span>
            </div>
          </div>

          {/* Active Days */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-accent-tint border border-accent/20 text-accent shrink-0">
            <Calendar className="w-4 h-4" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-80">
                Active
              </span>
              <span className="text-[14px] font-bold leading-none">
                {activeDaysPastYear} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Viewport */}
      <div className="relative overflow-x-auto pb-2">
        {/* Month Headers */}
        <div className="flex text-[11px] text-muted font-medium mb-2 pl-7 min-w-[760px] justify-between pr-4">
          {MONTHS.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>

        <div className="flex gap-1.5 min-w-[760px]">
          {/* Day of Week Labels (Mon, Wed, Fri) */}
          <div className="flex flex-col justify-between text-[10px] text-muted font-medium pr-1.5 py-0.5 select-none h-[96px]">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>

          {/* 53 Columns of Weeks */}
          <div className="flex gap-[3.5px] flex-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[3.5px]">
                {week.map((day) => {
                  const isHovered = hoveredDay?.date === day.date;
                  return (
                    <div
                      key={day.date}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`w-[11px] h-[11px] rounded-[2.5px] border transition-all duration-150 cursor-pointer ${
                        INTENSITY_COLORS[day.level]
                      } ${isHovered ? "scale-125 z-20 border-foreground shadow-sm" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: Live Hovered Tooltip & Intensity Legend */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/60 text-[12px]">
        {/* Dynamic Tooltip Bar */}
        <div className="min-h-[22px] flex items-center gap-2">
          {hoveredDay ? (
            <div className="inline-flex items-center gap-2 text-foreground font-medium animate-in fade-in duration-150">
              <span className="font-semibold text-accent">
                {format(parseISO(hoveredDay.date), "EEEE, MMMM d, yyyy")}
              </span>
              <span className="text-muted">•</span>
              <span>
                {hoveredDay.focusMinutes > 0
                  ? `${hoveredDay.focusMinutes} focus mins`
                  : "No focus sessions"}
              </span>
              <span className="text-muted">•</span>
              <span className="text-secondary">
                {hoveredDay.count} {hoveredDay.count === 1 ? "activity" : "activities"}
              </span>
            </div>
          ) : (
            <span className="text-muted flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              Hover over any day square to see details
            </span>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-muted text-[11px] self-end sm:self-auto">
          <span>Less</span>
          {INTENSITY_COLORS.map((cls, idx) => (
            <div
              key={idx}
              className={`w-[10px] h-[10px] rounded-[2.5px] border ${cls}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
