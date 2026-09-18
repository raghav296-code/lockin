"use client";

import * as React from "react";
import {
  CheckCircle2,
  Target,
  Plus,
  Sparkles,
  CalendarDays,
  ListTodo,
} from "lucide-react";
import type { StudyTaskItem, SemesterPlanItem } from "@/actions/planner";
import { toDateKey } from "./planner-types";
import { Button } from "@/components/ui/button";

interface AppleActivityRingsProps {
  tasks: StudyTaskItem[];
  semesterPlans: SemesterPlanItem[];
  currentDate: Date;
  onNewTask: (date?: Date) => void;
  onNewSemester: () => void;
}

export function AppleActivityRings({
  tasks,
  semesterPlans,
  currentDate,
  onNewTask,
  onNewSemester,
}: AppleActivityRingsProps) {
  const selectedDateKey = toDateKey(currentDate);
  const todayKey = toDateKey(new Date());
  const isViewingToday = selectedDateKey === todayKey;

  // 1. Daily Tasks Progress
  const dayTasks = tasks.filter((t) => toDateKey(t.scheduledDate) === selectedDateKey);
  const completedDayTasks = dayTasks.filter((t) => t.status === "DONE");
  const totalDayCount = dayTasks.length > 0 ? dayTasks.length : tasks.length;
  const completedDayCount = dayTasks.length > 0 ? completedDayTasks.length : tasks.filter((t) => t.status === "DONE").length;
  const dayPercent = totalDayCount > 0 ? Math.min(100, Math.round((completedDayCount / totalDayCount) * 100)) : 0;

  // 2. Weekly Goals Progress (Tasks in current week)
  const curr = new Date(currentDate);
  const firstDayOfWeek = new Date(curr);
  firstDayOfWeek.setDate(curr.getDate() - curr.getDay());
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

  const startWeekKey = toDateKey(firstDayOfWeek);
  const endWeekKey = toDateKey(lastDayOfWeek);

  const weekTasks = tasks.filter((t) => {
    const k = toDateKey(t.scheduledDate);
    return k >= startWeekKey && k <= endWeekKey;
  });
  const completedWeekTasks = weekTasks.filter((t) => t.status === "DONE");
  const totalWeekCount = weekTasks.length > 0 ? weekTasks.length : tasks.length;
  const completedWeekCount = weekTasks.length > 0 ? completedWeekTasks.length : tasks.filter((t) => t.status === "DONE").length;
  const weekPercent = totalWeekCount > 0 ? Math.min(100, Math.round((completedWeekCount / totalWeekCount) * 100)) : 0;

  // 3. Monthly & Semester Milestones
  const currYear = currentDate.getFullYear();
  const currMonth = currentDate.getMonth();
  const monthTasks = tasks.filter((t) => {
    const d = new Date(t.scheduledDate);
    return d.getFullYear() === currYear && d.getMonth() === currMonth;
  });
  const completedMonthTasks = monthTasks.filter((t) => t.status === "DONE");
  const milestoneTasks = tasks.filter((t) => t.isExamOrMilestone);
  const completedMilestones = milestoneTasks.filter((t) => t.status === "DONE");

  const totalMilestoneCount = milestoneTasks.length > 0 ? milestoneTasks.length : monthTasks.length || 1;
  const completedMilestoneCount = milestoneTasks.length > 0 ? completedMilestones.length : completedMonthTasks.length;
  const milestonePercent = Math.min(100, Math.round((completedMilestoneCount / totalMilestoneCount) * 100));

  // Overall average
  const overallAverage = Math.round((dayPercent + weekPercent + milestonePercent) / 3);

  // SVG Concentric Rings with spacious radius to eliminate text overlap
  const ringSize = 150;
  const center = ringSize / 2;

  // Ring 1 (Outer - Daily: Pink/Red)
  const r1 = 58;
  const c1 = 2 * Math.PI * r1;
  const offset1 = c1 - (dayPercent / 100) * c1;

  // Ring 2 (Middle - Weekly: Lime)
  const r2 = 42;
  const c2 = 2 * Math.PI * r2;
  const offset2 = c2 - (weekPercent / 100) * c2;

  // Ring 3 (Inner - Monthly/Milestones: Cyan)
  const r3 = 26;
  const c3 = 2 * Math.PI * r3;
  const offset3 = c3 - (milestonePercent / 100) * c3;

  return (
    <div className="rounded-[24px] border border-border bg-surface/95 backdrop-blur-xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] space-y-4">
      {/* Top Banner Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent-tint text-accent flex items-center justify-center border border-accent/20">
            <Sparkles className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-[17px] font-bold text-foreground flex items-center gap-2">
              <span>Goal Progress &amp; Completion</span>
              {isViewingToday ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  Today
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted-bg text-secondary font-semibold font-mono">
                  {currentDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              )}
            </h2>
            <p className="text-[12px] text-secondary">
              Track daily tasks, weekly focus objectives, and semester milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => onNewTask(currentDate)}
            size="sm"
            className="rounded-xl text-[13px] font-semibold bg-accent hover:bg-accent-hover text-white shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
          <Button
            onClick={onNewSemester}
            variant="outline"
            size="sm"
            className="rounded-xl text-[13px] font-semibold border-border hover:bg-muted-bg text-secondary hover:text-foreground"
          >
            <CalendarDays className="w-4 h-4 mr-1 text-purple-500" />
            New Semester Plan
          </Button>
        </div>
      </div>

      {/* Main Bar & Rings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Concentric Apple Rings with No Overlap */}
        <div className="lg:col-span-4 flex items-center justify-center sm:justify-start gap-4 p-1">
          <div className="relative flex items-center justify-center shrink-0">
            <svg
              width={ringSize}
              height={ringSize}
              className="transform -rotate-90 filter drop-shadow-sm"
            >
              <defs>
                <linearGradient id="ringMoveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FA114F" />
                  <stop offset="100%" stopColor="#FF2D55" />
                </linearGradient>
                <linearGradient id="ringExerciseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#92E800" />
                  <stop offset="100%" stopColor="#30D158" />
                </linearGradient>
                <linearGradient id="ringStandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F0FF" />
                  <stop offset="100%" stopColor="#0A84FF" />
                </linearGradient>
              </defs>

              {/* Background Tracks */}
              <circle cx={center} cy={center} r={r1} fill="none" stroke="#FA114F" strokeWidth="10" strokeOpacity="0.16" />
              <circle cx={center} cy={center} r={r2} fill="none" stroke="#92E800" strokeWidth="10" strokeOpacity="0.16" />
              <circle cx={center} cy={center} r={r3} fill="none" stroke="#00F0FF" strokeWidth="10" strokeOpacity="0.16" />

              {/* Active Rings */}
              <circle
                cx={center}
                cy={center}
                r={r1}
                fill="none"
                stroke="url(#ringMoveGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={c1}
                strokeDashoffset={offset1}
                className="transition-all duration-700 ease-out"
              />
              <circle
                cx={center}
                cy={center}
                r={r2}
                fill="none"
                stroke="url(#ringExerciseGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={c2}
                strokeDashoffset={offset2}
                className="transition-all duration-700 ease-out"
              />
              <circle
                cx={center}
                cy={center}
                r={r3}
                fill="none"
                stroke="url(#ringStandGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={c3}
                strokeDashoffset={offset3}
                className="transition-all duration-700 ease-out"
              />
            </svg>

            {/* Clean Center Percentage (No overlapping text, perfectly sized) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[13px] font-bold tracking-tight text-foreground font-mono leading-none">
                {overallAverage}%
              </span>
            </div>
          </div>

          <div className="space-y-2 text-[12px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FA114F] shrink-0" />
              <span className="text-secondary font-medium">Daily ({dayPercent}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] shrink-0" />
              <span className="text-secondary font-medium">Weekly ({weekPercent}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00F0FF] shrink-0" />
              <span className="text-secondary font-medium">Milestones ({milestonePercent}%)</span>
            </div>
          </div>
        </div>

        {/* Center & Right: 3 Progress Bars (Daily, Weekly, Milestones) */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Bar 1: Daily Tasks */}
          <div className="p-3.5 rounded-2xl border border-border bg-muted-bg/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
                <CheckCircle2 className="w-4 h-4 text-[#FA114F]" />
                <span>Daily Tasks</span>
              </div>
              <span className="text-[12px] font-mono font-bold text-[#FA114F]">
                {dayPercent}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted-bg overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FA114F] to-[#FF2D55] transition-all duration-500 ease-out"
                style={{ width: `${dayPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-secondary font-mono">
              <span>{completedDayCount} of {totalDayCount} completed</span>
              <span>{totalDayCount - completedDayCount} left</span>
            </div>
          </div>

          {/* Bar 2: Weekly Focus */}
          <div className="p-3.5 rounded-2xl border border-border bg-muted-bg/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
                <ListTodo className="w-4 h-4 text-[#30D158]" />
                <span>This Week</span>
              </div>
              <span className="text-[12px] font-mono font-bold text-[#30D158]">
                {weekPercent}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted-bg overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#92E800] to-[#30D158] transition-all duration-500 ease-out"
                style={{ width: `${weekPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-secondary font-mono">
              <span>{completedWeekCount} of {totalWeekCount} done</span>
              <span>{totalWeekCount - completedWeekCount} left</span>
            </div>
          </div>

          {/* Bar 3: Monthly & Milestones */}
          <div className="p-3.5 rounded-2xl border border-border bg-muted-bg/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-foreground">
                <Target className="w-4 h-4 text-[#00F0FF] dark:text-[#00F0FF]" />
                <span>Milestones</span>
              </div>
              <span className="text-[12px] font-mono font-bold text-[#0A84FF] dark:text-[#00F0FF]">
                {milestonePercent}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-muted-bg overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#00F0FF] to-[#0A84FF] transition-all duration-500 ease-out"
                style={{ width: `${milestonePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-secondary font-mono">
              <span>{completedMilestones.length} of {milestoneTasks.length || 0} exams</span>
              <span>{semesterPlans.length} active terms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
