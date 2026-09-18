"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { detectSkillIcon } from "@/lib/skill-icons";
import {
  createSkillSchema,
  updateSkillSchema,
  updateSkillProgressSchema,
  deleteSkillSchema,
  type CreateSkillInput,
  type UpdateSkillInput,
  type UpdateSkillProgressInput,
} from "@/lib/validations/skill";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  description: string | null;
  progress: number;
  iconUrl: string | null;
  parentId: string | null;
  parentName?: string | null;
  categoryId: string | null;
  categoryName: string | null;
  children?: SkillItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch all hierarchical skills for current authenticated user
 */
export async function getSkillsAction(): Promise<ActionResult<SkillItem[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const skills = await db.skill.findMany({
      where: { userId: session.user.id },
      include: {
        category: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, name: true },
        },
        children: {
          include: {
            category: { select: { id: true, name: true } },
          },
          orderBy: [{ progress: "desc" }, { name: "asc" }],
        },
      },
      orderBy: [{ progress: "desc" }, { name: "asc" }],
    });

    // Separate into top-level roots and nested children
    const roots = skills.filter((s) => !s.parentId);

    const formatted: SkillItem[] = roots.map((root) => {
      const children: SkillItem[] = (root.children || []).map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        progress: c.progress,
        iconUrl: c.iconUrl || detectSkillIcon(c.name),
        parentId: c.parentId,
        parentName: root.name,
        categoryId: c.categoryId,
        categoryName: c.category?.name || null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));

      // If root has sub-skills, we can also compute the average sub-skill progress
      const effectiveProgress =
        children.length > 0
          ? Math.round(
              children.reduce((acc, curr) => acc + curr.progress, 0) /
                children.length
            )
          : root.progress;

      return {
        id: root.id,
        name: root.name,
        description: root.description,
        progress: effectiveProgress,
        iconUrl: root.iconUrl || detectSkillIcon(root.name),
        parentId: null,
        parentName: null,
        categoryId: root.categoryId,
        categoryName: root.category?.name || null,
        children,
        createdAt: root.createdAt,
        updatedAt: root.updatedAt,
      };
    });

    return { ok: true, data: formatted };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load skills",
    };
  }
}

/**
 * Get single skill by ID
 */
export async function getSkillByIdAction(id: string): Promise<ActionResult<SkillItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const skill = await db.skill.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, name: true },
        },
        children: true,
      },
    });

    if (
      !skill ||
      !can(session.user, "read", {
        type: "skill",
        data: { userId: skill.userId },
      })
    ) {
      return { ok: false, error: "Skill not found or permission denied" };
    }

    return {
      ok: true,
      data: {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        progress: skill.progress,
        iconUrl: skill.iconUrl || detectSkillIcon(skill.name),
        parentId: skill.parentId,
        parentName: skill.parent?.name || null,
        categoryId: skill.categoryId,
        categoryName: skill.category?.name || null,
        createdAt: skill.createdAt,
        updatedAt: skill.updatedAt,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load skill",
    };
  }
}

/**
 * Create a new Parent or Sub-Skill
 */
export async function createSkillAction(
  rawInput: CreateSkillInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = createSkillSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const { name, parentId, categoryId, description, iconUrl, progress } = validated.data;

    // Check duplicate name under same parent
    const existing = await db.skill.findFirst({
      where: {
        userId: session.user.id,
        parentId: parentId || null,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return {
        ok: false,
        error: `A skill named "${name}" already exists under this hierarchy`,
      };
    }

    // Auto-detect icon if none provided
    const resolvedIconUrl = iconUrl || detectSkillIcon(name);

    const newSkill = await db.skill.create({
      data: {
        userId: session.user.id,
        parentId: parentId || null,
        name,
        categoryId: categoryId || null,
        description: description || null,
        iconUrl: resolvedIconUrl,
        progress,
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "skill",
      entityId: newSkill.id,
      meta: { name, progress, parentId },
    });

    revalidatePath("/skills");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: newSkill.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create skill",
    };
  }
}

/**
 * Update an existing Skill
 */
export async function updateSkillAction(
  rawInput: UpdateSkillInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = updateSkillSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const { id, name, parentId, categoryId, description, iconUrl, progress } = validated.data;

    const skill = await db.skill.findUnique({
      where: { id },
    });

    if (
      !skill ||
      !can(session.user, "update", {
        type: "skill",
        data: { userId: skill.userId },
      })
    ) {
      return { ok: false, error: "Permission denied or skill not found" };
    }

    // If renaming, verify no duplicate
    if (name && name.toLowerCase() !== skill.name.toLowerCase()) {
      const duplicate = await db.skill.findFirst({
        where: {
          userId: session.user.id,
          parentId: parentId !== undefined ? parentId || null : skill.parentId,
          name: { equals: name, mode: "insensitive" },
          id: { not: id },
        },
      });

      if (duplicate) {
        return {
          ok: false,
          error: `A skill named "${name}" already exists`,
        };
      }
    }

    const resolvedIcon =
      iconUrl !== undefined
        ? iconUrl || (name ? detectSkillIcon(name) : null)
        : skill.iconUrl;

    const updated = await db.skill.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(parentId !== undefined ? { parentId: parentId || null } : {}),
        ...(categoryId !== undefined ? { categoryId: categoryId || null } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(iconUrl !== undefined ? { iconUrl: resolvedIcon } : {}),
        ...(progress !== undefined ? { progress } : {}),
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "skill",
      entityId: id,
      meta: { name: updated.name, progress: updated.progress },
    });

    revalidatePath("/skills");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update skill",
    };
  }
}

/**
 * Fast optimistic progress update (e.g. from stepper/slider)
 */
export async function updateSkillProgressAction(
  rawInput: UpdateSkillProgressInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = updateSkillProgressSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const { id, progress } = validated.data;

    const skill = await db.skill.findUnique({
      where: { id },
    });

    if (
      !skill ||
      !can(session.user, "update", {
        type: "skill",
        data: { userId: skill.userId },
      })
    ) {
      return { ok: false, error: "Permission denied or skill not found" };
    }

    await db.skill.update({
      where: { id },
      data: { progress },
    });

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "skill",
      entityId: id,
      meta: { name: skill.name, oldProgress: skill.progress, newProgress: progress },
    });

    revalidatePath("/skills");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update progress",
    };
  }
}

/**
 * Delete a Skill (and cascades subskills if parent)
 */
export async function deleteSkillAction(
  rawInput: { id: string }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = deleteSkillSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const { id } = validated.data;

    const skill = await db.skill.findUnique({
      where: { id },
    });

    if (
      !skill ||
      !can(session.user, "delete", {
        type: "skill",
        data: { userId: skill.userId },
      })
    ) {
      return { ok: false, error: "Permission denied or skill not found" };
    }

    await db.skill.delete({
      where: { id },
    });

    await logActivity({
      userId: session.user.id,
      action: "DELETE",
      entityType: "skill",
      entityId: id,
      meta: { name: skill.name },
    });

    revalidatePath("/skills");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete skill",
    };
  }
}
