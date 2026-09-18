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
} from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Resources",
    href: "/resources",
    icon: BookOpen,
  },
  {
    title: "Concepts",
    href: "/concepts",
    icon: Brain,
  },
  {
    title: "Planner",
    href: "/planner",
    icon: CalendarCheck,
  },
  {
    title: "Skills",
    href: "/skills",
    icon: Award,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border bg-surface/90 backdrop-blur-xl px-2 flex items-center justify-around pb-safe transition-colors select-none"
    >
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors min-h-[44px]",
              isActive
                ? "text-accent font-semibold"
                : "text-secondary hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 stroke-[1.75]",
                isActive ? "text-accent" : "text-secondary"
              )}
            />
            <span className="text-[10px] mt-0.5 tracking-tight">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
