"use client";

import * as React from "react";

export type FolderColorVariant =
  | "blue"
  | "indigo"
  | "purple"
  | "emerald"
  | "amber"
  | "rose"
  | "cyan"
  | "graphite";

interface MacFolderIconProps {
  className?: string;
  variant?: FolderColorVariant | string;
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
}

const COLOR_MAP: Record<string, { tab: string; body: string }> = {
  blue: { tab: "#85B7EB", body: "#378ADD" },
  indigo: { tab: "#A5B4FC", body: "#4F46E5" },
  purple: { tab: "#C4B5FD", body: "#7C3AED" },
  emerald: { tab: "#6EE7B7", body: "#059669" },
  amber: { tab: "#FCD34D", body: "#D97706" },
  rose: { tab: "#FDA4AF", body: "#E11D48" },
  cyan: { tab: "#67E8F9", body: "#0891B2" },
  graphite: { tab: "#94A3B8", body: "#475569" },
};

const SIZE_MAP = {
  sm: { w: 24, h: 20, class: "w-6 h-5" },
  md: { w: 40, h: 33, class: "w-10 h-[33px]" },
  lg: { w: 56, h: 46, class: "w-14 h-[46px]" },
  xl: { w: 72, h: 59, class: "w-[72px] h-[59px]" },
};

export function MacFolderIcon({
  className = "",
  variant = "blue",
  size = "md",
  animated = true,
}: MacFolderIconProps) {
  const colors = COLOR_MAP[variant] || COLOR_MAP.blue;
  const sizeSpec = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div
      className={`folder-icon-wrapper group/folder inline-flex items-center justify-center shrink-0 cursor-pointer select-none transition-transform duration-200 ease-out motion-reduce:transition-none ${
        animated ? "hover:scale-[1.08] hover:-translate-y-0.5" : ""
      } ${sizeSpec.class} ${className}`}
    >
      <svg
        width={sizeSpec.w}
        height={sizeSpec.h}
        viewBox="0 0 56 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="w-full h-full overflow-visible"
      >
        {/* Animated Top Tab */}
        <path
          className="folder-tab origin-[6px_15px] transition-transform duration-200 ease-out group-hover/folder:-rotate-6 motion-reduce:transition-none motion-reduce:group-hover/folder:transform-none"
          d="M2 8C2 5.79 3.79 4 6 4H20L25 9H50C52.21 9 54 10.79 54 13V15H2V8Z"
          fill={colors.tab}
        />
        {/* Base Body */}
        <rect
          x="2"
          y="13"
          width="52"
          height="31"
          rx="4"
          fill={colors.body}
        />
      </svg>
    </div>
  );
}
