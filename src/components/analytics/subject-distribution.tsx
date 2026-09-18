"use client";

import * as React from "react";
import { PieChart, BookOpen, Layers } from "lucide-react";
import type { SubjectDistributionItem } from "./analytics-types";

interface SubjectDistributionProps {
  distribution: SubjectDistributionItem[];
}

export function SubjectDistribution({ distribution }: SubjectDistributionProps) {
  const totalItems = React.useMemo(() => {
    return distribution.reduce((acc, d) => acc + d.count, 0);
  }, [distribution]);

  return (
    <div className="rounded-[20px] border border-border/80 bg-surface shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)] p-5 sm:p-6 space-y-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] font-semibold text-foreground tracking-tight">
              Subject & Domain Breakdown
            </h3>
          </div>
          <span className="text-[12px] font-medium text-secondary">
            {totalItems} total entities
          </span>
        </div>
        <p className="text-[13px] text-secondary mt-0.5">
          Distribution of concepts, papers, and resources across subjects
        </p>
      </div>

      {/* Multi-segment Colored Stacked Bar (Apple Style) */}
      <div className="space-y-2">
        <div className="w-full h-3 rounded-full bg-surface-secondary overflow-hidden flex shadow-inner">
          {distribution.map((item, idx) => (
            <div
              key={idx}
              className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }}
              title={`${item.name}: ${item.percentage}%`}
            />
          ))}
        </div>
      </div>

      {/* Individual Subject Inset Rows */}
      <div className="space-y-3 pt-1">
        {distribution.length > 0 ? (
          distribution.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-[12px] border border-border/60 bg-surface-secondary/40 transition-all hover:bg-surface-secondary/70"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[13.5px] font-medium text-foreground truncate">
                  {item.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[12px] text-muted font-medium">
                  {item.count} items
                </span>
                <span className="text-[13px] font-semibold text-foreground min-w-[36px] text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-6 text-[13px] text-muted">
            No categorized resources or concepts yet.
          </div>
        )}
      </div>
    </div>
  );
}
