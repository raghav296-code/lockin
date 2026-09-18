"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ListTodo,
  Target,
  Layers,
} from "lucide-react";
import type {
  StudyTaskItem,
  SemesterPlanItem,
  PlannerOverviewData,
} from "@/actions/planner";
import {
  createStudyTaskAction,
  updateStudyTaskAction,
  toggleStudyTaskStatusAction,
  deleteStudyTaskAction,
  createSemesterPlanAction,
  updateSemesterPlanAction,
  deleteSemesterPlanAction,
} from "@/actions/planner";
import type {
  CreateStudyTaskInput,
  UpdateStudyTaskInput,
  CreateSemesterPlanInput,
  UpdateSemesterPlanInput,
  TaskStatus,
} from "@/lib/validations/planner";
import { AppleActivityRings } from "./activity-rings";
import { AppleCalendarView } from "./apple-calendar-view";
import { TaskDialog } from "./task-dialog";
import { SemesterDialog } from "./semester-dialog";
import { toDateKey, type CalendarViewMode } from "./planner-types";

interface SimpleLinkOption {
  id: string;
  title: string;
}

interface PlannerContainerProps {
  initialData: PlannerOverviewData;
  resources: SimpleLinkOption[];
  concepts: SimpleLinkOption[];
}

export function PlannerContainer({
  initialData,
  resources,
  concepts,
}: PlannerContainerProps) {
  const router = useRouter();

  // Local state for optimistic updates
  const [tasks, setTasks] = React.useState<StudyTaskItem[]>(initialData.tasks);
  const [semesterPlans, setSemesterPlans] = React.useState<SemesterPlanItem[]>(
    initialData.semesterPlans
  );

  // Calendar State
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("week");

  // Modal Dialogs
  const [taskDialogOpen, setTaskDialogOpen] = React.useState(false);
  const [editingTask, setEditingTask] = React.useState<StudyTaskItem | null>(null);
  const [dialogDefaultDate, setDialogDefaultDate] = React.useState<Date>(new Date());

  const [semesterDialogOpen, setSemesterDialogOpen] = React.useState(false);
  const [editingSemester, setEditingSemester] = React.useState<SemesterPlanItem | null>(
    null
  );

  // Handlers
  const handleTaskToggle = async (id: string, newStatus: TaskStatus) => {
    // Optimistic toggle
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    const res = await toggleStudyTaskStatusAction({ id, status: newStatus });
    if (!res.ok) {
      router.refresh();
    }
  };

  const handleOpenNewTask = (date?: Date) => {
    setEditingTask(null);
    setDialogDefaultDate(date || currentDate);
    setTaskDialogOpen(true);
  };

  const handleOpenEditTask = (task: StudyTaskItem) => {
    setEditingTask(task);
    setDialogDefaultDate(new Date(task.scheduledDate));
    setTaskDialogOpen(true);
  };

  const handleTaskSubmit = async (
    data: CreateStudyTaskInput | UpdateStudyTaskInput
  ): Promise<boolean> => {
    if ("id" in data && data.id) {
      const res = await updateStudyTaskAction(data as UpdateStudyTaskInput);
      if (res.ok && res.data) {
        setTasks((prev) =>
          prev.map((t) => (t.id === res.data!.id ? res.data! : t))
        );
        router.refresh();
        return true;
      }
      return false;
    } else {
      const res = await createStudyTaskAction(data as CreateStudyTaskInput);
      if (res.ok && res.data) {
        setTasks((prev) => [...prev, res.data!]);
        router.refresh();
        return true;
      }
      return false;
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteStudyTaskAction(id);
    router.refresh();
  };

  const handleOpenNewSemester = () => {
    setEditingSemester(null);
    setSemesterDialogOpen(true);
  };

  const handleSemesterSubmit = async (
    data: CreateSemesterPlanInput | UpdateSemesterPlanInput
  ): Promise<boolean> => {
    if ("id" in data && data.id) {
      const res = await updateSemesterPlanAction(data as UpdateSemesterPlanInput);
      if (res.ok && res.data) {
        setSemesterPlans((prev) =>
          prev.map((p) => (p.id === res.data!.id ? res.data! : p))
        );
        router.refresh();
        return true;
      }
      return false;
    } else {
      const res = await createSemesterPlanAction(data as CreateSemesterPlanInput);
      if (res.ok && res.data) {
        setSemesterPlans((prev) => [...prev, res.data!]);
        router.refresh();
        return true;
      }
      return false;
    }
  };

  const handleDeleteSemester = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this semester plan?")) {
      return;
    }
    setSemesterPlans((prev) => prev.filter((p) => p.id !== id));
    await deleteSemesterPlanAction(id);
    router.refresh();
  };

  // Compute live overview metrics
  const todayKey = toDateKey(new Date());
  const todayTasks = tasks.filter((t) => toDateKey(t.scheduledDate) === todayKey);
  const completedTodayTasks = todayTasks.filter((t) => t.status === "DONE");

  const completedAllTasks = tasks.filter((t) => t.status === "DONE");

  // Week metrics
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

  const milestoneTasks = tasks.filter((t) => t.isExamOrMilestone);
  const completedMilestones = milestoneTasks.filter((t) => t.status === "DONE");

  return (
    <div className="space-y-6">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Tasks */}
        <div className="rounded-[22px] border border-border bg-surface p-4 sm:p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">
              Today&apos;s Tasks
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FA114F]/10 text-[#FA114F] border border-[#FA114F]/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FA114F] font-mono">
              {completedTodayTasks.length} / {todayTasks.length}
            </p>
            <p className="text-[11.5px] text-secondary">
              {todayTasks.length > 0
                ? `${Math.round((completedTodayTasks.length / todayTasks.length) * 100)}% done today`
                : "No tasks due today"}
            </p>
          </div>
        </div>

        {/* This Week's Objectives */}
        <div className="rounded-[22px] border border-border bg-surface p-4 sm:p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">
              This Week
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <ListTodo className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {completedWeekTasks.length} / {weekTasks.length}
            </p>
            <p className="text-[11.5px] text-secondary">
              {weekTasks.length > 0
                ? `${Math.round((completedWeekTasks.length / weekTasks.length) * 100)}% weekly goals met`
                : "No weekly tasks set"}
            </p>
          </div>
        </div>

        {/* Major Milestones */}
        <div className="rounded-[22px] border border-border bg-surface p-4 sm:p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">
              Exam Milestones
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
              <Target className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-cyan-600 dark:text-cyan-400 font-mono">
              {completedMilestones.length} / {milestoneTasks.length}
            </p>
            <p className="text-[11.5px] text-secondary">
              High-impact exam objectives
            </p>
          </div>
        </div>

        {/* Active Semester Plans */}
        <div className="rounded-[22px] border border-border bg-surface p-4 sm:p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">
              Semester Plans
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400 font-mono">
              {semesterPlans.length}
            </p>
            <p className="text-[11.5px] text-secondary">
              {completedAllTasks.length} of {tasks.length} total tasks done
            </p>
          </div>
        </div>
      </div>

      {/* Full-Width Apple Activity Rings & Goals Progress Bar */}
      <AppleActivityRings
        tasks={tasks}
        semesterPlans={semesterPlans}
        currentDate={currentDate}
        onNewTask={handleOpenNewTask}
        onNewSemester={handleOpenNewSemester}
      />

      {/* Full-Width Spacious Apple Calendar Suite */}
      <div className="space-y-4">
        <AppleCalendarView
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          tasks={tasks}
          semesterPlans={semesterPlans}
          onTaskToggle={handleTaskToggle}
          onTaskClick={handleOpenEditTask}
          onDeleteTask={handleDeleteTask}
          onNewTask={handleOpenNewTask}
          onNewSemester={handleOpenNewSemester}
          onDeleteSemester={handleDeleteSemester}
        />
      </div>

      {/* Modals */}
      <TaskDialog
        isOpen={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        onDelete={handleDeleteTask}
        task={editingTask}
        defaultDate={dialogDefaultDate}
        resources={resources}
        concepts={concepts}
        semesterPlans={semesterPlans}
      />

      <SemesterDialog
        isOpen={semesterDialogOpen}
        onClose={() => {
          setSemesterDialogOpen(false);
          setEditingSemester(null);
        }}
        onSubmit={handleSemesterSubmit}
        semesterPlan={editingSemester}
      />
    </div>
  );
}
