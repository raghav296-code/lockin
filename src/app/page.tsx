import Link from "next/link";
import {
  BookOpen,
  Brain,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-accent/20 selection:text-accent">
      {/* Apple Floating Glass Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
          >
            <span className="font-semibold text-[18px] tracking-tight text-foreground">
              Lock In
            </span>
          </Link>

          <div className="flex items-center gap-3.5">
            <ThemeToggle />
            <Button
              asChild
              size="default"
              className="font-medium tracking-tight shadow-[0_2px_8px_rgba(0,122,255,0.25)]"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Expansive Apple Showcase */}
      <main className="flex-1 max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-24 w-full flex flex-col justify-center">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6 sm:space-y-8 mb-16 sm:mb-24">
          {/* Subtle Pill Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface/60 backdrop-blur-md text-[13px] font-medium text-secondary shadow-sm hover:border-border-hover transition-colors">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-foreground/90">Personal knowledge graph</span>
          </div>

          {/* Master Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-[62px] font-semibold tracking-[-0.035em] text-foreground leading-[1.08]">
            All your learning in one interlinked system
          </h1>

          {/* Subtitle */}
          <p className="text-[17px] sm:text-[19px] text-secondary max-w-xl mx-auto leading-relaxed font-normal">
            Connect resources, study tasks, concepts, skills, and analytics into
            one unified graph.
          </p>

          {/* Primary Action */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 px-8 rounded-xl font-semibold text-[15px] shadow-[0_4px_16px_rgba(0,122,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>

        {/* Expansive Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 w-full">
          {/* Card 1: Resources & Notes */}
          <div className="group rounded-[22px] border border-border bg-surface p-7 sm:p-8 space-y-5 transition-all duration-300 hover:border-border-hover hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/[0.02]">
            <div className="w-12 h-12 rounded-xl bg-accent-tint text-accent flex items-center justify-center border border-accent/20 transition-transform group-hover:scale-105 duration-200">
              <BookOpen className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[18px] text-foreground tracking-tight">
                Resources & notes
              </h3>
              <p className="text-[14px] text-secondary leading-relaxed">
                Store articles, books, videos, and papers. Link them directly to core
                concepts and study tasks.
              </p>
            </div>
          </div>

          {/* Card 2: Knowledge Graph */}
          <div className="group rounded-[22px] border border-border bg-surface p-7 sm:p-8 space-y-5 transition-all duration-300 hover:border-border-hover hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/[0.02]">
            <div className="w-12 h-12 rounded-xl bg-purple-tint text-purple flex items-center justify-center border border-purple/20 transition-transform group-hover:scale-105 duration-200">
              <Brain className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[18px] text-foreground tracking-tight">
                Knowledge graph
              </h3>
              <p className="text-[14px] text-secondary leading-relaxed">
                Map prerequisite concepts and related ideas. Understand how every
                piece connects.
              </p>
            </div>
          </div>

          {/* Card 3: Study Planner */}
          <div className="group rounded-[22px] border border-border bg-surface p-7 sm:p-8 space-y-5 transition-all duration-300 hover:border-border-hover hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/[0.02]">
            <div className="w-12 h-12 rounded-xl bg-success-tint text-success flex items-center justify-center border border-success/20 transition-transform group-hover:scale-105 duration-200">
              <CheckSquare className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-[18px] text-foreground tracking-tight">
                Study planner
              </h3>
              <p className="text-[14px] text-secondary leading-relaxed">
                Track daily tasks rolling up to high-level goals with real progress
                metrics and streaks.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-secondary">
          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground">Lock In</span>
            <span className="text-muted">·</span>
            <span>lockin.study</span>
          </div>
          <div className="flex items-center gap-6 text-muted">
            <span>Apple HIG Design System</span>
            <span>Next.js 15 App Router</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
