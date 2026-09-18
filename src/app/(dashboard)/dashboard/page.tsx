import { auth } from "@/lib/auth";
import { getResourcesAction } from "@/actions/resources";
import { getCategoriesAction } from "@/actions/categories";
import { getConceptsAction } from "@/actions/concepts";
import { getPlannerDataAction } from "@/actions/planner";
import {
  Sparkles,
  BookOpen,
  Clock,
  ArrowRight,
  Plus,
  Flame,
  CheckCircle2,
  Brain,
  Network,
  Calendar,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMinutes, RESOURCE_TYPES } from "@/components/resources/resource-types";

export default async function DashboardPage() {
  const session = await auth();

  const [resourcesRes, categoriesRes, conceptsRes, plannerRes] = await Promise.all([
    getResourcesAction(),
    getCategoriesAction(),
    getConceptsAction(),
    getPlannerDataAction(),
  ]);

  const resources = resourcesRes.ok && resourcesRes.data ? resourcesRes.data : [];
  const categories = categoriesRes.ok && categoriesRes.data ? categoriesRes.data : [];
  const concepts = conceptsRes.ok && conceptsRes.data ? conceptsRes.data : [];
  const planner = plannerRes.ok && plannerRes.data ? plannerRes.data : { tasks: [], sessions: [], semesterPlans: [] };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = planner.tasks.filter((t) => {
    const taskDateStr = new Date(t.scheduledDate).toISOString().split("T")[0];
    return taskDateStr === todayStr;
  });
  const todayCompletedTasks = todayTasks.filter((t) => t.status === "DONE");

  // Dynamic time greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
      ? "Good afternoon"
      : "Good evening";

  const displayName = session?.user?.name || session?.user?.username || "there";

  // Compute metrics
  const inProgressList = resources.filter((r) => r.status === "IN_PROGRESS");
  const completedList = resources.filter((r) => r.status === "COMPLETED");
  const totalMinutes = resources.reduce((acc, r) => acc + (r.actualMinutes || 0), 0);

  const completionPercentage =
    resources.length > 0
      ? Math.round((completedList.length / resources.length) * 100)
      : 0;

  // Compute concept mastery distribution
  const masteryCounts = {
    NOVICE: 0,
    FAMILIAR: 0,
    PROFICIENT: 0,
    MASTERED: 0,
  };
  for (const c of concepts) {
    if (c.masteryLevel in masteryCounts) {
      masteryCounts[c.masteryLevel] += 1;
    }
  }

  const masteredCount = masteryCounts.MASTERED;
  const proficientCount = masteryCounts.PROFICIENT;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold bg-accent-tint text-accent border border-accent/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Knowledge Graph</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {greeting}, {displayName}
          </h1>
          <p className="text-[14.5px] text-secondary">
            Your unified study workspace. Track resources, interconnected concepts, and daily tasks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button asChild variant="outline" className="rounded-xl px-4 h-11 text-[13.5px] font-semibold gap-2 border-border hover:bg-muted-bg active:scale-[0.98] transition-all">
            <Link href="/concepts">
              <Network className="w-4 h-4 text-purple-500 stroke-[2.2]" />
              <span>Explore Graph</span>
            </Link>
          </Button>
          <Button asChild className="rounded-xl px-5 h-11 text-[13.5px] font-semibold gap-2 shadow-[0_2px_12px_rgba(0,122,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Link href="/resources">
              <Plus className="w-4 h-4 stroke-[2.2]" />
              <span>Add Resource</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Apple Health / Activity Style Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Library */}
        <div className="rounded-[22px] border border-border bg-surface p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] hover:border-border-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">Library Items</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight text-foreground font-mono">{resources.length}</p>
            <p className="text-[11.5px] text-secondary">Across {categories.length} learning fields</p>
          </div>
        </div>

        {/* Interconnected Concepts */}
        <div className="rounded-[22px] border border-border bg-surface p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] hover:border-border-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">Concepts</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Brain className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight text-purple-600 dark:text-purple-400 font-mono">{concepts.length}</p>
            <p className="text-[11.5px] text-secondary">{masteredCount} Mastered · {proficientCount} Proficient</p>
          </div>
        </div>

        {/* Completed & Rate */}
        <div className="rounded-[22px] border border-border bg-surface p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] hover:border-border-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">{completedList.length}</p>
            <p className="text-[11.5px] text-secondary">{completionPercentage}% completion rate</p>
          </div>
        </div>

        {/* Time Studied */}
        <div className="rounded-[22px] border border-border bg-surface p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)] hover:border-border-hover transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">Time Logged</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">{formatMinutes(totalMinutes)}</p>
            <p className="text-[11.5px] text-secondary">Total deep study time</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Learning & Concept Knowledge Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currently Studying */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <h2 className="text-[18px] font-semibold text-foreground tracking-tight">
                Currently Studying
              </h2>
            </div>
            <Link
              href="/resources"
              className="text-[13px] font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>View Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {inProgressList.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-border bg-surface/60 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-accent-tint text-accent flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 stroke-[1.75]" />
              </div>
              <div className="space-y-1">
                <p className="text-[15px] font-semibold text-foreground">
                  No active resources in progress
                </p>
                <p className="text-[13px] text-secondary">
                  Add an article, book, or video to start tracking your study sessions.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-xl text-[12px]">
                <Link href="/resources">Browse library</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {inProgressList.slice(0, 4).map((item) => {
                const typeCfg = RESOURCE_TYPES[item.type] || RESOURCE_TYPES.OTHER;
                const TypeIcon = typeCfg.icon;
                return (
                  <Link
                    key={item.id}
                    href="/resources"
                    className="block group"
                  >
                    <div className="rounded-[20px] border border-border bg-surface p-4 hover:border-accent/40 hover:shadow-lg transition-all space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${typeCfg.bg}`}>
                          <TypeIcon className="w-3 h-3" />
                          <span>{typeCfg.label}</span>
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-mono text-secondary">
                          <Clock className="w-3 h-3 text-muted" />
                          <span>{formatMinutes(item.actualMinutes)}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[15px] font-semibold text-foreground truncate group-hover:text-accent transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[12px] text-secondary truncate">
                          {item.category ? item.category.name : "Uncategorized"}
                          {item.author ? ` · ${item.author}` : ""}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Concept Mastery & Knowledge Graph Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-purple-500" />
              <h2 className="text-[18px] font-semibold text-foreground tracking-tight">
                Concept Mastery
              </h2>
            </div>
            <Link
              href="/concepts"
              className="text-[13px] font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>Explore Graph</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-[22px] border border-border bg-surface p-5 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <p className="text-[15px] font-semibold text-foreground">
                Knowledge Graph Engine
              </p>
              <p className="text-[13px] text-secondary leading-relaxed">
                Interconnected mental models with prerequisite chains and mastery levels.
              </p>
            </div>

            {/* Mastery Level Breakdown */}
            <div className="p-3.5 rounded-xl bg-muted-bg/60 border border-border/60 text-[12.5px] space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-secondary">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Mastered:
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {masteryCounts.MASTERED}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-secondary">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Proficient:
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {masteryCounts.PROFICIENT}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-secondary">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Familiar:
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {masteryCounts.FAMILIAR}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-secondary">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Novice:
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {masteryCounts.NOVICE}
                </span>
              </div>
            </div>

            <Button asChild variant="outline" className="w-full rounded-xl text-[13px] h-10 font-semibold border-purple-500/20 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Link href="/concepts">Open Interactive Graph</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Today's Schedule & Focus Studio Widget */}
      <div className="rounded-[24px] border border-border bg-surface p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-tint text-accent flex items-center justify-center border border-accent/20">
              <Calendar className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-foreground">Today&apos;s Schedule &amp; Activity</h2>
              <p className="text-[12.5px] text-secondary">
                {todayTasks.length === 0
                  ? "No tasks scheduled for today. Track and schedule your daily learning goals."
                  : `${todayCompletedTasks.length} of ${todayTasks.length} tasks completed today.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild className="rounded-xl text-[13px] font-semibold bg-accent hover:bg-accent-hover text-white shadow-xs">
              <Link href="/planner">
                <Calendar className="w-4 h-4 mr-1.5" />
                Open Planner &amp; Rings
              </Link>
            </Button>
          </div>
        </div>

        {todayTasks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayTasks.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl border border-border bg-muted-bg/30 hover:border-accent/30 transition-all flex items-start justify-between gap-2"
              >
                <div className="space-y-1 truncate">
                  <div className="flex items-center gap-1.5">
                    {t.status === "DONE" ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-accent shrink-0" />
                    )}
                    <span className={`text-[13.5px] font-semibold truncate ${t.status === "DONE" ? "line-through text-muted" : "text-foreground"}`}>
                      {t.title}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-secondary flex items-center gap-2 pl-5 font-mono">
                    <span>⏱ {t.estimatedMinutes}m</span>
                    {t.startTime && <span>· 🕒 {t.startTime}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between text-[13px] text-secondary py-1">
            <span>Keep your streak going! Set your daily goals and start a 25-minute Pomodoro session.</span>
            <Link href="/planner" className="text-accent font-semibold hover:underline flex items-center gap-1 text-[12.5px]">
              <span>Open Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
