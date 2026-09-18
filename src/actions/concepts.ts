"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import { getOrCreateTag } from "@/actions/tags";
import { Prisma } from "@prisma/client";
import {
  createConceptSchema,
  updateConceptSchema,
  updateMasteryLevelSchema,
  toggleConceptFavoriteSchema,
  deleteConceptSchema,
  type CreateConceptInput,
  type UpdateConceptInput,
  type MasteryLevel,
  type ConceptRelationType,
  type ConceptImportance,
} from "@/lib/validations/concept";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ConceptItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  notes: string | null;
  masteryLevel: MasteryLevel;
  importance: ConceptImportance;
  isFavorite: boolean;
  lastReviewedAt: Date | null;
  nextReviewAt: Date | null;
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
  tags: { id: string; name: string; color: string | null }[];
  resources: {
    id: string;
    title: string;
    type: string;
    url: string | null;
    status: string;
  }[];
  prerequisites: {
    relationId: string;
    conceptId: string;
    title: string;
    masteryLevel: MasteryLevel;
    relationType: ConceptRelationType;
  }[];
  dependents: {
    relationId: string;
    conceptId: string;
    title: string;
    masteryLevel: MasteryLevel;
    relationType: ConceptRelationType;
  }[];
}

export interface GraphNode {
  id: string;
  title: string;
  masteryLevel: MasteryLevel;
  importance: ConceptImportance;
  categoryId: string | null;
  categoryName: string | null;
  categoryLevel: number | null;
  resourcesCount: number;
  prerequisitesCount: number;
  dependentsCount: number;
  isFavorite: boolean;
}

export interface GraphLink {
  id: string;
  source: string; // conceptId
  target: string; // conceptId
  relationType: ConceptRelationType;
  strength: number;
}

export interface ConceptGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface ConceptFilterParams {
  masteryLevel?: MasteryLevel | "ALL";
  importance?: ConceptImportance | "ALL";
  categoryId?: string | null;
  isFavorite?: boolean;
  search?: string;
  sortBy?: "updatedAt" | "createdAt" | "title" | "mastery" | "importance";
  sortOrder?: "asc" | "desc";
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
 * Fetch all concepts for current user with filtering
 */
export async function getConceptsAction(
  filters: ConceptFilterParams = {}
): Promise<ActionResult<ConceptItem[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const userId = session.user.id;
    const {
      masteryLevel,
      importance,
      categoryId,
      isFavorite,
      search,
      sortBy = "updatedAt",
      sortOrder = "desc",
    } = filters;

    const where: Prisma.ConceptWhereInput = {
      userId,
    };

    if (masteryLevel && masteryLevel !== "ALL") {
      where.masteryLevel = masteryLevel;
    }

    if (importance && importance !== "ALL") {
      where.importance = importance;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (isFavorite === true) {
      where.isFavorite = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ];
    }

    let orderBy: Prisma.ConceptOrderByWithRelationInput = { updatedAt: sortOrder };
    if (sortBy === "title") {
      orderBy = { title: sortOrder };
    } else if (sortBy === "createdAt") {
      orderBy = { createdAt: sortOrder };
    }

    const concepts = await db.concept.findMany({
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
        resources: {
          select: {
            resource: {
              select: {
                id: true,
                title: true,
                type: true,
                url: true,
                status: true,
              },
            },
          },
        },
        incomingRelations: {
          select: {
            id: true,
            relationType: true,
            source: {
              select: {
                id: true,
                title: true,
                masteryLevel: true,
              },
            },
          },
        },
        outgoingRelations: {
          select: {
            id: true,
            relationType: true,
            target: {
              select: {
                id: true,
                title: true,
                masteryLevel: true,
              },
            },
          },
        },
      },
    });

    const formatted: ConceptItem[] = concepts.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      summary: c.summary,
      notes: c.notes,
      masteryLevel: c.masteryLevel,
      importance: c.importance,
      isFavorite: c.isFavorite,
      lastReviewedAt: c.lastReviewedAt,
      nextReviewAt: c.nextReviewAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      category: c.category,
      tags: c.tags.map((t) => t.tag),
      resources: c.resources.map((r) => ({
        id: r.resource.id,
        title: r.resource.title,
        type: r.resource.type,
        url: r.resource.url,
        status: r.resource.status,
      })),
      prerequisites: c.incomingRelations.map((rel) => ({
        relationId: rel.id,
        conceptId: rel.source.id,
        title: rel.source.title,
        masteryLevel: rel.source.masteryLevel,
        relationType: rel.relationType,
      })),
      dependents: c.outgoingRelations.map((rel) => ({
        relationId: rel.id,
        conceptId: rel.target.id,
        title: rel.target.title,
        masteryLevel: rel.target.masteryLevel,
        relationType: rel.relationType,
      })),
    }));

    return { ok: true, data: formatted };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load concepts",
    };
  }
}

/**
 * Fetch full Graph dataset (nodes & links) for interactive visualization
 */
export async function getConceptGraphAction(
  categoryId?: string | null
): Promise<ActionResult<ConceptGraphData>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const userId = session.user.id;
    const where: Prisma.ConceptWhereInput = { userId };
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const concepts = await db.concept.findMany({
      where,
      select: {
        id: true,
        title: true,
        masteryLevel: true,
        importance: true,
        isFavorite: true,
        categoryId: true,
        category: {
          select: {
            name: true,
            level: true,
          },
        },
        _count: {
          select: {
            resources: true,
            incomingRelations: true,
            outgoingRelations: true,
          },
        },
        outgoingRelations: {
          select: {
            id: true,
            targetId: true,
            relationType: true,
            strength: true,
          },
        },
      },
    });

    const nodeIds = new Set(concepts.map((c) => c.id));

    const nodes: GraphNode[] = concepts.map((c) => ({
      id: c.id,
      title: c.title,
      masteryLevel: c.masteryLevel,
      importance: c.importance,
      categoryId: c.categoryId,
      categoryName: c.category?.name || null,
      categoryLevel: c.category?.level || null,
      resourcesCount: c._count.resources,
      prerequisitesCount: c._count.incomingRelations,
      dependentsCount: c._count.outgoingRelations,
      isFavorite: c.isFavorite,
    }));

    const links: GraphLink[] = [];
    for (const c of concepts) {
      for (const rel of c.outgoingRelations) {
        if (nodeIds.has(rel.targetId)) {
          links.push({
            id: rel.id,
            source: c.id,
            target: rel.targetId,
            relationType: rel.relationType,
            strength: rel.strength,
          });
        }
      }
    }

    return { ok: true, data: { nodes, links } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load graph data",
    };
  }
}

/**
 * Fetch a single concept by ID with full details
 */
export async function getConceptByIdAction(
  id: string
): Promise<ActionResult<ConceptItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const concept = await db.concept.findUnique({
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
        resources: {
          select: {
            resource: {
              select: {
                id: true,
                title: true,
                type: true,
                url: true,
                status: true,
              },
            },
          },
        },
        incomingRelations: {
          select: {
            id: true,
            relationType: true,
            source: {
              select: {
                id: true,
                title: true,
                masteryLevel: true,
              },
            },
          },
        },
        outgoingRelations: {
          select: {
            id: true,
            relationType: true,
            target: {
              select: {
                id: true,
                title: true,
                masteryLevel: true,
              },
            },
          },
        },
      },
    });

    if (!concept || !can(session.user, "read", { type: "concept", data: { userId: concept.userId } })) {
      return { ok: false, error: "Concept not found or unauthorized" };
    }

    const formatted: ConceptItem = {
      id: concept.id,
      title: concept.title,
      slug: concept.slug,
      summary: concept.summary,
      notes: concept.notes,
      masteryLevel: concept.masteryLevel,
      importance: concept.importance,
      isFavorite: concept.isFavorite,
      lastReviewedAt: concept.lastReviewedAt,
      nextReviewAt: concept.nextReviewAt,
      createdAt: concept.createdAt,
      updatedAt: concept.updatedAt,
      category: concept.category,
      tags: concept.tags.map((t) => t.tag),
      resources: concept.resources.map((r) => ({
        id: r.resource.id,
        title: r.resource.title,
        type: r.resource.type,
        url: r.resource.url,
        status: r.resource.status,
      })),
      prerequisites: concept.incomingRelations.map((rel) => ({
        relationId: rel.id,
        conceptId: rel.source.id,
        title: rel.source.title,
        masteryLevel: rel.source.masteryLevel,
        relationType: rel.relationType,
      })),
      dependents: concept.outgoingRelations.map((rel) => ({
        relationId: rel.id,
        conceptId: rel.target.id,
        title: rel.target.title,
        masteryLevel: rel.target.masteryLevel,
        relationType: rel.relationType,
      })),
    };

    return { ok: true, data: formatted };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load concept",
    };
  }
}

/**
 * Create a new concept with relations, resources, and tags
 */
export async function createConceptAction(
  rawInput: CreateConceptInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = createConceptSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const {
      title,
      categoryId,
      summary,
      notes,
      masteryLevel,
      importance,
      isFavorite,
      tagNames = [],
      resourceIds = [],
      prerequisiteIds = [],
      dependentIds = [],
    } = validated.data;

    const userId = session.user.id;
    const baseSlug = slugify(title);
    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    // Validate category
    if (categoryId) {
      const cat = await db.category.findUnique({
        where: { id: categoryId },
      });
      if (!cat || cat.userId !== userId) {
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

    const created = await db.concept.create({
      data: {
        userId,
        title,
        slug: uniqueSlug,
        categoryId: categoryId || null,
        summary: summary || null,
        notes: notes || null,
        masteryLevel,
        importance,
        isFavorite,
        tags: {
          create: tagIds.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        resources: {
          create: resourceIds.map((resId) => ({
            resource: { connect: { id: resId } },
          })),
        },
      },
    });

    // Create prerequisite links (prerequisiteId -> created.id)
    if (prerequisiteIds.length > 0) {
      for (const pId of prerequisiteIds) {
        if (pId !== created.id) {
          await db.conceptRelation.create({
            data: {
              sourceId: pId,
              targetId: created.id,
              relationType: "PREREQUISITE_FOR",
            },
          });
        }
      }
    }

    // Create dependent links (created.id -> dependentId)
    if (dependentIds.length > 0) {
      for (const dId of dependentIds) {
        if (dId !== created.id) {
          await db.conceptRelation.create({
            data: {
              sourceId: created.id,
              targetId: dId,
              relationType: "PREREQUISITE_FOR",
            },
          });
        }
      }
    }

    await logActivity({
      userId,
      action: "CREATE",
      entityType: "concept",
      entityId: created.id,
      meta: { title, masteryLevel, importance },
    });

    revalidatePath("/concepts");
    revalidatePath("/dashboard");

    return { ok: true, data: { id: created.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create concept",
    };
  }
}

/**
 * Update an existing concept
 */
export async function updateConceptAction(
  rawInput: UpdateConceptInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = updateConceptSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const {
      id,
      title,
      categoryId,
      summary,
      notes,
      masteryLevel,
      importance,
      isFavorite,
      tagNames,
      resourceIds,
      prerequisiteIds,
      dependentIds,
    } = validated.data;

    const existing = await db.concept.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "update", { type: "concept", data: { userId: existing.userId } })) {
      return { ok: false, error: "Concept not found or unauthorized" };
    }

    const userId = session.user.id;

    // Validate category
    if (categoryId !== undefined) {
      if (categoryId) {
        const cat = await db.category.findUnique({
          where: { id: categoryId },
        });
        if (!cat || cat.userId !== userId) {
          return { ok: false, error: "Selected category does not exist" };
        }
      }
    }

    const updateData: Prisma.ConceptUpdateInput = {
      ...(title !== undefined && { title }),
      ...(categoryId !== undefined && { category: categoryId ? { connect: { id: categoryId } } : { disconnect: true } }),
      ...(summary !== undefined && { summary: summary || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(masteryLevel !== undefined && { masteryLevel }),
      ...(importance !== undefined && { importance }),
      ...(isFavorite !== undefined && { isFavorite }),
    };

    // Replace tags if provided
    if (tagNames !== undefined) {
      await db.conceptTag.deleteMany({
        where: { conceptId: id },
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

    // Replace resources if provided
    if (resourceIds !== undefined) {
      await db.conceptResource.deleteMany({
        where: { conceptId: id },
      });
      updateData.resources = {
        create: resourceIds.map((resId) => ({
          resource: { connect: { id: resId } },
        })),
      };
    }

    await db.concept.update({
      where: { id },
      data: updateData,
    });

    // Update prerequisite links
    if (prerequisiteIds !== undefined) {
      await db.conceptRelation.deleteMany({
        where: { targetId: id, relationType: "PREREQUISITE_FOR" },
      });
      for (const pId of prerequisiteIds) {
        if (pId !== id) {
          await db.conceptRelation.create({
            data: {
              sourceId: pId,
              targetId: id,
              relationType: "PREREQUISITE_FOR",
            },
          });
        }
      }
    }

    // Update dependent links
    if (dependentIds !== undefined) {
      await db.conceptRelation.deleteMany({
        where: { sourceId: id, relationType: "PREREQUISITE_FOR" },
      });
      for (const dId of dependentIds) {
        if (dId !== id) {
          await db.conceptRelation.create({
            data: {
              sourceId: id,
              targetId: dId,
              relationType: "PREREQUISITE_FOR",
            },
          });
        }
      }
    }

    await logActivity({
      userId,
      action: "UPDATE",
      entityType: "concept",
      entityId: id,
      meta: { title: title || existing.title, masteryLevel: masteryLevel || existing.masteryLevel },
    });

    revalidatePath("/concepts");
    revalidatePath("/dashboard");

    return { ok: true, data: { id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update concept",
    };
  }
}

/**
 * Fast inline mastery promotion / demotion action
 */
export async function updateMasteryLevelAction(
  rawInput: { id: string; masteryLevel: MasteryLevel }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = updateMasteryLevelSchema.safeParse(rawInput);
    if (!validated.success) {
      return { ok: false, error: "Invalid input" };
    }

    const { id, masteryLevel } = validated.data;

    const existing = await db.concept.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "update", { type: "concept", data: { userId: existing.userId } })) {
      return { ok: false, error: "Concept not found or unauthorized" };
    }

    await db.concept.update({
      where: { id },
      data: {
        masteryLevel,
        lastReviewedAt: new Date(),
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "concept",
      entityId: id,
      meta: { title: existing.title, oldMastery: existing.masteryLevel, newMastery: masteryLevel },
    });

    revalidatePath("/concepts");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update mastery level",
    };
  }
}

/**
 * Toggle concept favorite status
 */
export async function toggleConceptFavoriteAction(
  rawInput: string | { id: string }
): Promise<ActionResult<{ isFavorite: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const payload = typeof rawInput === "string" ? { id: rawInput } : rawInput;
    const validated = toggleConceptFavoriteSchema.safeParse(payload);
    if (!validated.success) {
      return { ok: false, error: "Invalid ID" };
    }

    const { id } = validated.data;

    const existing = await db.concept.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "update", { type: "concept", data: { userId: existing.userId } })) {
      return { ok: false, error: "Concept not found or unauthorized" };
    }

    const nextFavorite = !existing.isFavorite;

    await db.concept.update({
      where: { id },
      data: { isFavorite: nextFavorite },
    });

    revalidatePath("/concepts");
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
 * Delete a concept
 */
export async function deleteConceptAction(
  rawInput: string | { id: string }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const payload = typeof rawInput === "string" ? { id: rawInput } : rawInput;
    const validated = deleteConceptSchema.safeParse(payload);
    if (!validated.success) {
      return { ok: false, error: "Invalid ID" };
    }

    const { id } = validated.data;

    const existing = await db.concept.findUnique({
      where: { id },
    });

    if (!existing || !can(session.user, "delete", { type: "concept", data: { userId: existing.userId } })) {
      return { ok: false, error: "Concept not found or unauthorized" };
    }

    await db.concept.delete({
      where: { id },
    });

    await logActivity({
      userId: session.user.id,
      action: "DELETE",
      entityType: "concept",
      entityId: id,
      meta: { title: existing.title },
    });

    revalidatePath("/concepts");
    revalidatePath("/dashboard");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete concept",
    };
  }
}
