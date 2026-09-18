import { z } from "zod";

export const createFlashcardSchema = z.object({
  conceptId: z.string().cuid().optional().nullable(),
  resourceId: z.string().cuid().optional().nullable(),
  front: z.string().min(1, "Question / prompt is required").max(3000),
  back: z.string().min(1, "Answer is required").max(5000),
  hint: z.string().max(1000).optional().nullable(),
});

export const updateFlashcardSchema = z.object({
  id: z.string().cuid(),
  conceptId: z.string().cuid().optional().nullable(),
  resourceId: z.string().cuid().optional().nullable(),
  front: z.string().min(1, "Question / prompt is required").max(3000).optional(),
  back: z.string().min(1, "Answer is required").max(5000).optional(),
  hint: z.string().max(1000).optional().nullable(),
});

export const reviewFlashcardSchema = z.object({
  cardId: z.string().cuid(),
  rating: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
});

export const generateAIFlashcardsSchema = z.object({
  conceptId: z.string().cuid().optional().nullable(),
  topicTitle: z.string().max(200).optional(),
  notes: z.string().max(10000).optional(),
  count: z.number().min(1).max(15).default(5),
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type ReviewFlashcardInput = z.infer<typeof reviewFlashcardSchema>;
export type GenerateAIFlashcardsInput = z.infer<typeof generateAIFlashcardsSchema>;
