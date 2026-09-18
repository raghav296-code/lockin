"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface TagItem {
  id: string;
  name: string;
  color: string | null;
  count?: number;
}

/**
 * Fetch all tags for the current user with usage count
 */
export async function getTagsAction(): Promise<ActionResult<TagItem[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const tags = await db.tag.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { resources: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const result: TagItem[] = tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      count: t._count.resources,
    }));

    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load tags",
    };
  }
}

/**
 * Create or get a tag for the current user
 */
export async function getOrCreateTag(
  userId: string,
  name: string,
  color?: string
): Promise<string> {
  const normalizedName = name.trim().toLowerCase();
  const existing = await db.tag.findUnique({
    where: {
      userId_name: {
        userId,
        name: normalizedName,
      },
    },
  });

  if (existing) {
    return existing.id;
  }

  const created = await db.tag.create({
    data: {
      userId,
      name: normalizedName,
      color: color || null,
    },
  });

  await logActivity({
    userId,
    action: "CREATE",
    entityType: "tag",
    entityId: created.id,
    meta: { name: normalizedName },
  });

  return created.id;
}
