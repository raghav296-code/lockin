"use client";

import * as React from "react";
import { Clock, CheckSquare, TrendingUp, BarChart2 } from "lucide-react";
import type { DailyVelocityItem } from "./analytics-types";

interface StudyVelocityChartProps {
  velocity: DailyVelocityItem[];
}

type RangeOption = 14 | 30 | 90;
type MetricMode = "minutes" | "tasks";

export function StudyVelocityChart({ velocity }: StudyVelocityChartProps) {
  const [range, setRange] = React.useState<RangeOption>(30);
  const [mode, setMode] = React.useState<MetricMode>("minutes");
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);

  // Slice velocity by selected range
  const sliceData = React.useMemo(() => {
    return velocity.slice(-range);
  }, [velocity, range]);

  // Max values for scale
  const maxVal = React.useMemo(() => {
    const vals = sliceData.map((d) => (mode === "minutes" ? d.focusMinutes : d.tasksCompleted));
    const max = Math.max(...vals, 1);
    return mode === "minutes" ? Math.max(max, 60) : Math.max(max, 5);
  }, [sliceData, mode]);

  const totalRangeVal = React.useMemo(() => {
    return sliceData.reduce(
      (acc, d) => acc + (mode === "minutes" ? d.focusMinutes : d.tasksCompleted),
      0
    );
  }, [sliceData, mode]);

  const avgRangeVal = Math.round((totalRangeVal / sliceData.length) * 10) / 10;

  // Generate SVG path for smooth area
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 20;
  const paddingY = 25;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const points = React.useMemo(() => {
    return sliceData.map((d, i) => {
      const val = mode === "minutes" ? d.focusMinutes : d.tasksCompleted;
      const x = paddingX + (i / (sliceData.length - 1 || 1)) * chartWidth;
      const y = paddingY + chartHeight - (val / maxVal) * chartHeight;
      return { x, y, val, date: d.date, fullDate: d.fullDate };
    });
  }, [sliceData, mode, maxVal, chartWidth, chartHeight, paddingX, paddingY]);

  // SVG Area path
  const areaPath = React.useMemo(() => {
    if (points.length === 0) return "";
    const first = points[0];
    const last = points[points.length - 1];

    let d = `M ${first.x} ${first.y}`;
    for (let i = 1; i < points.length; i++) {
      // Smooth cubic bezier curve
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const baseline = paddingY + chartHeight;
    d += ` L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
    return d;
  }, [points, paddingY, chartHeight]);

  // SVG Line path
  const linePath = React.useMemo(() => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx = (prev.x + curr.x) / 2;
      d += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [points]);

  return (
    <div className="rounded-[20px] border border-border/80 bg-surface shadow-[0_2px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.2)] p-5 sm:p-6 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-semibold text-foreground tracking-tight">
              Learning Velocity & Effort Curve
            </h2>
          </div>
          <p className="text-[13px] text-secondary mt-0.5">
            {mode === "minutes"
              ? `Total: ${Math.round((totalRangeVal / 60) * 10) / 10} hours • Daily Average: ${avgRangeVal} mins`
              : `Total: ${totalRangeVal} tasks • Daily Average: ${avgRangeVal} tasks`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Metric Mode Pill (Minutes vs Tasks) */}
          <div className="inline-flex p-1 rounded-xl bg-surface-secondary/80 border border-border/70 shadow-xs">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                mode === "minutes"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-secondary hover:text-foreground"
              }`}
              onClick={() => setMode("minutes")}
            >
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Focus Mins</span>
            </button>
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[12px] font-medium transition-all ${
                mode === "tasks"
                  ? "bg-surface text-foreground font-semibold shadow-xs"
                  : "text-secondary hover:text-foreground"
              }`}
              onClick={() => setMode("tasks")}
            >
              <CheckSquare className="w-3.5 h-3.5 text-success" />
              <span>Tasks</span>
            </button>
          </div>

          {/* Range Selector */}
          <div className="inline-flex p-1 rounded-xl bg-surface-secondary/80 border border-border/70 shadow-xs">
            {([14, 30, 90] as RangeOption[]).map((r) => (
              <button
                key={r}
                type="button"
                className={`px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all ${
                  range === r
                    ? "bg-surface text-foreground font-semibold shadow-xs"
                    : "text-secondary hover:text-foreground"
                }`}
                onClick={() => setRange(r)}
              >
                {r}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden pt-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={mode === "minutes" ? "#007AFF" : "#34C759"}
                stopOpacity="0.28"
              />
              <stop
                offset="100%"
                stopColor={mode === "minutes" ? "#007AFF" : "#34C759"}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {[0, 0.5, 1].map((pct) => {
            const y = paddingY + chartHeight * (1 - pct);
            const valLabel = Math.round(maxVal * pct);
            return (
              <g key={pct}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-border/50"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX}
                  y={y - 6}
                  className="text-[10px] fill-muted font-medium"
                >
                  {valLabel} {mode === "minutes" ? "min" : ""}
                </text>
              </g>
            );
          })}

          {/* Smooth Gradient Area */}
          <path d={areaPath} fill="url(#velocityGradient)" />

          {/* Smooth Line Stroke */}
          <path
            d={linePath}
            fill="none"
            stroke={mode === "minutes" ? "#007AFF" : "#34C759"}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Point & Vertical Guide */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <g className="animate-in fade-in duration-100">
              <line
                x1={points[hoveredIdx].x}
                y1={paddingY}
                x2={points[hoveredIdx].x}
                y2={paddingY + chartHeight}
                stroke="currentColor"
                className="text-foreground/30"
                strokeDasharray="2 2"
              />
              <circle
                cx={points[hoveredIdx].x}
                cy={points[hoveredIdx].y}
                r="5.5"
                className="fill-surface stroke-accent"
                strokeWidth="3"
              />
            </g>
          )}

          {/* Invisible Hover Rectangles */}
          {points.map((p, idx) => {
            const barW = chartWidth / points.length;
            return (
              <rect
                key={idx}
                x={p.x - barW / 2}
                y={paddingY}
                width={barW}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        <div className="h-7 flex items-center justify-between text-[12px] pt-1">
          {hoveredIdx !== null && points[hoveredIdx] ? (
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <span className="text-secondary font-normal">
                {points[hoveredIdx].fullDate}:
              </span>
              <span className={mode === "minutes" ? "text-accent" : "text-success"}>
                {points[hoveredIdx].val}{" "}
                {mode === "minutes" ? "minutes focused" : "tasks completed"}
              </span>
            </div>
          ) : (
            <div className="flex justify-between w-full text-[11px] text-muted">
              <span>{sliceData[0]?.date}</span>
              <span>{sliceData[Math.floor(sliceData.length / 2)]?.date}</span>
              <span>{sliceData[sliceData.length - 1]?.date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
