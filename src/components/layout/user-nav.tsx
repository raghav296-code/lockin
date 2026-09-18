"use client";

import * as React from "react";
import Link from "next/link";
import { signOutAction } from "@/actions/auth";
import { Settings, LogOut, Shield } from "lucide-react";

interface UserNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    username?: string | null;
    role?: string;
    image?: string | null;
  };
}

export function UserNav({ user }: UserNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

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

  const initials = (user.name || user.username || user.email || "U")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-10 w-10 rounded-xl bg-accent text-white font-semibold text-[14px] flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-expanded={isOpen}
        aria-label="User account menu"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-border bg-surface/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* User Details Header */}
          <div className="px-3 py-2.5 border-b border-border/60">
            <p className="text-[14px] font-semibold text-foreground truncate">
              {user.name || user.username || "Student"}
            </p>
            <p className="text-[12px] text-secondary truncate">{user.email}</p>
            {user.role && user.role !== "USER" && (
              <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent-tint text-accent">
                <Shield className="w-3 h-3" />
                <span>{user.role}</span>
              </div>
            )}
          </div>

          <div className="py-1 space-y-0.5">
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14px] text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 stroke-[1.75] text-secondary" />
              <span>Settings</span>
            </Link>
          </div>

          <div className="pt-1 border-t border-border/60">
            <button
              type="button"
              onClick={async () => {
                setIsOpen(false);
                await signOutAction();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[14px] text-danger hover:bg-danger-tint transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 stroke-[1.75]" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
