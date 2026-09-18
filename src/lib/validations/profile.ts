import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  bio: z.string().max(300, "Bio must be 300 characters or fewer").optional().nullable(),
  isProfilePublic: z.boolean(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
