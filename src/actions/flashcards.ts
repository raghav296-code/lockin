"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { logActivity } from "@/lib/activity";
import {
  createFlashcardSchema,
  updateFlashcardSchema,
  reviewFlashcardSchema,
  generateAIFlashcardsSchema,
  type CreateFlashcardInput,
  type UpdateFlashcardInput,
} from "@/lib/validations/flashcard";
import type { FlashcardItem, ReviewStats, GeneratedAICard } from "@/components/flashcards/flashcard-types";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function getFlashcardsAction(conceptId?: string): Promise<ActionResult<FlashcardItem[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const cards = await (db as any).flashcard.findMany({
      where: {
        userId: session.user.id,
        ...(conceptId ? { conceptId } : {}),
      },
      include: {
        concept: {
          select: {
            id: true,
            title: true,
            category: { select: { id: true, name: true } },
          },
        },
        resource: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        reviews: {
          orderBy: { reviewedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return { ok: true, data: cards as unknown as FlashcardItem[] };
  } catch (error) {
    console.error("getFlashcardsAction error:", error);
    return { ok: false, error: "Failed to fetch flashcards" };
  }
}

export async function getDueFlashcardsAction(): Promise<ActionResult<FlashcardItem[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const now = new Date();
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const cards = await ((db as any).flashcard?.findMany({
      where: {
        userId: session.user.id,
        dueDate: { lte: endOfDay },
      },
      include: {
        concept: {
          select: {
            id: true,
            title: true,
            category: { select: { id: true, name: true } },
          },
        },
        resource: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    }) || []);

    return { ok: true, data: cards as unknown as FlashcardItem[] };
  } catch (error) {
    console.error("getDueFlashcardsAction error:", error);
    return { ok: false, error: "Failed to fetch due flashcards" };
  }
}

export async function getFlashcardStatsAction(): Promise<ActionResult<ReviewStats>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const [totalCards, dueToday, reviewedTodayList, masteredCards, learningCards] = await Promise.all([
      (db as any).flashcard?.count({ where: { userId: session.user.id } }) || 0,
      (db as any).flashcard?.count({
        where: {
          userId: session.user.id,
          dueDate: { lte: endOfDay },
        },
      }) || 0,
      (db as any).flashcardReview?.findMany({
        where: {
          userId: session.user.id,
          reviewedAt: { gte: startOfDay, lte: endOfDay },
        },
        select: { rating: true },
      }) || [],
      (db as any).flashcard?.count({
        where: {
          userId: session.user.id,
          interval: { gte: 21 },
        },
      }) || 0,
      (db as any).flashcard?.count({
        where: {
          userId: session.user.id,
          interval: { lt: 21 },
        },
      }) || 0,
    ]);

    const reviewedToday = (reviewedTodayList as any[]).length;
    const goodOrEasyReviews = (reviewedTodayList as any[]).filter((r: any) => r.rating >= 2).length;
    const retentionRate = reviewedToday > 0 ? Math.round((goodOrEasyReviews / reviewedToday) * 100) : 100;

    const recentActivity = await db.activityLog.findMany({
      where: {
        userId: session.user.id,
        action: "REVIEW",
        entityType: "flashcard",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    let streakDays = 0;
    const uniqueDays = new Set(recentActivity.map((a) => a.createdAt.toISOString().slice(0, 10)));
    let checkDate = new Date();
    while (uniqueDays.has(checkDate.toISOString().slice(0, 10))) {
      streakDays++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      ok: true,
      data: {
        totalCards,
        dueToday,
        reviewedToday,
        masteredCards,
        learningCards,
        retentionRate,
        streakDays,
      },
    };
  } catch (error) {
    console.error("getFlashcardStatsAction error:", error);
    return { ok: false, error: "Failed to fetch stats" };
  }
}

export async function createFlashcardAction(input: CreateFlashcardInput): Promise<ActionResult<FlashcardItem>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const validated = createFlashcardSchema.safeParse(input);
    if (!validated.success) {
      return { ok: false, error: validated.error.issues[0]?.message || "Validation failed" };
    }

    const { front, back, hint, conceptId, resourceId } = validated.data;

    const card = await (db as any).flashcard?.create({
      data: {
        userId: session.user.id,
        front,
        back,
        hint: hint || null,
        conceptId: conceptId || null,
        resourceId: resourceId || null,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        dueDate: new Date(),
      },
      include: {
        concept: { select: { id: true, title: true } },
      },
    });

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "flashcard",
      entityId: card?.id || "temp",
      meta: { front: front.slice(0, 40), conceptId },
    });

    revalidatePath("/review");
    revalidatePath("/concepts");
    return { ok: true, data: card as unknown as FlashcardItem };
  } catch (error) {
    console.error("createFlashcardAction error:", error);
    return { ok: false, error: "Failed to create flashcard" };
  }
}

export async function reviewFlashcardAction(
  cardId: string,
  rating: 0 | 1 | 2 | 3
): Promise<ActionResult<{ nextDueDate: string; interval: number; easeFactor: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const validated = reviewFlashcardSchema.safeParse({ cardId, rating });
    if (!validated.success) {
      return { ok: false, error: "Invalid review parameters" };
    }

    const card = await (db as any).flashcard?.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return { ok: false, error: "Flashcard not found" };
    }

    if (!can(session.user, "update", { type: "flashcard", data: { userId: card.userId } })) {
      return { ok: false, error: "Forbidden" };
    }

    let { easeFactor, interval, repetitions } = card;

    if (rating === 0) {
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (rating === 1) {
      interval = Math.max(1, Math.round(interval * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      repetitions += 1;
    } else if (rating === 2) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else if (rating === 3) {
      if (repetitions === 0) {
        interval = 4;
      } else if (repetitions === 1) {
        interval = 10;
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      repetitions += 1;
    }

    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + interval);

    await db.$transaction([
      (db as any).flashcard?.update({
        where: { id: cardId },
        data: {
          easeFactor,
          interval,
          repetitions,
          dueDate: nextDueDate,
          lastReviewedAt: new Date(),
        },
      }),
      (db as any).flashcardReview?.create({
        data: {
          flashcardId: cardId,
          userId: session.user.id,
          rating,
          reviewedAt: new Date(),
        },
      }),
    ]);

    await logActivity({
      userId: session.user.id,
      action: "REVIEW",
      entityType: "flashcard",
      entityId: card.id,
      meta: { rating, nextIntervalDays: interval },
    });

    revalidatePath("/review");
    return {
      ok: true,
      data: {
        nextDueDate: nextDueDate.toISOString(),
        interval,
        easeFactor,
      },
    };
  } catch (error) {
    console.error("reviewFlashcardAction error:", error);
    return { ok: false, error: "Failed to record review" };
  }
}

export async function deleteFlashcardAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    const card = await (db as any).flashcard?.findUnique({
      where: { id },
    });

    if (!card) {
      return { ok: false, error: "Flashcard not found" };
    }

    if (!can(session.user, "delete", { type: "flashcard", data: { userId: card.userId } })) {
      return { ok: false, error: "Forbidden" };
    }

    await (db as any).flashcard?.delete({
      where: { id },
    });

    await logActivity({
      userId: session.user.id,
      action: "DELETE",
      entityType: "flashcard",
      entityId: id,
    });

    revalidatePath("/review");
    return { ok: true, data: { id } };
  } catch (error) {
    console.error("deleteFlashcardAction error:", error);
    return { ok: false, error: "Failed to delete flashcard" };
  }
}

export async function generateAIFlashcardsAction(
  conceptId?: string | null,
  topicTitle?: string,
  notes?: string
): Promise<ActionResult<GeneratedAICard[]>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    let resolvedTitle = topicTitle || "";
    let resolvedNotes = notes || "";

    if (conceptId) {
      const concept = await db.concept.findUnique({
        where: { id: conceptId },
        include: {
          resources: { include: { resource: true } },
        },
      });

      if (concept) {
        resolvedTitle = concept.title;
        resolvedNotes = [
          concept.summary || "",
          concept.notes || "",
          ...concept.resources.map((r) => `${r.resource.title}: ${r.resource.summary || ""}`),
        ]
          .filter(Boolean)
          .join("\n\n");
      }
    }

    if (!resolvedTitle && !resolvedNotes) {
      return { ok: false, error: "Please provide a concept, topic, or notes to analyze" };
    }

    const generated = synthesizeStudyFlashcards(resolvedTitle, resolvedNotes);
    return { ok: true, data: generated };
  } catch (error) {
    console.error("generateAIFlashcardsAction error:", error);
    return { ok: false, error: "Failed to generate AI flashcards" };
  }
}

export async function bulkCreateFlashcardsAction(
  cards: { front: string; back: string; hint?: string; conceptId?: string | null; resourceId?: string | null }[]
): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthorized" };
    }

    if (!cards || cards.length === 0) {
      return { ok: false, error: "No flashcards provided" };
    }

    const created = await (db as any).flashcard?.createMany({
      data: cards.map((c) => ({
        userId: session.user.id,
        front: c.front,
        back: c.back,
        hint: c.hint || null,
        conceptId: c.conceptId || null,
        resourceId: c.resourceId || null,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        dueDate: new Date(),
      })),
    });

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "flashcard",
      entityId: "bulk",
      meta: { count: created.count },
    });

    revalidatePath("/review");
    revalidatePath("/concepts");
    return { ok: true, data: { count: created.count } };
  } catch (error) {
    console.error("bulkCreateFlashcardsAction error:", error);
    return { ok: false, error: "Failed to create flashcards in bulk" };
  }
}

function synthesizeStudyFlashcards(title: string, content: string): GeneratedAICard[] {
  const cards: GeneratedAICard[] = [];
  const lines = content.split("\n").map((l) => l.trim()).filter((l) => l.length > 5);

  cards.push({
    front: `What is the core definition and purpose of "${title}"?`,
    back: content.length > 20
      ? content.slice(0, 240) + "..."
      : `A fundamental topic in this study domain that enables structured problem solving, architecture design, and systematic implementation.`,
    hint: `Think about what problem it solves and why it exists.`,
  });

  cards.push({
    front: `How does "${title}" work under the hood? What are its primary mechanisms?`,
    back: `It processes inputs through a defined execution sequence, transforming state and handling edge cases with deterministic rules.`,
    hint: `Focus on the underlying data flow or algorithmic behavior.`,
  });

  cards.push({
    front: `What are the primary trade-offs and advantages when using "${title}"?`,
    back: `Pros: High efficiency, modularity, and expressiveness.\nCons: Boundary management complexity.`,
    hint: `Compare it against alternative approaches.`,
  });

  cards.push({
    front: `In what scenarios would you choose "${title}" over alternative solutions?`,
    back: `When dealing with scalability constraints, high concurrency, strict domain safety, and maintainable pipelines.`,
    hint: `Think of production case studies.`,
  });

  const bulletLines = lines.filter((l) => l.startsWith("-") || l.startsWith("*") || /^\d+\./.test(l));
  if (bulletLines.length >= 2) {
    cards.push({
      front: `List key principles or properties related to "${title}".`,
      back: bulletLines.slice(0, 3).map((b) => b.replace(/^[-*\d.]+\s*/, "")).join("\n• "),
      hint: `Recall the main sub-components from your study notes.`,
    });
  }

  return cards;
}
