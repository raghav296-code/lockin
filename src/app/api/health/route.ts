import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL);

  if (!hasDbUrl) {
    return NextResponse.json(
      {
        ok: false,
        status: "unconfigured",
        message: "DATABASE_URL is not set in .env. Please configure your PostgreSQL connection string.",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  try {
    // Perform a test query to verify database connection and schema
    const [userCount] = await Promise.all([
      db.user.count(),
    ]);

    return NextResponse.json(
      {
        ok: true,
        status: "healthy",
        database: "connected",
        userCount,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown database error";

    return NextResponse.json(
      {
        ok: false,
        status: "disconnected",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
