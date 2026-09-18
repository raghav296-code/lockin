export type Role = "OWNER" | "ADMIN" | "USER";

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: Role;
  username?: string | null;
}

export type Action =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "manage"
  | "view_admin";

export type EntityType =
  | "user"
  | "category"
  | "tag"
  | "resource"
  | "concept"
  | "skill"
  | "project"
  | "goal"
  | "task"
  | "flashcard"
  | "activity_log";

export interface EntityWithUser {
  userId?: string;
  isProfilePublic?: boolean;
  visibility?: "PRIVATE" | "PUBLIC" | "SHARED";
  [key: string]: unknown;
}

/**
 * Centralised permission check.
 * Every API route and Server Action must call this rather than ad-hoc checks.
 */
export function can(
  user: SessionUser | null | undefined,
  action: Action,
  entity: { type: EntityType; data?: EntityWithUser }
): boolean {
  if (!user) {
    // Unauthenticated user can only read public resources or public profiles
    if (action === "read" && entity.data?.visibility === "PUBLIC") {
      return true;
    }
    if (action === "read" && entity.type === "user" && entity.data?.isProfilePublic) {
      return true;
    }
    return false;
  }

  // Owner has unrestricted access
  if (user.role === "OWNER") {
    return true;
  }

  // Admin has access to admin views and management
  if (user.role === "ADMIN") {
    if (action === "view_admin") return true;
    // Admins can manage system-level records, but user ownership checks still apply for personal content
  }

  // Default entity-level permission: User owns the entity
  if (entity.data && entity.data.userId) {
    if (entity.data.userId === user.id) {
      return true;
    }
    // Read shared or public entities
    if (action === "read") {
      return (
        entity.data.visibility === "PUBLIC" ||
        entity.data.visibility === "SHARED"
      );
    }
    return false;
  }

  // For creating entities under the user's account
  if (action === "create") {
    return true;
  }

  return false;
}
