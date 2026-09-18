"use client";

import * as React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Volume2,
  VolumeX,
  Link2,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionType, LogStudySessionInput } from "@/lib/validations/planner";
import { SESSION_TYPE_CONFIGS } from "./planner-types";

interface SimpleLinkOption {
  id: string;
  title: string;
}

interface FocusTimerProps {
  onLogSession: (data: LogStudySessionInput) => Promise<boolean>;
  resources: SimpleLinkOption[];
  concepts: SimpleLinkOption[];
  className?: string;
}

// Audio chime using Web Audio API synthesis (zero external files required)
function playChime(soundEnabled: boolean) {
  if (!soundEnabled || typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell sequence: C5 -> E5 -> G5 -> C6
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.85);
    });
  } catch {
    // Ignore audio permission/context errors
  }
}

export function FocusTimer({
  onLogSession,
  resources,
  concepts,
  className,
}: FocusTimerProps) {
  const [sessionType, setSessionType] = React.useState<SessionType>("POMODORO");
  const [isBreak, setIsBreak] = React.useState(false);
  const [breakType, setBreakType] = React.useState<"short" | "long">("short");

  // Timer state
  const config = SESSION_TYPE_CONFIGS[sessionType];
  const targetSeconds = isBreak
    ? breakType === "short"
      ? 5 * 60
      : 15 * 60
    : config.defaultMinutes * 60;

  const [timeLeft, setTimeLeft] = React.useState(targetSeconds);
  const [isRunning, setIsRunning] = React.useState(false);
  const [completedRounds, setCompletedRounds] = React.useState(1);
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  // Linked Context
  const [selectedResourceId, setSelectedResourceId] = React.useState<string>("");
  const [selectedConceptId, setSelectedConceptId] = React.useState<string>("");
  const [sessionNotes] = React.useState("");
  const [isLogging, setIsLogging] = React.useState(false);

  // Update timer target when session type or break mode changes
  const switchMode = (type: SessionType) => {
    setIsRunning(false);
    setIsBreak(false);
    setSessionType(type);
    setTimeLeft(SESSION_TYPE_CONFIGS[type].defaultMinutes * 60);
  };

  const switchBreak = (type: "short" | "long") => {
    setIsRunning(false);
    setIsBreak(true);
    setBreakType(type);
    setTimeLeft(type === "short" ? 5 * 60 : 15 * 60);
  };

  // Timer Tick Hook
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playChime(soundEnabled);
            if (!isBreak) {
              onLogSession({
                sessionType,
                durationMinutes: config.defaultMinutes,
                completedRounds,
                resourceId: selectedResourceId || null,
                conceptId: selectedConceptId || null,
                notes: sessionNotes || null,
              });
              setCompletedRounds((r) => r + 1);
              setIsBreak(true);
              const nextBreakType = completedRounds % 4 === 0 ? "long" : "short";
              setBreakType(nextBreakType);
              return nextBreakType === "short" ? 5 * 60 : 15 * 60;
            } else {
              setIsBreak(false);
              return config.defaultMinutes * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    isRunning,
    isBreak,
    soundEnabled,
    sessionType,
    config.defaultMinutes,
    completedRounds,
    selectedResourceId,
    selectedConceptId,
    sessionNotes,
    onLogSession,
  ]);

  const handleManualComplete = async () => {
    setIsRunning(false);
    setIsLogging(true);
    const elapsedMinutes = Math.max(
      1,
      Math.round((targetSeconds - timeLeft) / 60)
    );

    try {
      await onLogSession({
        sessionType,
        durationMinutes: elapsedMinutes,
        completedRounds,
        resourceId: selectedResourceId || null,
        conceptId: selectedConceptId || null,
        notes: sessionNotes || null,
      });
      playChime(soundEnabled);
      setCompletedRounds((prev) => prev + 1);
      setTimeLeft(targetSeconds);
    } finally {
      setIsLogging(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(targetSeconds);
  };

  // Calculations for circular progress ring
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progress = (targetSeconds - timeLeft) / targetSeconds;
  const radius = 94;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const currentColor = isBreak
    ? "#34C759"
    : config.ringColor;

  return (
    <div
      className={cn(
        "rounded-[26px] border border-border bg-surface p-6 sm:p-7 shadow-sm space-y-6 flex flex-col justify-between transition-all",
        className
      )}
    >
      {/* Top Bar: Mode Selectors */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="p-1 rounded-2xl bg-muted-bg/80 border border-border inline-flex items-center gap-1 overflow-x-auto max-w-full">
          {(["POMODORO", "DEEP_WORK", "REVIEW"] as SessionType[]).map((type) => {
            const cfg = SESSION_TYPE_CONFIGS[type];
            const isActive = !isBreak && sessionType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => switchMode(type)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-surface text-foreground font-semibold shadow-xs border border-border/80"
                    : "text-secondary hover:text-foreground hover:bg-surface/40"
                )}
              >
                {cfg.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => switchBreak("short")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[12.5px] font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
              isBreak
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30"
                : "text-secondary hover:text-foreground hover:bg-surface/40"
            )}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Break</span>
          </button>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="p-2 rounded-xl border border-border bg-surface text-muted hover:text-foreground transition-colors self-end sm:self-auto"
          title={soundEnabled ? "Mute chimes" : "Unmute chimes"}
          aria-label="Toggle chime sound"
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-accent" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Main Focus Ring Display */}
      <div className="flex flex-col items-center justify-center relative py-2">
        <div className="relative w-[230px] h-[230px] flex items-center justify-center">
          {/* SVG Progress Ring */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 220 220">
            {/* Background Track */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              className="stroke-muted-bg"
              strokeWidth="11"
              fill="transparent"
            />
            {/* Animated Active Ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              stroke={currentColor}
              strokeWidth="11"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: "stroke-dashoffset 0.8s ease, stroke 0.3s ease",
              }}
            />
          </svg>

          {/* Center Digital Readout */}
          <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider text-secondary">
              {isBreak ? `${breakType.toUpperCase()} BREAK` : config.label}
            </span>
            <span className="text-4xl sm:text-5xl font-bold tracking-tighter text-foreground font-mono">
              {formattedTime}
            </span>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
              <span>Round {completedRounds}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Controls Row */}
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="rounded-2xl w-11 h-11 border-border text-secondary hover:text-foreground cursor-pointer"
          title="Reset timer"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <Button
          onClick={() => setIsRunning((prev) => !prev)}
          className={cn(
            "rounded-2xl h-12 px-7 text-[14px] font-semibold gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer",
            isRunning
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : "bg-accent hover:bg-accent-hover text-white"
          )}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-white" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white ml-0.5" />
              <span>Start Session</span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleManualComplete}
          disabled={isLogging || timeLeft === targetSeconds}
          className="rounded-2xl w-11 h-11 border-border text-secondary hover:text-emerald-500 hover:border-emerald-500/40 cursor-pointer disabled:opacity-40"
          title="Complete & Log current minutes"
        >
          <CheckCircle className="w-4 h-4" />
        </Button>
      </div>

      {/* Attributed Study Context (Resource / Concept linkage) */}
      <div className="pt-3 border-t border-border/70 space-y-2.5">
        <div className="flex items-center justify-between text-[12px] font-medium text-secondary">
          <span className="flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5" />
            <span>Link Active Focus Target:</span>
          </span>
          {(selectedResourceId || selectedConceptId) && (
            <button
              type="button"
              onClick={() => {
                setSelectedResourceId("");
                setSelectedConceptId("");
              }}
              className="text-[11px] text-accent hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12.5px]">
          {/* Resource Selector */}
          <select
            value={selectedResourceId}
            onChange={(e) => setSelectedResourceId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent truncate cursor-pointer"
          >
            <option value="">No Resource Linked</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                📖 {r.title}
              </option>
            ))}
          </select>

          {/* Concept Selector */}
          <select
            value={selectedConceptId}
            onChange={(e) => setSelectedConceptId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent truncate cursor-pointer"
          >
            <option value="">No Concept Linked</option>
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                🧠 {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
