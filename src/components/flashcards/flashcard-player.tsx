"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  HelpCircle,
  Layers,
  Flame,
  ArrowRight,
} from "lucide-react";
import type { FlashcardItem } from "./flashcard-types";
import { reviewFlashcardAction } from "@/actions/flashcards";

interface FlashcardPlayerProps {
  cards: FlashcardItem[];
  onFinishSession: () => void;
}

export function FlashcardPlayer({ cards, onFinishSession }: FlashcardPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionResults, setSessionResults] = useState<{ again: number; hard: number; good: number; easy: number }>({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  const currentCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleRate = useCallback(
    async (rating: 0 | 1 | 2 | 3) => {
      if (!currentCard || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await reviewFlashcardAction(currentCard.id, rating);

        setSessionResults((prev) => {
          const keys = ["again", "hard", "good", "easy"] as const;
          return { ...prev, [keys[rating]]: prev[keys[rating]] + 1 };
        });

        setCompletedCount((c) => c + 1);
        setIsFlipped(false);
        setShowHint(false);
        setCurrentIndex((i) => i + 1);
      } catch (err) {
        console.error("Failed to rate card", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, isSubmitting]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === "1") handleRate(0);
        else if (e.key === "2") handleRate(1);
        else if (e.key === "3") handleRate(2);
        else if (e.key === "4") handleRate(3);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, handleRate]);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-card/60 backdrop-blur-md border border-border/50 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight text-foreground mb-1">
          All caught up!
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          You have no flashcards due for review today. Great work staying ahead of the forgetting curve!
        </p>
        <button
          onClick={onFinishSession}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shadow-sm"
        >
          Manage Decks & Create Cards
        </button>
      </div>
    );
  }

  if (isFinished) {
    const totalReviewed = completedCount;
    const accuracy =
      totalReviewed > 0
        ? Math.round(((sessionResults.good + sessionResults.easy) / totalReviewed) * 100)
        : 100;

    return (
      <div className="flex flex-col items-center justify-center p-10 text-center rounded-3xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-xl max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center mb-4 shadow-md shadow-orange-500/20">
          <Flame className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-1">
          Session Complete!
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          You mastered {totalReviewed} active recall repetitions in this study sprint.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mb-8">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="text-xs font-medium text-muted-foreground">Accuracy</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{accuracy}%</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Easy / Good</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {sessionResults.good + sessionResults.easy}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400">Hard</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{sessionResults.hard}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40">
            <div className="text-xs font-medium text-rose-600 dark:text-rose-400">Again</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{sessionResults.again}</div>
          </div>
        </div>

        <button
          onClick={onFinishSession}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
        >
          Return to Deck Overview <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const progressPercent = Math.round((currentIndex / cards.length) * 100);

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Layers className="w-4 h-4 text-primary" />
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          {currentCard.concept && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium border border-border/40">
              {currentCard.concept.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-28 sm:w-40 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground">{progressPercent}%</span>
        </div>
      </div>

      <div
        className="w-full aspect-[16/10] min-h-[340px] cursor-pointer group"
        onClick={handleFlip}
        style={{ perspective: "1200px" }}
      >
        <div
          className={`relative w-full h-full rounded-3xl transition-transform duration-500 shadow-xl border border-border/70 bg-card/80 backdrop-blur-xl ${
            isFlipped ? "rotate-y-180" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* FRONT */}
          <div
            className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between rounded-3xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold tracking-wide uppercase text-[10px]">
                Question / Prompt
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                <RotateCcw className="w-3.5 h-3.5" /> Click or press Space to reveal answer
              </span>
            </div>

            <div className="my-auto py-4">
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground leading-relaxed text-center">
                {currentCard.front}
              </h3>

              {currentCard.hint && (
                <div className="mt-4 flex flex-col items-center">
                  {!showHint ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1 px-2.5 rounded-lg hover:bg-muted/60 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Show Hint
                    </button>
                  ) : (
                    <p className="text-xs text-amber-700 dark:text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl animate-in fade-in">
                      💡 {currentCard.hint}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="text-center text-xs text-muted-foreground font-mono opacity-50">
              Spacebar to flip
            </div>
          </div>

          {/* BACK */}
          <div
            className="absolute inset-0 w-full h-full p-8 flex flex-col justify-between rounded-3xl bg-secondary/40"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase text-[10px]">
                Target Answer
              </span>
              <span className="text-[11px] font-mono opacity-75">
                Interval: {currentCard.interval}d · Ease: {currentCard.easeFactor.toFixed(2)}
              </span>
            </div>

            <div className="my-auto py-4 overflow-y-auto max-h-[200px] text-center">
              <div className="text-lg sm:text-xl font-medium text-foreground whitespace-pre-wrap leading-relaxed">
                {currentCard.back}
              </div>
            </div>

            <div className="text-center text-xs text-muted-foreground">
              Rate your recall precision below:
            </div>
          </div>
        </div>
      </div>

      {/* RATING BUTTONS */}
      <div className="w-full mt-6 transition-all duration-300">
        {isFlipped ? (
          <div className="grid grid-cols-4 gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              onClick={() => handleRate(0)}
              disabled={isSubmitting}
              className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 transition-all active:scale-95"
            >
              <span className="text-sm font-bold">Again</span>
              <span className="text-[10px] opacity-75 mt-0.5">1 day (Key: 1)</span>
            </button>

            <button
              onClick={() => handleRate(1)}
              disabled={isSubmitting}
              className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-all active:scale-95"
            >
              <span className="text-sm font-bold">Hard</span>
              <span className="text-[10px] opacity-75 mt-0.5">~{Math.max(1, Math.round(currentCard.interval * 1.2))}d (Key: 2)</span>
            </button>

            <button
              onClick={() => handleRate(2)}
              disabled={isSubmitting}
              className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 transition-all active:scale-95"
            >
              <span className="text-sm font-bold">Good</span>
              <span className="text-[10px] opacity-75 mt-0.5">~{Math.round(currentCard.interval * currentCard.easeFactor)}d (Key: 3)</span>
            </button>

            <button
              onClick={() => handleRate(3)}
              disabled={isSubmitting}
              className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-all active:scale-95"
            >
              <span className="text-sm font-bold">Easy</span>
              <span className="text-[10px] opacity-75 mt-0.5">~{Math.round(currentCard.interval * currentCard.easeFactor * 1.3)}d (Key: 4)</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleFlip}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            Reveal Answer <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
