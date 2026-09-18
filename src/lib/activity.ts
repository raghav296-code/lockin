import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ActivityAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "COMPLETE"
  | "UNCOMPLETE"
  | "REPARENT"
  | "LINK"
  | "UNLINK"
  | "REVIEW";

export type ActivityEntityType =
  | "category"
  | "tag"
  | "resource"
  | "concept"
  | "skill"
  | "project"
  | "goal"
  | "task"
  | "flashcard"
  | "user";

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  meta,
}: {
  userId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  meta?: Prisma.InputJsonValue;
}) {
  try {
    await db.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        meta: meta ?? undefined,
      },
    });
  } catch (error) {
    // Log non-fatal error so activity logging does not block the primary transaction
    console.error("Failed to write to activity_log:", error);
  }
}
