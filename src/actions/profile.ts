"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/profile";
import { detectSkillIcon } from "@/lib/skill-icons";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface PublicProfileData {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    bio: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
  stats: {
    totalStudyHours: number;
    completedResources: number;
    masteredConcepts: number;
    skillsCount: number;
    projectsCount: number;
  };
  skills: {
    id: string;
    name: string;
    progress: number;
    iconUrl: string | null;
    parentName?: string | null;
    children: { id: string; name: string; progress: number; iconUrl: string | null }[];
  }[];
  projects: {
    id: string;
    name: string;
    description: string | null;
    url: string | null;
    repoUrl: string | null;
    thumbnailUrl: string | null;
    status: string;
    skills: { id: string; name: string; iconUrl: string | null }[];
  }[];
  concepts: {
    id: string;
    title: string;
    masteryLevel: string;
    categoryName?: string | null;
  }[];
}

export async function getProfileSettingsAction(): Promise<
  ActionResult<{
    name: string | null;
    username: string | null;
    bio: string | null;
    isProfilePublic: boolean;
    email: string;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        username: true,
        bio: true,
        isProfilePublic: true,
        email: true,
      },
    });

    if (!user) {
      return { ok: false, error: "User not found" };
    }

    return { ok: true, data: user };
  } catch (error) {
    console.error("getProfileSettingsAction error:", error);
    return { ok: false, error: "Failed to fetch profile settings" };
  }
}

export async function updateProfileSettingsAction(
  input: UpdateProfileInput
): Promise<ActionResult<{ username: string | null }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const validated = updateProfileSchema.safeParse(input);
    if (!validated.success) {
      return { ok: false, error: validated.error.issues[0]?.message || "Invalid input" };
    }

    const { name, username, bio, isProfilePublic } = validated.data;

    // Check if username is already taken by another user
    const existing = await db.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existing && existing.id !== session.user.id) {
      return { ok: false, error: "This username is already taken. Please choose another." };
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: {
        name,
        username,
        bio: bio || null,
        isProfilePublic,
      },
      select: { username: true },
    });

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "user",
      entityId: session.user.id,
      meta: { isProfilePublic, username },
    });

    revalidatePath("/settings");
    revalidatePath(`/u/${username}`);
    return { ok: true, data: updated };
  } catch (error) {
    console.error("updateProfileSettingsAction error:", error);
    return { ok: false, error: "Failed to update profile settings" };
  }
}

export async function getPublicProfileAction(
  username: string
): Promise<ActionResult<PublicProfileData>> {
  try {
    const cleanUsername = username.trim().toLowerCase();

    const user = await db.user.findFirst({
      where: {
        username: { equals: cleanUsername, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        avatarUrl: true,
        isProfilePublic: true,
        createdAt: true,
      },
    });

    if (!user) {
      return { ok: false, error: "User not found" };
    }

    // Check visibility: if not public, check if current session is the owner
    const session = await auth();
    const isOwner = session?.user?.id === user.id;

    if (!user.isProfilePublic && !isOwner) {
      return { ok: false, error: "This user profile is private." };
    }

    // Fetch public showcase data in parallel
    const [studySessions, completedResources, masteredConcepts, rawSkills, rawProjects, concepts] =
      await Promise.all([
        db.studySession.findMany({
          where: { userId: user.id },
          select: { durationMinutes: true },
        }),
        db.resource.count({
          where: { userId: user.id, status: "COMPLETED" },
        }),
        db.concept.count({
          where: { userId: user.id, masteryLevel: "MASTERED" },
        }),
        db.skill.findMany({
          where: { userId: user.id },
          include: {
            parent: { select: { name: true } },
            children: true,
          },
          orderBy: { progress: "desc" },
        }),
        db.project.findMany({
          where: { userId: user.id },
          include: {
            skills: {
              include: { skill: { select: { id: true, name: true, iconUrl: true } } },
            },
          },
          orderBy: { updatedAt: "desc" },
        }),
        db.concept.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            title: true,
            masteryLevel: true,
            category: { select: { name: true } },
          },
          orderBy: { masteryLevel: "desc" },
          take: 12,
        }),
      ]);

    const totalMinutes = studySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const totalStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Filter top-level skills
    const rootSkills = rawSkills
      .filter((s) => !s.parentId)
      .map((s) => ({
        id: s.id,
        name: s.name,
        progress: s.progress,
        iconUrl: s.iconUrl || detectSkillIcon(s.name),
        children: s.children.map((child) => ({
          id: child.id,
          name: child.name,
          progress: child.progress,
          iconUrl: child.iconUrl || detectSkillIcon(child.name),
        })),
      }));

    const formattedProjects = rawProjects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      url: p.url,
      repoUrl: p.repoUrl,
      thumbnailUrl: p.thumbnailUrl,
      status: p.status,
      skills: p.skills.map((ps) => ({
        id: ps.skill.id,
        name: ps.skill.name,
        iconUrl: ps.skill.iconUrl || detectSkillIcon(ps.skill.name),
      })),
    }));

    const formattedConcepts = concepts.map((c) => ({
      id: c.id,
      title: c.title,
      masteryLevel: c.masteryLevel,
      categoryName: c.category?.name || null,
    }));

    return {
      ok: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
        stats: {
          totalStudyHours,
          completedResources,
          masteredConcepts,
          skillsCount: rawSkills.length,
          projectsCount: rawProjects.length,
        },
        skills: rootSkills,
        projects: formattedProjects,
        concepts: formattedConcepts,
      },
    };
  } catch (error) {
    console.error("getPublicProfileAction error:", error);
    return { ok: false, error: "Failed to load public profile." };
  }
}
