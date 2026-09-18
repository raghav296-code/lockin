"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { format, subDays, differenceInCalendarDays, parseISO } from "date-fns";
import type { AnalyticsData, HeatmapDay, DailyVelocityItem, SubjectDistributionItem } from "@/components/analytics/analytics-types";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

const APPLE_PALETTE = [
  "#007AFF", // Blue
  "#AF52DE", // Purple
  "#34C759", // Green
  "#FF9500", // Orange
  "#FF2D55", // Pink
  "#5AC8FA", // Teal
  "#5856D6", // Indigo
];

export async function getAnalyticsDataAction(): Promise<ActionResult<AnalyticsData>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { ok: false, error: "Unauthenticated" };
    }

    const userId = session.user.id;
    const now = new Date();
    const oneYearAgo = subDays(now, 365);
    const ninetyDaysAgo = subDays(now, 90);

    // Parallel aggregation fetching
    const [
      activityLogs,
      studySessions,
      completedTasks,
      totalFocusSum,
      conceptCounts,
      resourceCounts,
      categories,
    ] = await Promise.all([
      db.activityLog.findMany({
        where: {
          userId,
          createdAt: { gte: oneYearAgo },
        },
        select: { createdAt: true },
      }),
      db.studySession.findMany({
        where: {
          userId,
          startedAt: { gte: oneYearAgo },
        },
        select: { startedAt: true, durationMinutes: true },
      }),
      db.studyTask.findMany({
        where: {
          userId,
          status: "DONE",
          updatedAt: { gte: ninetyDaysAgo },
        },
        select: { updatedAt: true },
      }),
      db.studySession.aggregate({
        where: { userId },
        _sum: { durationMinutes: true },
      }),
      db.concept.findMany({
        where: { userId },
        select: { masteryLevel: true, category: { select: { name: true } } },
      }),
      db.resource.findMany({
        where: { userId },
        select: { status: true, category: { select: { name: true } } },
      }),
      db.category.findMany({
        where: { userId, parentId: null },
        select: { id: true, name: true },
      }),
    ]);

    // 1. Calculate Activity Map by Date
    const dailyActivityCount = new Map<string, number>();
    const dailyFocusMinutes = new Map<string, number>();

    for (const log of activityLogs) {
      const dayKey = format(log.createdAt, "yyyy-MM-dd");
      dailyActivityCount.set(dayKey, (dailyActivityCount.get(dayKey) || 0) + 1);
    }

    for (const s of studySessions) {
      const dayKey = format(s.startedAt, "yyyy-MM-dd");
      dailyFocusMinutes.set(dayKey, (dailyFocusMinutes.get(dayKey) || 0) + s.durationMinutes);
      dailyActivityCount.set(dayKey, (dailyActivityCount.get(dayKey) || 0) + 1);
    }

    // Generate full 365-day array for the Heatmap
    const heatmapDays: HeatmapDay[] = [];
    let activeDaysCount = 0;

    for (let i = 365; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const count = dailyActivityCount.get(dateStr) || 0;
      const focus = dailyFocusMinutes.get(dateStr) || 0;

      if (count > 0 || focus > 0) {
        activeDaysCount++;
      }

      // Determine Apple color intensity level (0 to 4)
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (focus >= 120 || count >= 8) level = 4;
      else if (focus >= 60 || count >= 5) level = 3;
      else if (focus >= 25 || count >= 2) level = 2;
      else if (focus > 0 || count > 0) level = 1;

      heatmapDays.push({
        date: dateStr,
        count,
        focusMinutes: focus,
        level,
      });
    }

    // 2. Calculate Current & Longest Streak
    const activeDates = Array.from(dailyActivityCount.keys())
      .filter((k) => (dailyActivityCount.get(k) || 0) > 0 || (dailyFocusMinutes.get(k) || 0) > 0)
      .sort();

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayKey = format(now, "yyyy-MM-dd");
    const yesterdayKey = format(subDays(now, 1), "yyyy-MM-dd");

    // Check if streak is active today or yesterday
    const isStreakAlive = activeDates.includes(todayKey) || activeDates.includes(yesterdayKey);

    if (activeDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;

      for (let i = 1; i < activeDates.length; i++) {
        const prev = parseISO(activeDates[i - 1]);
        const curr = parseISO(activeDates[i]);
        const diff = differenceInCalendarDays(curr, prev);

        if (diff === 1) {
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
        } else if (diff > 1) {
          tempStreak = 1;
        }
      }

      if (isStreakAlive) {
        // Calculate backward from today
        let checkDate = activeDates.includes(todayKey) ? now : subDays(now, 1);
        currentStreak = 0;
        while (activeDates.includes(format(checkDate, "yyyy-MM-dd"))) {
          currentStreak++;
          checkDate = subDays(checkDate, 1);
        }
      }
    }

    // 3. 90-Day Learning Velocity (Focus minutes & tasks completed per day)
    const dailyCompletedTasks = new Map<string, number>();
    for (const t of completedTasks) {
      const dayKey = format(t.updatedAt, "yyyy-MM-dd");
      dailyCompletedTasks.set(dayKey, (dailyCompletedTasks.get(dayKey) || 0) + 1);
    }

    const velocity: DailyVelocityItem[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = subDays(now, i);
      const fullDate = format(d, "yyyy-MM-dd");
      const date = format(d, "MM/dd");
      velocity.push({
        date,
        fullDate,
        focusMinutes: dailyFocusMinutes.get(fullDate) || 0,
        tasksCompleted: dailyCompletedTasks.get(fullDate) || 0,
      });
    }

    // 4. Concept Mastery Distribution
    let novice = 0;
    let familiar = 0;
    let proficient = 0;
    let mastered = 0;

    for (const c of conceptCounts) {
      if (c.masteryLevel === "NOVICE") novice++;
      else if (c.masteryLevel === "FAMILIAR") familiar++;
      else if (c.masteryLevel === "PROFICIENT") proficient++;
      else if (c.masteryLevel === "MASTERED") mastered++;
    }

    // 5. Subject Distribution (Group by Category)
    const subjectMap = new Map<string, number>();
    for (const c of conceptCounts) {
      const cat = c.category?.name || "General & Core";
      subjectMap.set(cat, (subjectMap.get(cat) || 0) + 1);
    }
    for (const r of resourceCounts) {
      const cat = r.category?.name || "General & Core";
      subjectMap.set(cat, (subjectMap.get(cat) || 0) + 1);
    }

    const totalSubjectEntries = Array.from(subjectMap.values()).reduce((a, b) => a + b, 0);
    const subjectDistribution: SubjectDistributionItem[] = Array.from(subjectMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], index) => ({
        name,
        count,
        percentage: totalSubjectEntries > 0 ? Math.round((count / totalSubjectEntries) * 100) : 0,
        color: APPLE_PALETTE[index % APPLE_PALETTE.length],
      }));

    const totalMinutes = totalFocusSum._sum.durationMinutes || 0;
    const totalFocusHours = Math.round((totalMinutes / 60) * 10) / 10;
    const totalCompletedTasksCount = await db.studyTask.count({
      where: { userId, status: "DONE" },
    });
    const totalCompletedResourcesCount = resourceCounts.filter((r) => r.status === "COMPLETED").length;

    return {
      ok: true,
      data: {
        streak: {
          currentStreak,
          longestStreak: Math.max(longestStreak, currentStreak),
          activeDaysPastYear: activeDaysCount,
        },
        totals: {
          totalFocusHours,
          totalTasksCompleted: totalCompletedTasksCount,
          totalConceptsMastered: mastered,
          totalResourcesRead: totalCompletedResourcesCount,
        },
        heatmapDays,
        velocity,
        subjectDistribution,
        conceptMastery: {
          novice,
          familiar,
          proficient,
          mastered,
          total: conceptCounts.length,
        },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load analytics data",
    };
  }
}
