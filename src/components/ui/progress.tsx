"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
}

export function Progress({
  value = 0,
  max = 100,
  label,
  showPercentage = true,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max(0, Math.round((value / max) * 100)), 100);

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-[13px]">
          {label && <span className="text-secondary font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-muted font-medium ml-auto">{percentage}%</span>
          )}
        </div>
      )}
      <div className="h-[6px] w-full overflow-hidden rounded-full bg-muted-bg border border-border/40">
        <div
          className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
