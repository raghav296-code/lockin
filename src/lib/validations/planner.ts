import { z } from "zod";

export const taskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const taskStatusEnum = z.enum(["TODO", "IN_PROGRESS", "DONE", "DEFERRED"]);
export const sessionTypeEnum = z.enum(["POMODORO", "DEEP_WORK", "REVIEW", "QUICK_STUDY"]);

export type TaskPriority = z.infer<typeof taskPriorityEnum>;
export type TaskStatus = z.infer<typeof taskStatusEnum>;
export type SessionType = z.infer<typeof sessionTypeEnum>;

export const createStudyTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  description: z.string().max(2000).optional().nullable(),
  scheduledDate: z.string().or(z.date()),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional().nullable().or(z.literal("")),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional().nullable().or(z.literal("")),
  estimatedMinutes: z.number().int().min(1).max(1440).default(30),
  priority: taskPriorityEnum.default("MEDIUM"),
  status: taskStatusEnum.default("TODO"),
  isExamOrMilestone: z.boolean().default(false),
  resourceId: z.string().cuid().optional().nullable().or(z.literal("")),
  conceptId: z.string().cuid().optional().nullable().or(z.literal("")),
  semesterPlanId: z.string().cuid().optional().nullable().or(z.literal("")),
});

export const updateStudyTaskSchema = z.object({
  id: z.string().cuid(),
  title: z
    .string()
    .min(1, "Task title is required")
    .max(200, "Title must be 200 characters or less")
    .trim()
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  scheduledDate: z.string().or(z.date()).optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional().nullable().or(z.literal("")),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional().nullable().or(z.literal("")),
  estimatedMinutes: z.number().int().min(1).max(1440).optional(),
  actualMinutes: z.number().int().min(0).optional(),
  priority: taskPriorityEnum.optional(),
  status: taskStatusEnum.optional(),
  isExamOrMilestone: z.boolean().optional(),
  resourceId: z.string().cuid().optional().nullable().or(z.literal("")),
  conceptId: z.string().cuid().optional().nullable().or(z.literal("")),
  semesterPlanId: z.string().cuid().optional().nullable().or(z.literal("")),
});

export const toggleStudyTaskStatusSchema = z.object({
  id: z.string().cuid(),
  status: taskStatusEnum,
});

export const deleteStudyTaskSchema = z.object({
  id: z.string().cuid(),
});

export const logStudySessionSchema = z.object({
  sessionType: sessionTypeEnum.default("POMODORO"),
  durationMinutes: z.number().int().min(1).max(720),
  completedRounds: z.number().int().min(1).default(1),
  studyTaskId: z.string().cuid().optional().nullable().or(z.literal("")),
  resourceId: z.string().cuid().optional().nullable().or(z.literal("")),
  conceptId: z.string().cuid().optional().nullable().or(z.literal("")),
  notes: z.string().max(5000).optional().nullable(),
  startedAt: z.string().or(z.date()).optional(),
  endedAt: z.string().or(z.date()).optional(),
});

export const createSemesterPlanSchema = z.object({
  title: z
    .string()
    .min(1, "Semester / Term title is required")
    .max(100, "Title must be 100 characters or less")
    .trim(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").default("#007AFF"),
  goalSummary: z.string().max(2000).optional().nullable(),
  targetWeeklyHours: z.number().min(1).max(168).default(20),
});

export const updateSemesterPlanSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(100).trim().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
  goalSummary: z.string().max(2000).optional().nullable(),
  targetWeeklyHours: z.number().min(1).max(168).optional(),
});

export const deleteSemesterPlanSchema = z.object({
  id: z.string().cuid(),
});

export type CreateStudyTaskInput = z.infer<typeof createStudyTaskSchema>;
export type UpdateStudyTaskInput = z.infer<typeof updateStudyTaskSchema>;
export type LogStudySessionInput = z.infer<typeof logStudySessionSchema>;
export type CreateSemesterPlanInput = z.infer<typeof createSemesterPlanSchema>;
export type UpdateSemesterPlanInput = z.infer<typeof updateSemesterPlanSchema>;
