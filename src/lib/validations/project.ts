import { z } from "zod";

export const projectStatusEnum = z.enum([
  "PLANNING",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
]);

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project title is required")
    .max(120, "Project title must be 120 characters or less")
    .trim(),
  description: z.string().max(3000).optional().nullable(),
  url: z.string().url("Please enter a valid live URL").optional().nullable().or(z.literal("")),
  repoUrl: z.string().url("Please enter a valid GitHub URL").optional().nullable().or(z.literal("")),
  status: projectStatusEnum.default("IN_PROGRESS"),
  skillIds: z.array(z.string().cuid()).optional().default([]),
});

export const updateProjectSchema = z.object({
  id: z.string().cuid(),
  name: z
    .string()
    .min(1, "Project title is required")
    .max(120, "Project title must be 120 characters or less")
    .trim()
    .optional(),
  description: z.string().max(3000).optional().nullable(),
  url: z.string().url("Please enter a valid live URL").optional().nullable().or(z.literal("")),
  repoUrl: z.string().url("Please enter a valid GitHub URL").optional().nullable().or(z.literal("")),
  status: projectStatusEnum.optional(),
  skillIds: z.array(z.string().cuid()).optional(),
});

export const deleteProjectSchema = z.object({
  id: z.string().cuid(),
});

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
export type ProjectStatus = z.infer<typeof projectStatusEnum>;
