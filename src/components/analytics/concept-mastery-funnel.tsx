"use client";

import * as React from "react";
import { Brain, Award, Sparkles, CheckCircle2 } from "lucide-react";
import type { ConceptMasteryDistribution } from "./analytics-types";

interface ConceptMasteryFunnelProps {
  mastery: ConceptMasteryDistribution;
}

export function ConceptMasteryFunnel({ mastery }: ConceptMasteryFunnelProps) {
  const { novice, familiar, proficient, mastered, total } = mastery;

  const tiers = [
    {
      level: "Mastered",
      count: mastered,
      color: "bg-success",
      textColor: "text-success",
      bgTint: "bg-success-tint",
      border: "border-success/30",
      description: "Complete retention, recall & synthesis",
    },
    {
      level: "Proficient",
      count: proficient,
      color: "bg-accent",
      textColor: "text-accent",
      bgTint: "bg-accent-tint",
      border: "border-accent/30",
      description: "Active application in projects & problem sets",
    },
    {
      level: "Familiar",
      count: familiar,
      color: "bg-purple",
      textColor: "text-purple",
      bgTint: "bg-purple-tint",
      border: "border-purple/30",
      description: "Understands core definitions & mechanics",
    },
    {
      level: "Novice",
      count: novice,
      color: "bg-secondary",
      textColor: "text-secondary",
      bgTint: "bg-surface-secondary",
      border: "border-border",
      description: "Initial discovery & active note-taking",
    },
  ];

  const masteryRate = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="rounded-[20px] border border-border/80 bg-surface shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)] p-5 sm:p-6 space-y-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[17px] font-semibold text-foreground tracking-tight">
              Knowledge Graph Mastery Funnel
            </h3>
          </div>
          <span className="text-[12px] font-semibold text-success bg-success-tint px-2.5 py-0.5 rounded-full border border-success/20">
            {masteryRate}% Mastered
          </span>
        </div>
        <p className="text-[13px] text-secondary mt-0.5">
          Progression of concepts from Novice to Mastered level
        </p>
      </div>

      {/* Progression Bars */}
      <div className="space-y-3.5 pt-1">
        {tiers.map((t, idx) => {
          const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`font-semibold ${t.textColor}`}>
                    {t.level}
                  </span>
                  <span className="text-[11px] text-muted truncate hidden sm:inline">
                    • {t.description}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-secondary font-medium">
                    {t.count} {t.count === 1 ? "concept" : "concepts"}
                  </span>
                  <span className="font-semibold text-foreground text-[12px] min-w-[32px] text-right">
                    {pct}%
                  </span>
                </div>
              </div>

              {/* 6px Apple HIG Bar */}
              <div className="w-full h-[6px] rounded-full bg-border/40 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${t.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-border/60 flex items-center justify-between text-[12px] text-secondary">
        <span className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-accent" />
          {total} Total concepts mapped
        </span>
        <span className="text-muted">
          Spaced Repetition & Notes
        </span>
      </div>
    </div>
  );
}
