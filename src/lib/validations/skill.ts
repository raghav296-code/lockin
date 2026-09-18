import { z } from "zod";

export const createSkillSchema = z.object({
  name: z
    .string()
    .min(1, "Skill name is required")
    .max(100, "Skill name must be 100 characters or less")
    .trim(),
  parentId: z.string().cuid().optional().nullable().or(z.literal("")),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  description: z.string().max(2000).optional().nullable(),
  iconUrl: z.string().url().optional().nullable().or(z.literal("")),
  progress: z.number().int().min(0).max(100).default(0),
});

export const updateSkillSchema = z.object({
  id: z.string().cuid(),
  name: z
    .string()
    .min(1, "Skill name is required")
    .max(100, "Skill name must be 100 characters or less")
    .trim()
    .optional(),
  parentId: z.string().cuid().optional().nullable().or(z.literal("")),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  description: z.string().max(2000).optional().nullable(),
  iconUrl: z.string().url().optional().nullable().or(z.literal("")),
  progress: z.number().int().min(0).max(100).optional(),
});

export const updateSkillProgressSchema = z.object({
  id: z.string().cuid(),
  progress: z.number().int().min(0).max(100),
});

export const deleteSkillSchema = z.object({
  id: z.string().cuid(),
});

export type CreateSkillInput = z.input<typeof createSkillSchema>;
export type UpdateSkillInput = z.input<typeof updateSkillSchema>;
export type UpdateSkillProgressInput = z.infer<typeof updateSkillProgressSchema>;
