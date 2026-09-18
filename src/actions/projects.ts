"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import {
  createProjectSchema,
  updateProjectSchema,
  deleteProjectSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type ProjectStatus,
} from "@/lib/validations/project";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ProjectSkillItem {
  id: string;
  name: string;
  iconUrl: string | null;
  progress: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  repoUrl: string | null;
  thumbnailUrl: string | null;
  status: ProjectStatus;
  skills: ProjectSkillItem[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch all projects for the current user
 */
export async function getProjectsAction(): Promise<ActionResult<ProjectItem[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const projects = await db.project.findMany({
      where: { userId: session.user.id },
      include: {
        skills: {
          include: {
            skill: {
              select: { id: true, name: true, iconUrl: true, progress: true },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    const formatted: ProjectItem[] = projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      url: p.url,
      repoUrl: p.repoUrl,
      thumbnailUrl: p.thumbnailUrl,
      status: p.status as ProjectStatus,
      skills: p.skills.map((s) => ({
        id: s.skill.id,
        name: s.skill.name,
        iconUrl: s.skill.iconUrl,
        progress: s.skill.progress,
      })),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return { ok: true, data: formatted };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load projects",
    };
  }
}

/**
 * Create a new Project with linked skills
 */
export async function createProjectAction(
  rawInput: CreateProjectInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = createProjectSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const { name, description, url, repoUrl, status, skillIds } = validated.data;

    const newProject = await db.project.create({
      data: {
        userId: session.user.id,
        name,
        description: description || null,
        url: url || null,
        repoUrl: repoUrl || null,
        status,
        skills: {
          create: (skillIds || []).map((skillId) => ({ skillId })),
        },
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "project",
      entityId: newProject.id,
      meta: { name, status },
    });

    revalidatePath("/skills");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: newProject.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create project",
    };
  }
}

/**
 * Update an existing Project
 */
export async function updateProjectAction(
  rawInput: UpdateProjectInput
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = updateProjectSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const { id, name, description, url, repoUrl, status, skillIds } = validated.data;

    const project = await db.project.findUnique({
      where: { id },
    });

    if (
      !project ||
      !can(session.user, "update", {
        type: "project",
        data: { userId: project.userId },
      })
    ) {
      return { ok: false, error: "Permission denied or project not found" };
    }

    // Update basic fields
    await db.project.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(url !== undefined ? { url: url || null } : {}),
        ...(repoUrl !== undefined ? { repoUrl: repoUrl || null } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });

    // Update skill relations if supplied
    if (skillIds !== undefined) {
      await db.skillProject.deleteMany({
        where: { projectId: id },
      });

      if (skillIds.length > 0) {
        await db.skillProject.createMany({
          data: skillIds.map((skillId) => ({
            projectId: id,
            skillId,
          })),
        });
      }
    }

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "project",
      entityId: id,
      meta: { name: name || project.name },
    });

    revalidatePath("/skills");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update project",
    };
  }
}

/**
 * Delete a Project
 */
export async function deleteProjectAction(
  rawInput: { id: string }
): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const validated = deleteProjectSchema.safeParse(rawInput);
    if (!validated.success) {
      return {
        ok: false,
        error: validated.error.issues[0]?.message || "Invalid input",
      };
    }

    const { id } = validated.data;

    const project = await db.project.findUnique({
      where: { id },
    });

    if (
      !project ||
      !can(session.user, "delete", {
        type: "project",
        data: { userId: project.userId },
      })
    ) {
      return { ok: false, error: "Permission denied or project not found" };
    }

    await db.project.delete({
      where: { id },
    });

    await logActivity({
      userId: session.user.id,
      action: "DELETE",
      entityType: "project",
      entityId: id,
      meta: { name: project.name },
    });

    revalidatePath("/skills");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete project",
    };
  }
}
