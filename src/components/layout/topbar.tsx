"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { CommandPalette } from "@/components/search/command-palette";

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    username?: string | null;
    role?: string;
    image?: string | null;
  };
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  const [isPaletteOpen, setIsPaletteOpen] = React.useState(false);

  // Global hotkey listener (⌘K / Ctrl+K)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dynamic breadcrumb title
  function getPageTitle(path: string) {
    if (path.startsWith("/resources")) return "Resources";
    if (path.startsWith("/concepts")) return "Concepts";
    if (path.startsWith("/planner")) return "Study Planner";
    if (path.startsWith("/skills")) return "Skills & Projects";
    if (path.startsWith("/analytics")) return "Analytics";
    if (path.startsWith("/search")) return "Search";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/admin")) return "Admin Panel";
    return "Dashboard";
  }

  const title = getPageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-20 w-full h-16 border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-8 flex items-center justify-between transition-colors">
        {/* Mobile Brand / Desktop Title */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center gap-2 mr-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                LI
              </div>
              <span className="font-semibold text-[17px] tracking-tight text-foreground">
                Lock In
              </span>
            </Link>
          </div>
          <h1 className="hidden md:block text-[17px] font-semibold text-foreground tracking-tight">
            {title}
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Global Search Button (Spotlight ⌘K trigger) */}
          <button
            type="button"
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-3 px-3.5 h-10 rounded-xl border border-border bg-surface/80 hover:bg-surface text-secondary hover:text-foreground text-[13px] transition-all shadow-sm cursor-pointer"
            aria-label="Global search (Press ⌘K)"
          >
            <Search className="w-4 h-4 stroke-[1.75]" />
            <span className="hidden sm:inline">Search graph...</span>
            <kbd className="px-1.5 py-0.5 text-[11px] font-medium bg-muted-bg rounded-md text-muted border border-border">
              ⌘K
            </kbd>
          </button>

          <ThemeToggle />
          <UserNav user={user} />
        </div>
      </header>

      {/* Apple Spotlight Command Palette Modal */}
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
      />
    </>
  );
}
