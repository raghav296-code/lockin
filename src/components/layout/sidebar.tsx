"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  CalendarCheck,
  Award,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    color: "bg-blue-500 text-white",
    tint: "text-blue-500",
  },
  {
    title: "Resources & Notes",
    href: "/resources",
    icon: BookOpen,
    color: "bg-amber-500 text-white",
    tint: "text-amber-500",
  },
  {
    title: "Knowledge Graph",
    href: "/concepts",
    icon: Brain,
    color: "bg-purple-500 text-white",
    tint: "text-purple-500",
  },
  {
    title: "Study Planner",
    href: "/planner",
    icon: CalendarCheck,
    color: "bg-emerald-500 text-white",
    tint: "text-emerald-500",
  },
  {
    title: "Skills & Projects",
    href: "/skills",
    icon: Award,
    color: "bg-rose-500 text-white",
    tint: "text-rose-500",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    color: "bg-cyan-500 text-white",
    tint: "text-cyan-500",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    color: "bg-gray-500 text-white",
    tint: "text-gray-500",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[256px] shrink-0 border-r border-border bg-surface/70 backdrop-blur-2xl h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-border/60">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-105 transition-transform">
            LI
          </div>
          <div className="space-y-0">
            <span className="font-semibold text-[16px] tracking-tight text-foreground block">
              Lock In
            </span>
          </div>
        </Link>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent-tint text-accent border border-accent/20">
          PRO
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-1.5 text-[11px] font-semibold text-muted tracking-wider uppercase">
          Learning Hub
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium transition-all group",
                isActive
                  ? "bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] dark:bg-surface-secondary text-foreground font-semibold border border-border"
                  : "text-secondary hover:text-foreground hover:bg-muted-bg/60"
              )}
            >
              {/* Apple Squircle Icon Badge */}
              <div
                className={cn(
                  "w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105",
                  item.color
                )}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>

              <span className="truncate">{item.title}</span>

              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-accent ml-auto shrink-0 shadow-xs" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info Pill */}
      <div className="p-4 border-t border-border/60">
        <div className="p-3 rounded-2xl bg-muted-bg/50 border border-border/60 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-accent-tint text-accent flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-foreground truncate">
              Apple HIG UI
            </p>
            <p className="text-[10px] text-muted truncate">
              Interlinked Graph
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
