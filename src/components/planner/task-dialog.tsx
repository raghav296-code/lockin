"use client";

import * as React from "react";
import {
  X,
  AlertCircle,
  Brain,
  BookOpen,
  Layers,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StudyTaskItem, SemesterPlanItem } from "@/actions/planner";
import type {
  CreateStudyTaskInput,
  UpdateStudyTaskInput,
  TaskPriority,
  TaskStatus,
} from "@/lib/validations/planner";
import { toDateKey } from "./planner-types";

interface SimpleLinkOption {
  id: string;
  title: string;
}

interface TaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStudyTaskInput | UpdateStudyTaskInput) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean | void>;
  task?: StudyTaskItem | null;
  defaultDate?: Date;
  resources: SimpleLinkOption[];
  concepts: SimpleLinkOption[];
  semesterPlans: SemesterPlanItem[];
}

interface TaskFormProps {
  task?: StudyTaskItem | null;
  defaultDate?: Date;
  resources: SimpleLinkOption[];
  concepts: SimpleLinkOption[];
  semesterPlans: SemesterPlanItem[];
  onClose: () => void;
  onSubmit: (data: CreateStudyTaskInput | UpdateStudyTaskInput) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean | void>;
}

function TaskForm({
  task,
  defaultDate,
  resources,
  concepts,
  semesterPlans,
  onClose,
  onSubmit,
  onDelete,
}: TaskFormProps) {
  const isEditing = Boolean(task);

  const initialDateStr = React.useMemo(() => {
    return toDateKey(task ? task.scheduledDate : defaultDate || new Date());
  }, [task, defaultDate]);

  const [title, setTitle] = React.useState(task?.title ?? "");
  const [description, setDescription] = React.useState(task?.description ?? "");
  const [scheduledDate, setScheduledDate] = React.useState(initialDateStr);
  const [priority, setPriority] = React.useState<TaskPriority>(
    task?.priority ?? "MEDIUM"
  );
  const [status, setStatus] = React.useState<TaskStatus>(task?.status ?? "TODO");
  const [isExamOrMilestone, setIsExamOrMilestone] = React.useState(
    task?.isExamOrMilestone ?? false
  );
  const [resourceId, setResourceId] = React.useState<string>(
    task?.resourceId ?? ""
  );
  const [conceptId, setConceptId] = React.useState<string>(task?.conceptId ?? "");
  const [semesterPlanId, setSemesterPlanId] = React.useState<string>(
    task?.semesterPlanId ?? ""
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Task title is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = isEditing && task
        ? {
            id: task.id,
            title: title.trim(),
            description: description.trim() || null,
            scheduledDate,
            startTime: null,
            endTime: null,
            estimatedMinutes: 30,
            priority,
            status,
            isExamOrMilestone,
            resourceId: resourceId || null,
            conceptId: conceptId || null,
            semesterPlanId: semesterPlanId || null,
          }
        : {
            title: title.trim(),
            description: description.trim() || null,
            scheduledDate,
            startTime: null,
            endTime: null,
            estimatedMinutes: 30,
            priority,
            status,
            isExamOrMilestone,
            resourceId: resourceId || null,
            conceptId: conceptId || null,
            semesterPlanId: semesterPlanId || null,
          };

      const success = await onSubmit(payload);
      if (success) {
        onClose();
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save study task."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-danger-tint border border-danger/20 text-danger text-[13px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Task Title */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-semibold text-foreground">
            Task / Goal Title <span className="text-danger">*</span>
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete Discrete Math problem set #3"
            required
            className="h-10 text-[13.5px] rounded-xl"
            autoFocus
          />
        </div>

        {/* Scheduled Date, Priority & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Scheduled Date
            </label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="h-10 text-[13px] rounded-xl font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent (Exam / High Impact)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-foreground">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-[13px] text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
              <option value="DEFERRED">Deferred</option>
            </select>
          </div>
        </div>

        {/* Exam / Milestone Checkbox */}
        <label className="flex items-center gap-2.5 p-3.5 rounded-xl border border-border bg-muted-bg/30 cursor-pointer">
          <input
            type="checkbox"
            checked={isExamOrMilestone}
            onChange={(e) => setIsExamOrMilestone(e.target.checked)}
            className="w-4 h-4 rounded text-accent focus:ring-accent"
          />
          <div className="text-[13px]">
            <span className="font-semibold text-foreground">
              Major Exam or Term Milestone
            </span>
            <p className="text-[11.5px] text-secondary">
              Highlights this objective as a high-visibility milestone across weekly and monthly plans.
            </p>
          </div>
        </label>

        {/* Linkages: Resource, Concept & Semester */}
        <div className="space-y-3 pt-1">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-secondary">
            Knowledge &amp; Semester Linkages
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
            {/* Resource */}
            <div className="space-y-1">
              <label className="text-[12px] text-secondary flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span>Study Resource:</span>
              </label>
              <select
                value={resourceId}
                onChange={(e) => setResourceId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent truncate"
              >
                <option value="">None</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Concept */}
            <div className="space-y-1">
              <label className="text-[12px] text-secondary flex items-center gap-1">
                <Brain className="w-3.5 h-3.5 text-purple-500" />
                <span>Concept:</span>
              </label>
              <select
                value={conceptId}
                onChange={(e) => setConceptId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent truncate"
              >
                <option value="">None</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Plan */}
            <div className="space-y-1">
              <label className="text-[12px] text-secondary flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>Semester Plan:</span>
              </label>
              <select
                value={semesterPlanId}
                onChange={(e) => setSemesterPlanId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-surface text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent truncate"
              >
                <option value="">None</option>
                {semesterPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes / Description */}
        <div className="space-y-1.5">
          <label className="text-[13px] font-medium text-foreground">
            Notes / Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any specific context, problem numbers, or exam review points..."
            rows={3}
            className="w-full p-3 rounded-xl border border-border bg-surface text-[13px] text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent resize-none"
          />
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between gap-2.5 bg-muted-bg/30">
        <div>
          {isEditing && task && onDelete && (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                if (window.confirm(`Delete task "${task.title}"?`)) {
                  setIsSubmitting(true);
                  await onDelete(task.id);
                  onClose();
                }
              }}
              disabled={isSubmitting}
              className="rounded-xl text-[13px] text-danger hover:bg-danger-tint border-danger/30 hover:border-danger/50 font-medium"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete Task
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl text-[13px]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl text-[13px] font-semibold bg-accent hover:bg-accent-hover text-white min-w-[90px]"
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Create Task"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function TaskDialog({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  task,
  defaultDate,
  resources,
  concepts,
  semesterPlans,
}: TaskDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative z-10 w-full max-w-xl max-h-[90vh] bg-surface rounded-[24px] border border-border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted-bg/30">
          <div>
            <h2 className="text-[17px] font-bold text-foreground">
              {task ? "Edit Study Task" : "Schedule New Task / Goal"}
            </h2>
            <p className="text-[12px] text-secondary">
              Plan daily tasks, weekly focus items, and semester milestones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted-bg text-secondary hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <TaskForm
          task={task}
          defaultDate={defaultDate}
          resources={resources}
          concepts={concepts}
          semesterPlans={semesterPlans}
          onClose={onClose}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
