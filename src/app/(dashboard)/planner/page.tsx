import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlannerDataAction } from "@/actions/planner";
import { PlannerContainer } from "@/components/planner/planner-container";
import { CalendarCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Study Planner & Focus Studio — Lock In",
  description:
    "Apple Calendar, Pomodoro focus timer, daily time blocking, and semester academic roadmaps.",
};

export default async function PlannerPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id;

  // Parallel fetching of planner datasets, user resources, and concepts
  const [plannerRes, resources, concepts] = await Promise.all([
    getPlannerDataAction(),
    db.resource.findMany({
      where: { userId },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.concept.findMany({
      where: { userId },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const initialData =
    plannerRes.ok && plannerRes.data
      ? plannerRes.data
      : {
          tasks: [],
          sessions: [],
          semesterPlans: [],
          stats: {
            todayPlannedMinutes: 0,
            todayCompletedMinutes: 0,
            weekCompletedMinutes: 0,
            totalPomodoros: 0,
            completionRate: 0,
          },
        };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Study Planner & Focus Studio
          </h1>
        </div>
        <p className="text-[13.5px] text-secondary max-w-2xl">
          Plan your daily study timeline, run Pomodoro & Deep Work focus sessions, and organize long-range semester plans.
        </p>
      </div>

      {/* Main Container */}
      <PlannerContainer
        initialData={initialData}
        resources={resources}
        concepts={concepts}
      />
    </div>
  );
}
