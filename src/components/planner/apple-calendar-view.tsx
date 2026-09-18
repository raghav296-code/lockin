"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Plus,
  AlertCircle,
  Layers,
  BookOpen,
  Brain,
  ListTodo,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  StudyTaskItem,
  SemesterPlanItem,
} from "@/actions/planner";
import type { TaskStatus } from "@/lib/validations/planner";
import {
  PRIORITY_CONFIGS,
  toDateKey,
  type CalendarViewMode,
} from "./planner-types";

interface AppleCalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  tasks: StudyTaskItem[];
  semesterPlans: SemesterPlanItem[];
  onTaskToggle: (id: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: StudyTaskItem) => void;
  onDeleteTask: (id: string) => void;
  onNewTask: (date?: Date) => void;
  onNewSemester: () => void;
  onDeleteSemester: (id: string) => void;
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function AppleCalendarView({
  currentDate,
  onDateChange,
  viewMode,
  onViewModeChange,
  tasks,
  semesterPlans,
  onTaskToggle,
  onTaskClick,
  onDeleteTask,
  onNewTask,
  onNewSemester,
  onDeleteSemester,
}: AppleCalendarViewProps) {
  // Navigation helpers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    onDateChange(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    onDateChange(d);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  // Title string based on mode
  const formattedHeaderTitle = React.useMemo(() => {
    const monthName = MONTHS[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    if (viewMode === "day") {
      const dayName = DAYS_OF_WEEK[currentDate.getDay()];
      return `${dayName}, ${monthName} ${currentDate.getDate()}, ${year}`;
    }
    if (viewMode === "week") {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      return `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()} – ${
        MONTHS[endOfWeek.getMonth()]
      } ${endOfWeek.getDate()}, ${year}`;
    }
    return `${monthName} ${year}`;
  }, [currentDate, viewMode]);

  // Tasks mapped by Date key (YYYY-MM-DD)
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, StudyTaskItem[]>();
    for (const t of tasks) {
      const key = toDateKey(t.scheduledDate);
      if (key) {
        const list = map.get(key) || [];
        list.push(t);
        map.set(key, list);
      }
    }
    return map;
  }, [tasks]);

  // Active semester plan matching current date
  const activeSemester = semesterPlans.find((p) => {
    const s = new Date(p.startDate);
    const e = new Date(p.endDate);
    return currentDate >= s && currentDate <= e;
  });

  return (
    <div className="rounded-[24px] border border-border bg-surface shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Apple Calendar Top Control Bar */}
      <div className="p-4 sm:p-5 border-b border-border/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-muted-bg/30">
        {/* Date Title & Chevron Navigation */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-xl border border-border bg-surface text-secondary hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
              title="Previous"
              aria-label="Previous date"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1.5 rounded-xl border border-border bg-surface text-[12.5px] font-semibold text-secondary hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-xl border border-border bg-surface text-secondary hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
              title="Next"
              aria-label="Next date"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-[17px] sm:text-[19px] font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>{formattedHeaderTitle}</span>
            {activeSemester && (
              <span
                className="hidden lg:inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold text-white truncate max-w-[160px]"
                style={{ backgroundColor: activeSemester.color }}
              >
                {activeSemester.title}
              </span>
            )}
          </h2>
        </div>

        {/* View Mode Segmented Switcher & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between md:justify-end">
          {/* Apple Segmented View Mode Tabs */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-muted-bg/80 border border-border shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange("day")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer",
                viewMode === "day"
                  ? "bg-surface text-foreground shadow-xs font-semibold"
                  : "text-secondary hover:text-foreground"
              )}
            >
              Day
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("week")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer",
                viewMode === "week"
                  ? "bg-surface text-foreground shadow-xs font-semibold"
                  : "text-secondary hover:text-foreground"
              )}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("month")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer",
                viewMode === "month"
                  ? "bg-surface text-foreground shadow-xs font-semibold"
                  : "text-secondary hover:text-foreground"
              )}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("semester")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer flex items-center gap-1.5",
                viewMode === "semester"
                  ? "bg-surface text-foreground shadow-xs font-semibold"
                  : "text-secondary hover:text-foreground"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Semester</span>
            </button>
          </div>

          {/* Action CTAs */}
          {viewMode === "semester" ? (
            <Button
              onClick={onNewSemester}
              className="h-9 px-3.5 rounded-xl text-[12.5px] font-semibold bg-accent hover:bg-accent-hover text-white gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Semester</span>
            </Button>
          ) : (
            <Button
              onClick={() => onNewTask(currentDate)}
              className="h-9 px-3.5 rounded-xl text-[12.5px] font-semibold bg-accent hover:bg-accent-hover text-white gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* View Body */}
      <div className="flex-1 p-4 sm:p-6 min-h-[460px]">
        {/* 1. DAY VIEW */}
        {viewMode === "day" && (
          <DayTimelineView
            date={currentDate}
            tasks={tasks}
            onTaskToggle={onTaskToggle}
            onTaskClick={onTaskClick}
            onDeleteTask={onDeleteTask}
            onNewTask={onNewTask}
          />
        )}

        {/* 2. WEEK VIEW */}
        {viewMode === "week" && (
          <WeekGridView
            currentDate={currentDate}
            tasks={tasks}
            tasksByDate={tasksByDate}
            onDateSelect={onDateChange}
            onTaskToggle={onTaskToggle}
            onTaskClick={onTaskClick}
            onDeleteTask={onDeleteTask}
            onNewTask={onNewTask}
          />
        )}

        {/* 3. MONTH VIEW */}
        {viewMode === "month" && (
          <MonthCalendarView
            currentDate={currentDate}
            tasks={tasks}
            tasksByDate={tasksByDate}
            onDateSelect={(date) => {
              onDateChange(date);
              onViewModeChange("day");
            }}
            onTaskToggle={onTaskToggle}
            onTaskClick={onTaskClick}
            onDeleteTask={onDeleteTask}
            onNewTask={onNewTask}
          />
        )}

        {/* 4. SEMESTER / TERM ROADMAP VIEW */}
        {viewMode === "semester" && (
          <SemesterRoadmapView
            semesterPlans={semesterPlans}
            tasks={tasks}
            onNewSemester={onNewSemester}
            onDeleteSemester={onDeleteSemester}
            onTaskClick={onTaskClick}
            onNewTask={onNewTask}
          />
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SUB-VIEW: DAY VIEW (Focus Tasks & Daily Checklist)
// ----------------------------------------------------------------------------------
function DayTimelineView({
  date,
  tasks,
  onTaskToggle,
  onTaskClick,
  onDeleteTask,
  onNewTask,
}: {
  date: Date;
  tasks: StudyTaskItem[];
  onTaskToggle: (id: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: StudyTaskItem) => void;
  onDeleteTask: (id: string) => void;
  onNewTask: (date?: Date) => void;
}) {
  const targetDateKey = toDateKey(date);
  const daysTasks = tasks.filter((t) => toDateKey(t.scheduledDate) === targetDateKey);
  const completedCount = daysTasks.filter((t) => t.status === "DONE").length;
  const progressPercent = daysTasks.length > 0 ? Math.round((completedCount / daysTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Daily Progress Header */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-muted-bg/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-secondary">
              Today&apos;s Focus &amp; Tasks
            </span>
            <span className="text-[11px] font-mono px-2 py-0.2 rounded-md bg-[#FA114F]/10 text-[#FA114F] font-bold">
              {progressPercent}% Done
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {completedCount} of {daysTasks.length} Completed
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full sm:w-56 space-y-1.5">
          <div className="w-full h-3 rounded-full bg-muted-bg border border-border overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#FA114F] to-[#FF2D55] transition-all duration-500 rounded-full"
              style={{
                width: `${progressPercent}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-secondary font-mono">
            <span>{completedCount} Done</span>
            <span>{daysTasks.length - completedCount} Remaining</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      {daysTasks.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-surface/50 space-y-3 max-w-md mx-auto">
          <CalendarIcon className="w-10 h-10 text-muted mx-auto" />
          <h3 className="text-[15px] font-semibold text-foreground">
            No tasks scheduled for this day
          </h3>
          <p className="text-[12.5px] text-secondary">
            Plan your daily learning objectives and milestone reviews.
          </p>
          <Button
            onClick={() => onNewTask(date)}
            className="rounded-xl text-[12.5px] bg-accent hover:bg-accent-hover text-white font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add First Task
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {daysTasks.map((task) => {
            const priorityCfg =
              PRIORITY_CONFIGS[task.priority] || PRIORITY_CONFIGS.MEDIUM;
            const isDone = task.status === "DONE";
            const isInProgress = task.status === "IN_PROGRESS";

            return (
              <div
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={cn(
                  "p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 group cursor-pointer",
                  isDone
                    ? "border-emerald-500/30 bg-emerald-500/10 opacity-85"
                    : isInProgress
                    ? "border-amber-500/35 bg-amber-500/10 shadow-2xs"
                    : task.isExamOrMilestone
                    ? "border-rose-500/30 bg-rose-500/10"
                    : "border-border/80 bg-surface hover:border-accent/40 hover:shadow-xs"
                )}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    type="button"
                    title={isDone ? "Mark as TODO" : "Mark as DONE"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskToggle(task.id, isDone ? "TODO" : "DONE");
                    }}
                    className="shrink-0 p-1 text-secondary hover:text-accent transition-transform active:scale-90 cursor-pointer"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted hover:text-[#FA114F]" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "font-semibold text-[14.5px] tracking-tight truncate",
                          isDone
                            ? "line-through text-emerald-700 dark:text-emerald-300"
                            : isInProgress
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      {isInProgress && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-[10.5px]">
                          In Progress
                        </span>
                      )}
                      {task.isExamOrMilestone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold text-[10.5px]">
                          <AlertCircle className="w-3 h-3" />
                          <span>Exam / Milestone</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-[11.5px] text-secondary flex-wrap">
                      {task.resource && (
                        <span className="truncate max-w-[180px] text-accent flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{task.resource.title}</span>
                        </span>
                      )}
                      {task.concept && (
                        <span className="truncate max-w-[180px] text-purple-600 dark:text-purple-400 flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          <span>{task.concept.title}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Priority Pill & Delete Action */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-medium border",
                      priorityCfg.badgeClass
                    )}
                  >
                    {priorityCfg.label}
                  </span>

                  <button
                    type="button"
                    title="Delete task"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete task "${task.title}"?`)) {
                        onDeleteTask(task.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-muted hover:text-danger hover:bg-danger-tint transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SUB-VIEW: 7-DAY APPLE WEEK VIEW (Weekly Focus Panel + 7 Days)
// ----------------------------------------------------------------------------------
function WeekGridView({
  currentDate,
  tasks,
  tasksByDate,
  onDateSelect,
  onTaskToggle,
  onTaskClick,
  onDeleteTask,
  onNewTask,
}: {
  currentDate: Date;
  tasks: StudyTaskItem[];
  tasksByDate: Map<string, StudyTaskItem[]>;
  onDateSelect: (date: Date) => void;
  onTaskToggle: (id: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: StudyTaskItem) => void;
  onDeleteTask: (id: string) => void;
  onNewTask: (date?: Date) => void;
}) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  const startWeekKey = toDateKey(days[0]);
  const endWeekKey = toDateKey(days[6]);
  const weekTasks = tasks.filter((t) => {
    const k = toDateKey(t.scheduledDate);
    return k >= startWeekKey && k <= endWeekKey;
  });
  const completedWeekTasks = weekTasks.filter((t) => t.status === "DONE");
  const weekPercent = weekTasks.length > 0 ? Math.round((completedWeekTasks.length / weekTasks.length) * 100) : 0;

  const todayKey = toDateKey(new Date());

  return (
    <div className="space-y-6">
      {/* This Week's Focus Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-muted-bg/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[#30D158]" />
            <h3 className="text-[15px] font-bold text-foreground">
              This Week&apos;s Focus &amp; Objectives
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.2 rounded-md bg-[#30D158]/10 text-[#30D158] font-bold">
              {weekPercent}% Done
            </span>
          </div>
          <p className="text-[12px] text-secondary">
            {completedWeekTasks.length} of {weekTasks.length} objectives completed this week
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onNewTask(currentDate)}
            className="rounded-xl text-[12.5px] font-semibold bg-accent hover:bg-accent-hover text-white shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Week Goal
          </Button>
        </div>
      </div>

      {/* 7 Columns Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
        {days.map((day) => {
          const dateKey = toDateKey(day);
          const isToday = dateKey === todayKey;
          const dayTasks = tasksByDate.get(dateKey) || [];
          const completedDayTasks = dayTasks.filter((t) => t.status === "DONE");

          return (
            <div
              key={dateKey}
              className={cn(
                "rounded-2xl border p-3 flex flex-col justify-between min-h-[340px] transition-all bg-surface",
                isToday
                  ? "border-accent/40 bg-accent/5 shadow-xs"
                  : "border-border hover:border-border-hover"
              )}
            >
              {/* Header: Day & Date Badge */}
              <div className="space-y-1.5 pb-2 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase text-secondary">
                    {DAYS_OF_WEEK[day.getDay()]}
                  </span>
                  <button
                    type="button"
                    onClick={() => onDateSelect(day)}
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold cursor-pointer transition-transform active:scale-90",
                      isToday
                        ? "bg-red-500 text-white shadow-xs"
                        : "text-foreground hover:bg-muted-bg"
                    )}
                  >
                    {day.getDate()}
                  </button>
                </div>
                {dayTasks.length > 0 && (
                  <div className="text-[10.5px] text-secondary font-mono">
                    {completedDayTasks.length}/{dayTasks.length} done
                  </div>
                )}
              </div>

              {/* Task Pills in Column */}
              <div className="flex-1 overflow-y-auto py-2 space-y-1.5">
                {dayTasks.map((t) => {
                  const isDone = t.status === "DONE";
                  const isInProgress = t.status === "IN_PROGRESS";

                  return (
                    <div
                      key={t.id}
                      onClick={() => onTaskClick(t)}
                      className={cn(
                        "p-2 rounded-xl text-[11.5px] border cursor-pointer transition-all space-y-1 group",
                        isDone
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 line-through opacity-85"
                          : isInProgress
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
                          : t.isExamOrMilestone
                          ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold"
                          : "border-border bg-surface hover:border-accent/40 text-foreground"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="truncate font-semibold">{t.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTaskToggle(t.id, isDone ? "TODO" : "DONE");
                            }}
                            className="p-0.5 text-secondary hover:text-accent cursor-pointer"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-muted group-hover:text-foreground" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Delete task"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Delete "${t.title}"?`)) {
                                onDeleteTask(t.id);
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-danger cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add at bottom of column */}
              <div className="pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => onNewTask(day)}
                  className="w-full py-1 text-center rounded-lg text-[11.5px] font-medium text-muted hover:text-accent hover:bg-muted-bg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SUB-VIEW: APPLE MONTH CALENDAR (Monthly Objectives Panel + 7x5 Grid)
// ----------------------------------------------------------------------------------
function MonthCalendarView({
  currentDate,
  tasks,
  tasksByDate,
  onDateSelect,
  onTaskToggle,
  onTaskClick,
  onDeleteTask,
  onNewTask,
}: {
  currentDate: Date;
  tasks: StudyTaskItem[];
  tasksByDate: Map<string, StudyTaskItem[]>;
  onDateSelect: (date: Date) => void;
  onTaskToggle: (id: string, newStatus: TaskStatus) => void;
  onTaskClick: (task: StudyTaskItem) => void;
  onDeleteTask: (id: string) => void;
  onNewTask: (date?: Date) => void;
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const todayKey = toDateKey(new Date());

  // Filter tasks belonging to current month
  const monthTasks = tasks.filter((t) => {
    const d = new Date(t.scheduledDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const completedMonthTasks = monthTasks.filter((t) => t.status === "DONE");
  const monthPercent = monthTasks.length > 0 ? Math.round((completedMonthTasks.length / monthTasks.length) * 100) : 0;

  // Grid cells (including padding from previous month)
  const daysArray = [];
  for (let i = 0; i < startOffset; i++) {
    const prevD = new Date(year, month, -startOffset + i + 1);
    daysArray.push({ date: prevD, isCurrentMonth: false });
  }
  for (let i = 1; i <= totalDays; i++) {
    daysArray.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }

  return (
    <div className="space-y-6">
      {/* Month Focus & Objectives Bar */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-muted-bg/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[#00F0FF] dark:text-[#00F0FF]" />
            <h3 className="text-[15px] font-bold text-foreground">
              {MONTHS[month]} {year} Focus &amp; Objectives
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.2 rounded-md bg-accent/10 text-accent font-bold">
              {monthPercent}% Completed
            </span>
          </div>
          <p className="text-[12px] text-secondary">
            {completedMonthTasks.length} of {monthTasks.length} goals achieved for {MONTHS[month]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => onNewTask(currentDate)}
            className="rounded-xl text-[12.5px] font-semibold bg-accent hover:bg-accent-hover text-white shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Month Goal
          </Button>
        </div>
      </div>

      {/* Month Layout: Objectives List on Left/Sidebar + Calendar Grid on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: This Month's Goals Checklist (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <h4 className="text-[13.5px] font-bold text-foreground">
              {MONTHS[month]} Goal Checklist
            </h4>
            <span className="text-[11px] font-mono text-secondary">
              {monthTasks.length} Goals
            </span>
          </div>

          {monthTasks.length === 0 ? (
            <div className="p-6 text-center text-[12.5px] text-secondary space-y-2">
              <p>No goals added for {MONTHS[month]} yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNewTask(currentDate)}
                className="rounded-xl text-[11.5px]"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Objective
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
              {monthTasks.map((t) => {
                const isDone = t.status === "DONE";
                const isInProgress = t.status === "IN_PROGRESS";

                return (
                  <div
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className={cn(
                      "p-2.5 rounded-xl border text-[12.5px] flex items-center justify-between gap-2 transition-all cursor-pointer group",
                      isDone
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 line-through opacity-85"
                        : isInProgress
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
                        : t.isExamOrMilestone
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 font-semibold"
                        : "border-border bg-muted-bg/20 text-foreground hover:border-accent/40"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskToggle(t.id, isDone ? "TODO" : "DONE");
                        }}
                        className="shrink-0 p-0.5 text-secondary hover:text-accent cursor-pointer"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted group-hover:text-foreground" />
                        )}
                      </button>
                      <span className="truncate">{t.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-mono text-secondary">
                        {new Date(t.scheduledDate).getDate()} {MONTHS[month].slice(0, 3)}
                      </span>
                      <button
                        type="button"
                        title="Delete task"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete "${t.title}"?`)) {
                            onDeleteTask(t.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-danger cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: 7x5 Days Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 space-y-2">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 text-center pb-2 border-b border-border/80">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[12px] font-semibold text-secondary">
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {daysArray.map(({ date, isCurrentMonth }, idx) => {
              const dateKey = toDateKey(date);
              const isToday = dateKey === todayKey;
              const cellTasks = tasksByDate.get(dateKey) || [];

              return (
                <div
                  key={idx}
                  onClick={() => onDateSelect(date)}
                  className={cn(
                    "rounded-2xl border p-2 min-h-[88px] flex flex-col justify-between transition-all cursor-pointer group",
                    isCurrentMonth
                      ? isToday
                        ? "border-accent/40 bg-accent/5"
                        : "border-border bg-surface hover:border-border-hover hover:shadow-xs"
                      : "border-transparent bg-muted-bg/20 opacity-40"
                  )}
                >
                  {/* Day Number & Quick Add */}
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold",
                        isToday
                          ? "bg-red-500 text-white shadow-xs"
                          : "text-foreground"
                      )}
                    >
                      {date.getDate()}
                    </span>
                    <div className="flex items-center gap-1">
                      {cellTasks.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted-bg text-secondary font-mono">
                          {cellTasks.length}
                        </span>
                      )}
                      <button
                        type="button"
                        title="Add task on this day"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNewTask(date);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-accent/10 text-muted hover:text-accent transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Task Mini Pills */}
                  <div className="space-y-1 overflow-hidden">
                    {cellTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(t);
                        }}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] truncate font-medium",
                          t.status === "DONE"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 line-through"
                            : t.status === "IN_PROGRESS"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                            : t.isExamOrMilestone
                            ? "bg-rose-500 text-white"
                            : "bg-accent-tint text-accent"
                        )}
                      >
                        {t.title}
                      </div>
                    ))}
                    {cellTasks.length > 2 && (
                      <span className="text-[9.5px] text-muted block pl-1">
                        +{cellTasks.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// SUB-VIEW: SEMESTER & ACADEMIC TERM ROADMAP
// ----------------------------------------------------------------------------------
function SemesterRoadmapView({
  semesterPlans,
  tasks,
  onNewSemester,
  onDeleteSemester,
  onTaskClick,
  onNewTask,
}: {
  semesterPlans: SemesterPlanItem[];
  tasks: StudyTaskItem[];
  onNewSemester: () => void;
  onDeleteSemester: (id: string) => void;
  onTaskClick: (task: StudyTaskItem) => void;
  onNewTask: (date?: Date) => void;
}) {
  if (semesterPlans.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-surface/50 space-y-3 max-w-md mx-auto">
        <Layers className="w-10 h-10 text-muted mx-auto" />
        <h3 className="text-[16px] font-semibold text-foreground">
          No semester or academic term plans created
        </h3>
        <p className="text-[13px] text-secondary leading-relaxed">
          Create long-range semester roadmaps to plan courses and track exam milestones.
        </p>
        <Button
          onClick={onNewSemester}
          className="rounded-xl text-[13px] bg-accent hover:bg-accent-hover text-white font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Semester Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {semesterPlans.map((plan) => {
          const startDate = new Date(plan.startDate);
          const endDate = new Date(plan.endDate);
          const planTasks = tasks.filter((t) => t.semesterPlanId === plan.id);
          const completedPlanTasks = planTasks.filter((t) => t.status === "DONE");
          const examTasks = planTasks.filter((t) => t.isExamOrMilestone);
          const planPercent = planTasks.length > 0 ? Math.round((completedPlanTasks.length / planTasks.length) * 100) : 0;

          return (
            <div
              key={plan.id}
              className="rounded-[22px] border border-border bg-surface p-5 space-y-4 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Banner & Title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: plan.color }}
                    />
                    <h3 className="font-bold text-[16px] text-foreground tracking-tight">
                      {plan.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteSemester(plan.id)}
                    className="text-[11px] text-muted hover:text-danger cursor-pointer"
                  >
                    Delete
                  </button>
                </div>

                <div className="text-[12px] text-secondary font-mono">
                  📅 {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()}
                </div>

                {plan.goalSummary && (
                  <p className="text-[13px] text-secondary leading-relaxed line-clamp-2">
                    {plan.goalSummary}
                  </p>
                )}

                {/* Term Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11.5px] font-mono">
                    <span className="text-secondary">Term Completion</span>
                    <span className="font-bold text-foreground">{planPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted-bg overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${planPercent}%`,
                        backgroundColor: plan.color,
                      }}
                    />
                  </div>
                </div>

                {/* Connected Tasks */}
                <div className="p-3 rounded-xl bg-muted-bg/50 border border-border/60 text-[12.5px] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-secondary">Term Tasks &amp; Goals:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {completedPlanTasks.length} / {planTasks.length} completed
                    </span>
                  </div>
                </div>

                {/* Milestone & Exams Badges */}
                {examTasks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11.5px] font-semibold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Exams &amp; Milestones ({examTasks.length})</span>
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {examTasks.map((et) => (
                        <div
                          key={et.id}
                          onClick={() => onTaskClick(et)}
                          className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11.5px] font-medium flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{et.title}</span>
                          <span className="text-[10px] font-mono">
                            {new Date(et.scheduledDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Quick Action */}
              <div className="pt-3 border-t border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNewTask()}
                  className="w-full rounded-xl text-[12px] font-medium"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Task to Semester
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
