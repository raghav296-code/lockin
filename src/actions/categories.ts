"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import {
  createCategorySchema,
  renameCategorySchema,
  reparentCategorySchema,
  deleteCategorySchema,
  type CreateCategoryInput,
  type RenameCategoryInput,
  type ReparentCategoryInput,
  type DeleteCategoryInput,
} from "@/lib/validations/category";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  createdAt: Date;
  children: CategoryNode[];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fetch hierarchical categories for current user (Fields -> Subjects -> Topics)
 */
export async function getCategoriesAction(): Promise<ActionResult<CategoryNode[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const categories = await db.category.findMany({
      where: { userId: session.user.id },
      orderBy: [{ level: "asc" }, { name: "asc" }],
    });

    // Build hierarchy tree
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    for (const cat of categories) {
      map.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        level: cat.level,
        parentId: cat.parentId,
        createdAt: cat.createdAt,
        children: [],
      });
    }

    for (const cat of categories) {
      const node = map.get(cat.id)!;
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return { ok: true, data: roots };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load categories",
    };
  }
}

/**
 * Create a new Field (level 1), Subject (level 2), or Topic (level 3)
 */
export async function createCategoryAction(
  rawInput: CreateCategoryInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = createCategorySchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: validated.error.issues[0]?.message || "Invalid input" };
    }

    const { name, parentId, level } = validated.data;

    // Validate parent if provided
    if (parentId) {
      const parent = await db.category.findUnique({
        where: { id: parentId },
      });

      if (!parent || parent.userId !== session.user.id) {
        return { ok: false, error: "Parent category not found" };
      }

      if (level !== parent.level + 1) {
        return { ok: false, error: `Child level must be ${parent.level + 1}` };
      }
    } else if (level !== 1) {
      return { ok: false, error: "Top-level categories must be Level 1 (Field)" };
    }

    // Check duplicate name under same parent
    const existing = await db.category.findFirst({
      where: {
        userId: session.user.id,
        parentId: parentId || null,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existing) {
      return { ok: false, error: `A category named "${name}" already exists at this level` };
    }

    const slug = slugify(name);

    const newCategory = await db.category.create({
      data: {
        userId: session.user.id,
        parentId: parentId || null,
        name,
        slug,
        level,
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "category",
      entityId: newCategory.id,
      meta: { name, level, parentId },
    });

    revalidatePath("/settings/categories");
    revalidatePath("/resources");
    return { ok: true, data: { id: newCategory.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

/**
 * Rename a category
 */
export async function renameCategoryAction(
  rawInput: RenameCategoryInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = renameCategorySchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: validated.error.issues[0]?.message || "Invalid input" };
    }

    const { id, name } = validated.data;

    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category || !can(session.user, "update", { type: "category", data: { userId: category.userId } })) {
      return { ok: false, error: "Permission denied or category not found" };
    }

    const slug = slugify(name);

    await db.category.update({
      where: { id },
      data: { name, slug },
    });

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "category",
      entityId: id,
      meta: { oldName: category.name, newName: name },
    });

    revalidatePath("/settings/categories");
    revalidatePath("/resources");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to rename category",
    };
  }
}

/**
 * Reparent a category
 */
export async function reparentCategoryAction(
  rawInput: ReparentCategoryInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = reparentCategorySchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: validated.error.issues[0]?.message || "Invalid input" };
    }

    const { id, newParentId } = validated.data;

    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category || category.userId !== session.user.id) {
      return { ok: false, error: "Category not found" };
    }

    let newLevel = 1;

    if (newParentId) {
      if (newParentId === id) {
        return { ok: false, error: "A category cannot be its own parent" };
      }

      const parent = await db.category.findUnique({
        where: { id: newParentId },
      });

      if (!parent || parent.userId !== session.user.id) {
        return { ok: false, error: "New parent not found" };
      }

      newLevel = parent.level + 1;
      if (newLevel > 3) {
        return { ok: false, error: "Maximum hierarchy depth is 3 levels (Field > Subject > Topic)" };
      }
    }

    await db.category.update({
      where: { id },
      data: {
        parentId: newParentId || null,
        level: newLevel,
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "REPARENT",
      entityType: "category",
      entityId: id,
      meta: { oldParentId: category.parentId, newParentId },
    });

    revalidatePath("/settings/categories");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to move category",
    };
  }
}

/**
 * Delete a category and cascaded children
 */
export async function deleteCategoryAction(
  rawInput: DeleteCategoryInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = deleteCategorySchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: validated.error.issues[0]?.message || "Invalid input" };
    }

    const { id } = validated.data;

    const category = await db.category.findUnique({
      where: { id },
    });

    if (!category || !can(session.user, "delete", { type: "category", data: { userId: category.userId } })) {
      return { ok: false, error: "Permission denied or category not found" };
    }

    await db.category.delete({
      where: { id },
    });

    await logActivity({
      userId: session.user.id,
      action: "DELETE",
      entityType: "category",
      entityId: id,
      meta: { name: category.name, level: category.level },
    });

    revalidatePath("/settings/categories");
    revalidatePath("/resources");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}
