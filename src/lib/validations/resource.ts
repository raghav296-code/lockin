import { z } from "zod";

export const resourceTypeEnum = z.enum([
  "ARTICLE",
  "BOOK",
  "VIDEO",
  "COURSE",
  "PAPER",
  "DOCUMENTATION",
  "OTHER",
]);

export const resourceStatusEnum = z.enum([
  "BACKLOG",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
]);

export const createResourceSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .nullable(),
  type: resourceTypeEnum.default("ARTICLE"),
  status: resourceStatusEnum.default("BACKLOG"),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  author: z.string().max(100).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  estimatedMinutes: z.number().int().min(0).optional().nullable(),
  actualMinutes: z.number().int().min(0).default(0),
  isFavorite: z.boolean().default(false),
  notes: z.string().max(50000).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  tagNames: z.array(z.string().trim().min(1)).optional().default([]),
});

export const updateResourceSchema = z.object({
  id: z.string().cuid(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim()
    .optional(),
  url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal(""))
    .nullable(),
  type: resourceTypeEnum.optional(),
  status: resourceStatusEnum.optional(),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  author: z.string().max(100).optional().nullable(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  estimatedMinutes: z.number().int().min(0).optional().nullable(),
  actualMinutes: z.number().int().min(0).optional(),
  isFavorite: z.boolean().optional(),
  notes: z.string().max(50000).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  tagNames: z.array(z.string().trim().min(1)).optional(),
});

export const updateResourceStatusSchema = z.object({
  id: z.string().cuid(),
  status: resourceStatusEnum,
});

export const toggleFavoriteSchema = z.object({
  id: z.string().cuid(),
});

export const deleteResourceSchema = z.object({
  id: z.string().cuid(),
});

export type CreateResourceInput = z.input<typeof createResourceSchema>;
export type UpdateResourceInput = z.input<typeof updateResourceSchema>;
export type ResourceType = z.infer<typeof resourceTypeEnum>;
export type ResourceStatus = z.infer<typeof resourceStatusEnum>;
