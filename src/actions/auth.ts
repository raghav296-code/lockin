"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth";
import { signOut } from "@/lib/auth";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Register a new user with email, username, and password.
 */
export async function signUpAction(rawInput: SignUpInput): Promise<ActionResult<{ userId: string }>> {
  try {
    const validated = signUpSchema.safeParse(rawInput);

    if (!validated.success) {
      const firstIssue = validated.error.issues[0];
      return {
        ok: false,
        error: firstIssue?.message || "Invalid input",
      };
    }

    const { name, username, email, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    // Check if email already exists
    const existingEmail = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      return {
        ok: false,
        error: "An account with this email address already exists",
      };
    }

    // Check if username already exists
    const existingUsername = await db.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUsername) {
      return {
        ok: false,
        error: "This username is already taken. Please pick another",
      };
    }

    // Hash password with salt 12
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.user.create({
      data: {
        name: name.trim(),
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        role: "USER",
      },
      select: {
        id: true,
      },
    });

    return {
      ok: true,
      data: { userId: newUser.id },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create account";
    return {
      ok: false,
      error: message,
    };
  }
}

/**
 * Server action to sign out current user
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}
