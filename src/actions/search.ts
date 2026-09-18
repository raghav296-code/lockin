"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { detectSkillIcon } from "@/lib/skill-icons";
import type {
  SearchResultItem,
  GroupedSearchResults,
} from "@/components/search/search-types";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function globalSearchAction(
  query: string
): Promise<ActionResult<GroupedSearchResults>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const userId = session.user.id;
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return {
        ok: true,
        data: {
          resources: [],
          concepts: [],
          skills: [],
          projects: [],
          tasks: [],
          categories: [],
          total: 0,
        },
      };
    }

    // Parallel multi-entity search queries
    const [
      resources,
      concepts,
      skills,
      projects,
      tasks,
      categories,
    ] = await Promise.all([
      db.resource.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: cleanQuery, mode: "insensitive" } },
            { notes: { contains: cleanQuery, mode: "insensitive" } },
            { summary: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          category: { select: { name: true } },
        },
        take: 6,
      }),
      db.concept.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: cleanQuery, mode: "insensitive" } },
            { summary: { contains: cleanQuery, mode: "insensitive" } },
            { notes: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          masteryLevel: true,
          category: { select: { name: true } },
        },
        take: 6,
      }),
      db.skill.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: cleanQuery, mode: "insensitive" } },
            { description: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        include: {
          category: { select: { name: true } },
          parent: { select: { name: true } },
        },
        take: 6,
      }),
      db.project.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: cleanQuery, mode: "insensitive" } },
            { description: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          status: true,
          url: true,
        },
        take: 6,
      }),
      db.studyTask.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: cleanQuery, mode: "insensitive" } },
            { description: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          startTime: true,
          endTime: true,
        },
        take: 6,
      }),
      db.category.findMany({
        where: {
          userId,
          name: { contains: cleanQuery, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          level: true,
        },
        take: 4,
      }),
    ]);

    const formattedResources: SearchResultItem[] = resources.map((r) => ({
      id: r.id,
      type: "resource",
      title: r.title,
      subtitle: r.category?.name ? `In ${r.category.name}` : r.type,
      href: `/resources?id=${r.id}`,
      badge: r.status.replace("_", " "),
    }));

    const formattedConcepts: SearchResultItem[] = concepts.map((c) => ({
      id: c.id,
      type: "concept",
      title: c.title,
      subtitle: c.category?.name || "Concept node",
      href: `/concepts?id=${c.id}`,
      badge: c.masteryLevel,
    }));

    const formattedSkills: SearchResultItem[] = skills.map((s) => ({
      id: s.id,
      type: "skill",
      title: s.name,
      subtitle: s.parent?.name
        ? `Sub-skill of ${s.parent.name}`
        : s.category?.name || "Core skill",
      href: `/skills`,
      badge: `${s.progress}%`,
      iconUrl: s.iconUrl || detectSkillIcon(s.name),
    }));

    const formattedProjects: SearchResultItem[] = projects.map((p) => ({
      id: p.id,
      type: "project",
      title: p.name,
      subtitle: p.url ? "Live demo available" : "Project repo",
      href: `/skills`,
      badge: p.status.replace("_", " "),
    }));

    const formattedTasks: SearchResultItem[] = tasks.map((t) => ({
      id: t.id,
      type: "task",
      title: t.title,
      subtitle: t.startTime ? `${t.startTime} - ${t.endTime || ""}` : "Calendar block",
      href: `/planner`,
      badge: t.priority,
    }));

    const formattedCategories: SearchResultItem[] = categories.map((cat) => ({
      id: cat.id,
      type: "category",
      title: cat.name,
      subtitle: cat.level === 1 ? "Field" : cat.level === 2 ? "Subject" : "Topic",
      href: `/settings/categories`,
      badge: `Lvl ${cat.level}`,
    }));

    const total =
      formattedResources.length +
      formattedConcepts.length +
      formattedSkills.length +
      formattedProjects.length +
      formattedTasks.length +
      formattedCategories.length;

    return {
      ok: true,
      data: {
        resources: formattedResources,
        concepts: formattedConcepts,
        skills: formattedSkills,
        projects: formattedProjects,
        tasks: formattedTasks,
        categories: formattedCategories,
        total,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Search query failed",
    };
  }
}
