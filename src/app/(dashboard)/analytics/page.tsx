import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAnalyticsDataAction } from "@/actions/analytics";
import { AnalyticsContainer } from "@/components/analytics/analytics-container";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics Studio & Study Heatmap — Lock In",
  description:
    "365-day study consistency heatmap, 90-day learning velocity curve, concept mastery funnel, and subject breakdown.",
};

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const analyticsRes = await getAnalyticsDataAction();

  const fallbackData = {
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      activeDaysPastYear: 0,
    },
    totals: {
      totalFocusHours: 0,
      totalTasksCompleted: 0,
      totalConceptsMastered: 0,
      totalResourcesRead: 0,
    },
    heatmapDays: [],
    velocity: [],
    subjectDistribution: [],
    conceptMastery: {
      novice: 0,
      familiar: 0,
      proficient: 0,
      mastered: 0,
      total: 0,
    },
  };

  const data = analyticsRes.ok && analyticsRes.data ? analyticsRes.data : fallbackData;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Analytics Studio & Consistency
          </h1>
        </div>
        <p className="text-[13.5px] text-secondary max-w-2xl">
          Track your daily study streaks, 90-day learning velocity curves, knowledge graph retention, and academic subject allocation.
        </p>
      </div>

      {/* Main Analytics Container */}
      <AnalyticsContainer data={data} />
    </div>
  );
}
