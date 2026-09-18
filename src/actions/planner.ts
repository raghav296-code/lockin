"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { Prisma } from "@prisma/client";
import {
  createStudyTaskSchema,
  updateStudyTaskSchema,
  toggleStudyTaskStatusSchema,
  deleteStudyTaskSchema,
  logStudySessionSchema,
  createSemesterPlanSchema,
  updateSemesterPlanSchema,
  deleteSemesterPlanSchema,
  type CreateStudyTaskInput,
  type UpdateStudyTaskInput,
  type LogStudySessionInput,
  type CreateSemesterPlanInput,
  type UpdateSemesterPlanInput,
  type TaskPriority,
  type TaskStatus,
  type SessionType,
} from "@/lib/validations/planner";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface StudyTaskItem {
  id: string;
  title: string;
  description: string | null;
  scheduledDate: Date;
  startTime: string | null;
  endTime: string | null;
  estimatedMinutes: number;
  actualMinutes: number;
  priority: TaskPriority;
  status: TaskStatus;
  isExamOrMilestone: boolean;
  resourceId: string | null;
  conceptId: string | null;
  semesterPlanId: string | null;
  createdAt: Date;
  updatedAt: Date;
  resource?: {
    id: string;
    title: string;
    type: string;
  } | null;
  concept?: {
    id: string;
    title: string;
    masteryLevel: string;
  } | null;
  semesterPlan?: {
    id: string;
    title: string;
    color: string;
  } | null;
}

export interface StudySessionItem {
  id: string;
  sessionType: SessionType;
  durationMinutes: number;
  completedRounds: number;
  notes: string | null;
  startedAt: Date;
  endedAt: Date;
  createdAt: Date;
  studyTaskId: string | null;
  resourceId: string | null;
  conceptId: string | null;
  resource?: {
    id: string;
    title: string;
    type: string;
  } | null;
  concept?: {
    id: string;
    title: string;
    masteryLevel: string;
  } | null;
}

export interface SemesterPlanItem {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  color: string;
  goalSummary: string | null;
  targetWeeklyHours: number;
  createdAt: Date;
  updatedAt: Date;
  tasksCount?: number;
}

export interface PlannerDayData {
  date: string; // YYYY-MM-DD
  tasks: StudyTaskItem[];
  sessions: StudySessionItem[];
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
}

export interface PlannerOverviewData {
  tasks: StudyTaskItem[];
  sessions: StudySessionItem[];
  semesterPlans: SemesterPlanItem[];
  stats: {
    todayPlannedMinutes: number;
    todayCompletedMinutes: number;
    weekCompletedMinutes: number;
    totalPomodoros: number;
    completionRate: number;
  };
}

/**
 * Fetch planner overview data with date filtering
 */
export async function getPlannerDataAction(
  startDateStr?: string,
  endDateStr?: string
): Promise<ActionResult<PlannerOverviewData>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const userId = session.user.id;

    // Default start and end dates
    const start = startDateStr
      ? new Date(startDateStr)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDateStr
      ? new Date(endDateStr)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0);

    const [tasks, sessions, semesterPlans] = await Promise.all([
      db.studyTask.findMany({
        where: {
          userId,
          scheduledDate: {
            gte: start,
            lte: end,
          },
        },
        orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
        include: {
          resource: {
            select: { id: true, title: true, type: true },
          },
          concept: {
            select: { id: true, title: true, masteryLevel: true },
          },
          semesterPlan: {
            select: { id: true, title: true, color: true },
          },
        },
      }),
      db.studySession.findMany({
        where: {
          userId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          resource: {
            select: { id: true, title: true, type: true },
          },
          concept: {
            select: { id: true, title: true, masteryLevel: true },
          },
        },
      }),
      db.semesterPlan.findMany({
        where: { userId },
        orderBy: { startDate: "asc" },
        include: {
          _count: {
            select: { tasks: true },
          },
        },
      }),
    ]);

    // Compute stats for today and this week
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    let todayPlannedMinutes = 0;
    let todayCompletedMinutes = 0;
    let weekCompletedMinutes = 0;
    let totalPomodoros = 0;

    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    for (const t of tasks) {
      const taskDateStr = t.scheduledDate.toISOString().split("T")[0];
      if (taskDateStr === todayStr) {
        todayPlannedMinutes += t.estimatedMinutes;
        if (t.status === "DONE") {
          todayCompletedMinutes += t.actualMinutes || t.estimatedMinutes;
        }
      }
    }

    for (const s of sessions) {
      if (s.createdAt >= oneWeekAgo) {
        weekCompletedMinutes += s.durationMinutes;
      }
      if (s.sessionType === "POMODORO") {
        totalPomodoros += s.completedRounds || 1;
      }
    }

    const completedTasksCount = tasks.filter((t) => t.status === "DONE").length;
    const completionRate =
      tasks.length > 0
        ? Math.round((completedTasksCount / tasks.length) * 100)
        : 0;

    const formattedSemesterPlans: SemesterPlanItem[] = semesterPlans.map((p) => ({
      id: p.id,
      title: p.title,
      startDate: p.startDate,
      endDate: p.endDate,
      color: p.color,
      goalSummary: p.goalSummary,
      targetWeeklyHours: p.targetWeeklyHours,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      tasksCount: p._count.tasks,
    }));

    return {
      ok: true,
      data: {
        tasks,
        sessions,
        semesterPlans: formattedSemesterPlans,
        stats: {
          todayPlannedMinutes,
          todayCompletedMinutes,
          weekCompletedMinutes,
          totalPomodoros,
          completionRate,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load planner data",
    };
  }
}

/**
 * Create a new Study Task
 */
export async function createStudyTaskAction(
  rawInput: CreateStudyTaskInput
): Promise<ActionResult<StudyTaskItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = createStudyTaskSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid task input",
      };
    }

    const data = validated.data;
    const scheduledDate =
      typeof data.scheduledDate === "string"
        ? new Date(data.scheduledDate)
        : data.scheduledDate;

    const task = await db.studyTask.create({
      data: {
        userId: session.user.id,
        title: data.title,
        description: data.description ?? undefined,
        scheduledDate,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        estimatedMinutes: data.estimatedMinutes,
        priority: data.priority,
        status: data.status,
        isExamOrMilestone: data.isExamOrMilestone,
        resourceId: data.resourceId || null,
        conceptId: data.conceptId || null,
        semesterPlanId: data.semesterPlanId || null,
      },
      include: {
        resource: {
          select: { id: true, title: true, type: true },
        },
        concept: {
          select: { id: true, title: true, masteryLevel: true },
        },
        semesterPlan: {
          select: { id: true, title: true, color: true },
        },
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "task",
      entityId: task.id,
      meta: { title: task.title, scheduledDate: task.scheduledDate },
    });

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return { ok: true, data: task };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create study task",
    };
  }
}

/**
 * Update an existing Study Task
 */
export async function updateStudyTaskAction(
  rawInput: UpdateStudyTaskInput
): Promise<ActionResult<StudyTaskItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = updateStudyTaskSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid update input",
      };
    }

    const { id, scheduledDate, ...rest } = validated.data;

    const existing = await db.studyTask.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "update", { type: "task", data: { userId: existing.userId } })) {
      return { ok: false, error: "Task not found or unauthorized" };
    }

    const updateData: Prisma.StudyTaskUpdateInput = {
      title: rest.title,
      description: rest.description,
      startTime: rest.startTime,
      endTime: rest.endTime,
      estimatedMinutes: rest.estimatedMinutes,
      actualMinutes: rest.actualMinutes,
      priority: rest.priority,
      status: rest.status,
      isExamOrMilestone: rest.isExamOrMilestone,
      resource:
        rest.resourceId !== undefined
          ? rest.resourceId
            ? { connect: { id: rest.resourceId } }
            : { disconnect: true }
          : undefined,
      concept:
        rest.conceptId !== undefined
          ? rest.conceptId
            ? { connect: { id: rest.conceptId } }
            : { disconnect: true }
          : undefined,
      semesterPlan:
        rest.semesterPlanId !== undefined
          ? rest.semesterPlanId
            ? { connect: { id: rest.semesterPlanId } }
            : { disconnect: true }
          : undefined,
    };

    if (scheduledDate) {
      updateData.scheduledDate =
        typeof scheduledDate === "string"
          ? new Date(scheduledDate)
          : scheduledDate;
    }

    const updated = await db.studyTask.update({
      where: { id },
      data: updateData,
      include: {
        resource: {
          select: { id: true, title: true, type: true },
        },
        concept: {
          select: { id: true, title: true, masteryLevel: true },
        },
        semesterPlan: {
          select: { id: true, title: true, color: true },
        },
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "task",
      entityId: id,
      meta: { title: updated.title },
    });

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return { ok: true, data: updated };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update study task",
    };
  }
}

/**
 * Toggle Task Status (e.g. TODO <-> DONE)
 */
export async function toggleStudyTaskStatusAction(
  rawInput: { id: string; status: TaskStatus }
): Promise<ActionResult<{ status: TaskStatus }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = toggleStudyTaskStatusSchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: "Invalid status input" };
    }

    const { id, status } = validated.data;

    const existing = await db.studyTask.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "update", { type: "task", data: { userId: existing.userId } })) {
      return { ok: false, error: "Task not found or unauthorized" };
    }

    await db.studyTask.update({
      where: { id },
      data: { status },
    });

    await logActivity({
      userId: session.user.id,
      action: status === "DONE" ? "COMPLETE" : "UPDATE",
      entityType: "task",
      entityId: id,
      meta: { title: existing.title, newStatus: status },
    });

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return { ok: true, data: { status } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to toggle task status",
    };
  }
}

/**
 * Delete a Study Task
 */
export async function deleteStudyTaskAction(
  rawInput: string | { id: string }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const payload = typeof rawInput === "string" ? { id: rawInput } : rawInput;
    const validated = deleteStudyTaskSchema.safeParse(payload);
    if (!validated.success) {
      return { ok: false, error: "Invalid ID" };
    }

    const { id } = validated.data;

    const existing = await db.studyTask.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "delete", { type: "task", data: { userId: existing.userId } })) {
      return { ok: false, error: "Task not found or unauthorized" };
    }

    await db.studyTask.delete({
      where: { id },
    });

    await logActivity({
      userId: session.user.id,
      action: "DELETE",
      entityType: "task",
      entityId: id,
      meta: { title: existing.title },
    });

    revalidatePath("/planner");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete task",
    };
  }
}

/**
 * Log a Completed Focus / Pomodoro / Deep Work Session
 */
export async function logStudySessionAction(
  rawInput: LogStudySessionInput
): Promise<ActionResult<StudySessionItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = logStudySessionSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid session data",
      };
    }

    const data = validated.data;
    const durationMinutes = data.durationMinutes;

    // 1. Create Study Session record
    const studySession = await db.studySession.create({
      data: {
        userId: session.user.id,
        sessionType: data.sessionType,
        durationMinutes,
        completedRounds: data.completedRounds,
        notes: data.notes || null,
        studyTaskId: data.studyTaskId || null,
        resourceId: data.resourceId || null,
        conceptId: data.conceptId || null,
        startedAt: data.startedAt ? new Date(data.startedAt) : new Date(),
        endedAt: data.endedAt ? new Date(data.endedAt) : new Date(),
      },
      include: {
        resource: {
          select: { id: true, title: true, type: true },
        },
        concept: {
          select: { id: true, title: true, masteryLevel: true },
        },
      },
    });

    // 2. Increment actual study minutes on linked resource if any
    if (data.resourceId) {
      await db.resource.update({
        where: { id: data.resourceId },
        data: {
          actualMinutes: { increment: durationMinutes },
          status: "IN_PROGRESS",
        },
      });
    }

    // 3. Increment actual minutes on study task if any
    if (data.studyTaskId) {
      await db.studyTask.update({
        where: { id: data.studyTaskId },
        data: {
          actualMinutes: { increment: durationMinutes },
        },
      });
    }

    // 4. Log user activity
    await logActivity({
      userId: session.user.id,
      action: "COMPLETE",
      entityType: "task",
      entityId: studySession.id,
      meta: {
        sessionType: data.sessionType,
        durationMinutes,
        rounds: data.completedRounds,
      },
    });

    revalidatePath("/planner");
    revalidatePath("/resources");
    revalidatePath("/dashboard");

    return { ok: true, data: studySession };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to log study session",
    };
  }
}

/**
 * Create Semester / Academic Term Plan
 */
export async function createSemesterPlanAction(
  rawInput: CreateSemesterPlanInput
): Promise<ActionResult<SemesterPlanItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = createSemesterPlanSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid semester plan input",
      };
    }

    const data = validated.data;
    const startDate = typeof data.startDate === "string" ? new Date(data.startDate) : data.startDate;
    const endDate = typeof data.endDate === "string" ? new Date(data.endDate) : data.endDate;

    const plan = await db.semesterPlan.create({
      data: {
        userId: session.user.id,
        title: data.title,
        startDate,
        endDate,
        color: data.color,
        goalSummary: data.goalSummary || null,
        targetWeeklyHours: data.targetWeeklyHours,
      },
    });

    revalidatePath("/planner");

    return { ok: true, data: plan };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create semester plan",
    };
  }
}

/**
 * Update Semester Plan
 */
export async function updateSemesterPlanAction(
  rawInput: UpdateSemesterPlanInput
): Promise<ActionResult<SemesterPlanItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = updateSemesterPlanSchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: "Invalid input" };
    }

    const { id, startDate, endDate, ...rest } = validated.data;

    const existing = await db.semesterPlan.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return { ok: false, error: "Plan not found or unauthorized" };
    }

    const updateData: Prisma.SemesterPlanUpdateInput = {
      ...rest,
    };

    if (startDate) {
      updateData.startDate = typeof startDate === "string" ? new Date(startDate) : startDate;
    }
    if (endDate) {
      updateData.endDate = typeof endDate === "string" ? new Date(endDate) : endDate;
    }

    const updated = await db.semesterPlan.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/planner");

    return { ok: true, data: updated };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update semester plan",
    };
  }
}

/**
 * Delete Semester Plan
 */
export async function deleteSemesterPlanAction(
  rawInput: string | { id: string }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const payload = typeof rawInput === "string" ? { id: rawInput } : rawInput;
    const validated = deleteSemesterPlanSchema.safeParse(payload);
    if (!validated.success) {
      return { ok: false, error: "Invalid ID" };
    }

    const { id } = validated.data;

    const existing = await db.semesterPlan.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return { ok: false, error: "Plan not found or unauthorized" };
    }

    await db.semesterPlan.delete({
      where: { id },
    });

    revalidatePath("/planner");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete semester plan",
    };
  }
}
