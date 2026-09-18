"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or escape key
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!mounted) {
    return (
      <div className="h-10 w-10 rounded-xl border border-border bg-surface/80 flex items-center justify-center text-secondary">
        <div className="w-4 h-4" />
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "h-10 w-10 rounded-xl border border-border bg-surface/80 hover:bg-surface active:scale-95 flex items-center justify-center text-foreground transition-all duration-200 cursor-pointer shadow-sm hover:border-border-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isOpen && "border-accent/40 ring-2 ring-accent/20 bg-surface"
        )}
        aria-expanded={isOpen}
        aria-label="Select color theme"
      >
        {theme === "system" ? (
          isDark ? (
            <Moon className="w-[18px] h-[18px] stroke-[1.75]" />
          ) : (
            <Sun className="w-[18px] h-[18px] stroke-[1.75]" />
          )
        ) : theme === "dark" ? (
          <Moon className="w-[18px] h-[18px] stroke-[1.75]" />
        ) : (
          <Sun className="w-[18px] h-[18px] stroke-[1.75]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-semibold tracking-wider text-muted uppercase">
            Theme
          </div>

          <div className="space-y-0.5">
            {/* Light Option */}
            <button
              type="button"
              onClick={() => {
                setTheme("light");
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[14px] font-medium transition-colors cursor-pointer text-left",
                theme === "light"
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-foreground hover:bg-muted-bg"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Sun className="w-4 h-4 stroke-[1.75] text-secondary" />
                <span>Light</span>
              </div>
              {theme === "light" && <Check className="w-4 h-4 stroke-[2.2] text-accent" />}
            </button>

            {/* Dark Option */}
            <button
              type="button"
              onClick={() => {
                setTheme("dark");
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[14px] font-medium transition-colors cursor-pointer text-left",
                theme === "dark"
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-foreground hover:bg-muted-bg"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Moon className="w-4 h-4 stroke-[1.75] text-secondary" />
                <span>Dark</span>
              </div>
              {theme === "dark" && <Check className="w-4 h-4 stroke-[2.2] text-accent" />}
            </button>

            {/* System Option */}
            <button
              type="button"
              onClick={() => {
                setTheme("system");
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-[14px] font-medium transition-colors cursor-pointer text-left",
                theme === "system"
                  ? "bg-accent/10 text-accent font-semibold"
                  : "text-foreground hover:bg-muted-bg"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Laptop className="w-4 h-4 stroke-[1.75] text-secondary" />
                <span>System</span>
              </div>
              {theme === "system" && <Check className="w-4 h-4 stroke-[2.2] text-accent" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
