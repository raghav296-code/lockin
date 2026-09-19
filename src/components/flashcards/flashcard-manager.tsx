"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Play, Layers, Search, Trash2, ArrowLeft } from "lucide-react";
import { FlashcardModal } from "./flashcard-modal";
import { FlashcardPlayer } from "./flashcard-player";
import type { FlashcardItem, ReviewStats } from "./flashcard-types";
import { deleteFlashcardAction } from "@/actions/flashcards";

interface FlashcardManagerProps {
  initialCards: FlashcardItem[];
  initialDueCards: FlashcardItem[];
  initialStats: ReviewStats;
  concepts: { id: string; title: string }[];
}

export function FlashcardManager({
  initialCards,
  initialDueCards,
  initialStats,
  concepts,
}: FlashcardManagerProps) {
  const router = useRouter();
  const [cards, setCards] = useState<FlashcardItem[]>(initialCards);
  const [activeTab, setActiveTab] = useState<"due" | "all" | "mastered">("due");
  const [selectedConceptFilter, setSelectedConceptFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const dueCards = cards.filter((card) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return new Date(card.dueDate) <= today;
  });

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await deleteFlashcardAction(id);
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const filteredCards = cards.filter((card) => {
    const isDue = new Date(card.dueDate) <= new Date(new Date().setHours(23, 59, 59, 999));
    const isMastered = card.interval >= 21;

    if (activeTab === "due" && !isDue) return false;
    if (activeTab === "mastered" && !isMastered) return false;

    if (selectedConceptFilter !== "all" && card.conceptId !== selectedConceptFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFront = card.front.toLowerCase().includes(q);
      const matchBack = card.back.toLowerCase().includes(q);
      const matchConcept = card.concept?.title.toLowerCase().includes(q) || false;
      return matchFront || matchBack || matchConcept;
    }

    return true;
  });

  return (
    <div className="space-y-8">
      {isPlaying ? (
        <div className="animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between max-w-2xl mx-auto mb-6">
            <button
              onClick={() => setIsPlaying(false)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-xl bg-secondary/80 border border-border/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Study Mode</span>
            </button>
          </div>
          <FlashcardPlayer
            cards={dueCards.length > 0 ? dueCards : cards}
            onFinishSession={() => {
              setIsPlaying(false);
              handleRefresh();
            }}
          />
        </div>
      ) : (
        <>
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold border border-border/60 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Card
              </button>

              <button
                onClick={() => setIsPlaying(true)}
                disabled={cards.length === 0}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Review ({dueCards.length > 0 ? dueCards.length : cards.length})
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center p-1 rounded-2xl bg-muted/50 border border-border/50 max-w-fit">
              <button
                onClick={() => setActiveTab("due")}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "due"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Due Today ({dueCards.length})
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "all"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Cards ({cards.length})
              </button>
              <button
                onClick={() => setActiveTab("mastered")}
                className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeTab === "mastered"
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mastered ({initialStats.masteredCards})
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={selectedConceptFilter}
                onChange={(e) => setSelectedConceptFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none"
              >
                <option value="all">All Concepts</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 w-40 sm:w-56"
                />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-card/40 border border-border/40">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mb-3">
                <Layers className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-foreground">No flashcards found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {activeTab === "due"
                  ? "You have completed all due reviews for today! Great job locking in."
                  : "Create your first flashcard to start retaining concepts with spaced repetition."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((card) => {
                const isDue =
                  new Date(card.dueDate) <= new Date(new Date().setHours(23, 59, 59, 999));
                const isMastered = card.interval >= 21;

                return (
                  <div
                    key={card.id}
                    className="p-5 rounded-3xl bg-card/70 backdrop-blur-md border border-border/60 hover:border-border transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {card.concept ? (
                          <span className="px-2.5 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[11px] font-medium border border-border/40 truncate max-w-[160px]">
                            {card.concept.title}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono uppercase">
                            General
                          </span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {isMastered ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                              Mastered
                            </span>
                          ) : isDue ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                              Due Today
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              In {card.interval}d
                            </span>
                          )}

                          <button
                            onClick={() => handleDelete(card.id)}
                            disabled={deletingId === card.id}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            title="Delete flashcard"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-semibold tracking-tight text-foreground line-clamp-2 leading-snug mb-2">
                        {card.front}
                      </h4>

                      <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                        {card.back}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>Reps: {card.repetitions}</span>
                      <span>Ease: {card.easeFactor.toFixed(1)}</span>
                      <span>Due: {new Date(card.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <FlashcardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        concepts={concepts}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
