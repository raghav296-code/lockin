import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .trim(),
  parentId: z.string().cuid().nullable().optional(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const renameCategorySchema = z.object({
  id: z.string().cuid(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .trim(),
});

export type RenameCategoryInput = z.infer<typeof renameCategorySchema>;

export const reparentCategorySchema = z.object({
  id: z.string().cuid(),
  newParentId: z.string().cuid().nullable().optional(),
});

export type ReparentCategoryInput = z.infer<typeof reparentCategorySchema>;

export const deleteCategorySchema = z.object({
  id: z.string().cuid(),
});

export type DeleteCategoryInput = z.infer<typeof deleteCategorySchema>;
