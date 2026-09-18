import { z } from "zod";

export const masteryLevelEnum = z.enum([
  "NOVICE",
  "FAMILIAR",
  "PROFICIENT",
  "MASTERED",
]);

export const conceptRelationTypeEnum = z.enum([
  "PREREQUISITE_FOR",
  "RELATED_TO",
  "PART_OF",
  "EXTENDS",
]);

export const conceptImportanceEnum = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const createConceptSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim(),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  summary: z.string().max(2000).optional().nullable(),
  notes: z.string().max(50000).optional().nullable(),
  masteryLevel: masteryLevelEnum.default("NOVICE"),
  importance: conceptImportanceEnum.default("MEDIUM"),
  isFavorite: z.boolean().default(false),
  tagNames: z.array(z.string().trim().min(1)).optional().default([]),
  resourceIds: z.array(z.string().cuid()).optional().default([]),
  prerequisiteIds: z.array(z.string().cuid()).optional().default([]),
  dependentIds: z.array(z.string().cuid()).optional().default([]),
});

export const updateConceptSchema = z.object({
  id: z.string().cuid(),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less")
    .trim()
    .optional(),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  summary: z.string().max(2000).optional().nullable(),
  notes: z.string().max(50000).optional().nullable(),
  masteryLevel: masteryLevelEnum.optional(),
  importance: conceptImportanceEnum.optional(),
  isFavorite: z.boolean().optional(),
  tagNames: z.array(z.string().trim().min(1)).optional(),
  resourceIds: z.array(z.string().cuid()).optional(),
  prerequisiteIds: z.array(z.string().cuid()).optional(),
  dependentIds: z.array(z.string().cuid()).optional(),
});

export const updateMasteryLevelSchema = z.object({
  id: z.string().cuid(),
  masteryLevel: masteryLevelEnum,
});

export const createConceptRelationSchema = z.object({
  sourceId: z.string().cuid(),
  targetId: z.string().cuid(),
  relationType: conceptRelationTypeEnum.default("PREREQUISITE_FOR"),
  description: z.string().max(500).optional().nullable(),
  strength: z.number().int().min(1).max(5).default(3),
});

export const deleteConceptRelationSchema = z.object({
  id: z.string().cuid(),
});

export const toggleConceptFavoriteSchema = z.object({
  id: z.string().cuid(),
});

export const deleteConceptSchema = z.object({
  id: z.string().cuid(),
});

export type CreateConceptInput = z.input<typeof createConceptSchema>;
export type UpdateConceptInput = z.input<typeof updateConceptSchema>;
export type MasteryLevel = z.infer<typeof masteryLevelEnum>;
export type ConceptRelationType = z.infer<typeof conceptRelationTypeEnum>;
export type ConceptImportance = z.infer<typeof conceptImportanceEnum>;
