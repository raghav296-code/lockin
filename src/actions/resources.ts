"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { getOrCreateTag } from "@/actions/tags";
import {
  createResourceSchema,
  updateResourceSchema,
  updateResourceStatusSchema,
  toggleFavoriteSchema,
  deleteResourceSchema,
  type CreateResourceInput,
  type UpdateResourceInput,
  type ResourceType,
  type ResourceStatus,
} from "@/lib/validations/resource";

import { Prisma } from "@prisma/client";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ResourceTagDto {
  id: string;
  name: string;
  color: string | null;
}

export interface ResourceItem {
  id: string;
  title: string;
  url: string | null;
  type: ResourceType;
  status: ResourceStatus;
  rating: number | null;
  notes: string | null;
  summary: string | null;
  author: string | null;
  estimatedMinutes: number | null;
  actualMinutes: number;
  isFavorite: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    level: number;
    parent?: {
      id: string;
      name: string;
      parent?: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
  tags: ResourceTagDto[];
}

export interface ResourceFilterParams {
  status?: ResourceStatus | "ALL";
  type?: ResourceType | "ALL";
  categoryId?: string | null;
  tagName?: string | null;
  isFavorite?: boolean;
  search?: string;
  sortBy?: "updatedAt" | "createdAt" | "title" | "rating" | "time";
  sortOrder?: "asc" | "desc";
}

/**
 * Fetch all resources with flexible filtering and sorting
 */
export async function getResourcesAction(
  filters: ResourceFilterParams = {}
): Promise<ActionResult<ResourceItem[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const userId = session.user.id;
    const {
      status,
      type,
      categoryId,
      tagName,
      isFavorite,
      search,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = filters;

    // Build Prisma query where clause
    const where: Prisma.ResourceWhereInput = {
      userId,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isFavorite === true) {
      where.isFavorite = true;
    }

    if (tagName) {
      where.tags = {
        some: {
          tag: {
            name: tagName.toLowerCase(),
          },
        },
      };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { author: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.ResourceOrderByWithRelationInput = { updatedAt: sortOrder };
    if (sortBy === "title") {
      orderBy = { title: sortOrder };
    } else if (sortBy === "rating") {
      orderBy = { rating: sortOrder };
    } else if (sortBy === "time") {
      orderBy = { actualMinutes: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    }

    const resources = await db.resource.findMany({
      where,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            level: true,
            parent: {
              select: {
                id: true,
                name: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    const formatted: ResourceItem[] = resources.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      type: r.type as ResourceType,
      status: r.status as ResourceStatus,
      rating: r.rating,
      notes: r.notes,
      summary: r.summary,
      author: r.author,
      estimatedMinutes: r.estimatedMinutes,
      actualMinutes: r.actualMinutes,
      isFavorite: r.isFavorite,
      completedAt: r.completedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      category: r.category,
      tags: r.tags.map((rt) => rt.tag),
    }));

    return { ok: true, data: formatted };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load resources",
    };
  }
}

/**
 * Fetch a single resource by ID
 */
export async function getResourceByIdAction(
  id: string
): Promise<ActionResult<ResourceItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const resource = await db.resource.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            level: true,
            parent: {
              select: {
                id: true,
                name: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
        },
      },
    });

    if (!resource || !can(session.user, "read", { type: "resource", data: { userId: resource.userId } })) {
      return { ok: false, error: "Resource not found or unauthorized" };
    }

    const formatted: ResourceItem = {
      id: resource.id,
      title: resource.title,
      url: resource.url,
      type: resource.type as ResourceType,
      status: resource.status as ResourceStatus,
      rating: resource.rating,
      notes: resource.notes,
      summary: resource.summary,
      author: resource.author,
      estimatedMinutes: resource.estimatedMinutes,
      actualMinutes: resource.actualMinutes,
      isFavorite: resource.isFavorite,
      completedAt: resource.completedAt,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt,
      category: resource.category,
      tags: resource.tags.map((rt) => rt.tag),
    };

    return { ok: true, data: formatted };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load resource",
    };
  }
}

/**
 * Create a new learning resource
 */
export async function createResourceAction(
  rawInput: CreateResourceInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = createResourceSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const {
      title,
      url,
      type,
      status,
      categoryId,
      author,
      rating,
      estimatedMinutes,
      actualMinutes,
      isFavorite,
      notes,
      summary,
      tagNames = [],
    } = validated.data;

    const userId = session.user.id;

    // Validate category if specified
    if (categoryId) {
      const category = await db.category.findUnique({
        where: { id: categoryId },
      });
      if (!category || category.userId !== userId) {
        return { ok: false, error: "Selected category does not exist" };
      }
    }

    // Process tags
    const tagIds: string[] = [];
    for (const name of tagNames) {
      if (name.trim()) {
        const tid = await getOrCreateTag(userId, name.trim());
        tagIds.push(tid);
      }
    }

    const created = await db.resource.create({
      data: {
        userId,
        title,
        url: url || null,
        type,
        status,
        categoryId: categoryId || null,
        author: author || null,
        rating: rating || null,
        estimatedMinutes: estimatedMinutes || null,
        actualMinutes: actualMinutes || 0,
        isFavorite: isFavorite || false,
        notes: notes || null,
        summary: summary || null,
        completedAt: status === "COMPLETED" ? new Date() : null,
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
    });

    await logActivity({
      userId,
      action: "CREATE",
      entityType: "resource",
      entityId: created.id,
      meta: { title, type, status },
    });

    revalidatePath("/resources");
    revalidatePath("/dashboard");

    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create resource",
    };
  }
}

/**
 * Update an existing resource
 */
export async function updateResourceAction(
  rawInput: UpdateResourceInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = updateResourceSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const {
      id,
      title,
      url,
      type,
      status,
      categoryId,
      author,
      rating,
      estimatedMinutes,
      actualMinutes,
      isFavorite,
      notes,
      summary,
      tagNames,
    } = validated.data;

    const existing = await db.resource.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "update", { type: "resource", data: { userId: existing.userId } })) {
      return { ok: false, error: "Resource not found or unauthorized" };
    }

    const userId = session.user.id;

    // Validate category if updating category
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await db.category.findUnique({
          where: { id: categoryId },
        });
        if (!category || category.userId !== userId) {
          return { ok: false, error: "Selected category does not exist" };
        }
      }
    }

    // Determine completion timestamp update
    let completedAt = existing.completedAt;
    if (status && status !== existing.status) {
      if (status === "COMPLETED" && !existing.completedAt) {
        completedAt = new Date();
      } else if (status !== "COMPLETED") {
        completedAt = null;
      }
    }

    const updateData: Prisma.ResourceUpdateInput = {
      ...(title !== undefined && { title }),
      ...(url !== undefined && { url: url || null }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(categoryId !== undefined && { category: categoryId ? { connect: { id: categoryId } } : { disconnect: true } }),
      ...(author !== undefined && { author: author || null }),
      ...(rating !== undefined && { rating }),
      ...(estimatedMinutes !== undefined && { estimatedMinutes }),
      ...(actualMinutes !== undefined && { actualMinutes }),
      ...(isFavorite !== undefined && { isFavorite }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(summary !== undefined && { summary: summary || null }),
      completedAt,
    };

    // If tagNames specified, replace relations
    if (tagNames !== undefined) {
      await db.resourceTag.deleteMany({
        where: { resourceId: id },
      });

      const tagIds: string[] = [];
      for (const name of tagNames) {
        if (name.trim()) {
          const tid = await getOrCreateTag(userId, name.trim());
          tagIds.push(tid);
        }
      }

      updateData.tags = {
        create: tagIds.map((tagId) => ({
          tag: { connect: { id: tagId } },
        })),
      };
    }

    await db.resource.update({
      where: { id },
      data: updateData,
    });

    await logActivity({
      userId,
      action: status === "COMPLETED" && existing.status !== "COMPLETED" ? "COMPLETE" : "UPDATE",
      entityType: "resource",
      entityId: id,
      meta: { title: title || existing.title, status: status || existing.status },
    });

    revalidatePath("/resources");
    revalidatePath("/dashboard");

    return { ok: true, data: { id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update resource",
    };
  }
}

/**
 * Fast status toggle / update action
 */
export async function updateResourceStatusAction(
  rawInput: { id: string; status: ResourceStatus }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = updateResourceStatusSchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: "Invalid status" };
    }

    const { id, status } = validated.data;

    const existing = await db.resource.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "update", { type: "resource", data: { userId: existing.userId } })) {
      return { ok: false, error: "Resource not found or unauthorized" };
    }

    const completedAt =
      status === "COMPLETED"
        ? existing.completedAt || new Date()
        : null;

    await db.resource.update({
      where: { id },
      data: { status, completedAt },
    });

    await logActivity({
      userId: session.user.id,
      action: status === "COMPLETED" ? "COMPLETE" : "UPDATE",
      entityType: "resource",
      entityId: id,
      meta: { title: existing.title, oldStatus: existing.status, newStatus: status },
    });

    revalidatePath("/resources");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}

/**
 * Fast favorite toggle action
 */
export async function toggleFavoriteAction(
  rawInput: { id: string }
): Promise<ActionResult<{ isFavorite: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = toggleFavoriteSchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: "Invalid ID" };
    }

    const { id } = validated.data;

    const existing = await db.resource.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "update", { type: "resource", data: { userId: existing.userId } })) {
      return { ok: false, error: "Resource not found or unauthorized" };
    }

    const nextFavorite = !existing.isFavorite;

    await db.resource.update({
      where: { id },
      data: { isFavorite: nextFavorite },
    });

    revalidatePath("/resources");
    revalidatePath("/dashboard");

    return { ok: true, data: { isFavorite: nextFavorite } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to toggle favorite",
    };
  }
}

/**
 * Delete a resource
 */
export async function deleteResourceAction(
  rawInput: { id: string }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = deleteResourceSchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: "Invalid ID" };
    }

    const { id } = validated.data;

    const existing = await db.resource.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "delete", { type: "resource", data: { userId: existing.userId } })) {
      return { ok: false, error: "Resource not found or unauthorized" };
    }

    await db.resource.delete({
      where: { id },
    });

    await logActivity({
      userId: session.user.id,
      action: "DELETE",
      entityType: "resource",
      entityId: id,
      meta: { title: existing.title },
    });

    revalidatePath("/resources");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete resource",
    };
  }
}
