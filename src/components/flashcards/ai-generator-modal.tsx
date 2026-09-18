"use client";

import { useState } from "react";
import {
  Sparkles,
  X,
  Plus,
  Check,
  Loader2,
  BookOpen,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import type { GeneratedAICard } from "./flashcard-types";
import { generateAIFlashcardsAction, bulkCreateFlashcardsAction } from "@/actions/flashcards";

interface ConceptOption {
  id: string;
  title: string;
}

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  concepts: ConceptOption[];
  onSuccess: () => void;
}

export function AIGeneratorModal({
  isOpen,
  onClose,
  concepts,
  onSuccess,
}: AIGeneratorModalProps) {
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");
  const [topicTitle, setTopicTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedAICard[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsGenerating(true);

    try {
      const res = await generateAIFlashcardsAction(
        selectedConceptId || null,
        topicTitle,
        notes
      );

      if (res.ok && res.data) {
        setGeneratedCards(res.data);
        setSelectedIndices(new Set(res.data.map((_, i) => i)));
      } else {
        setError(res.error || "Could not generate flashcards.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while generating.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelectCard = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleCardFieldChange = (
    index: number,
    field: "front" | "back" | "hint",
    val: string
  ) => {
    setGeneratedCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: val } : c))
    );
  };

  const handleSaveSelected = async () => {
    const cardsToSave = generatedCards
      .filter((_, i) => selectedIndices.has(i))
      .map((c) => ({
        front: c.front,
        back: c.back,
        hint: c.hint,
        conceptId: selectedConceptId || null,
      }));

    if (cardsToSave.length === 0) {
      setError("Please select at least one card to save.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await bulkCreateFlashcardsAction(cardsToSave);
      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Failed to save flashcards.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save flashcards.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-card border border-border/80 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                AI Flashcard Generator
              </h2>
              <p className="text-xs text-muted-foreground">
                Synthesize high-yield active recall flashcards from your concepts & notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          {generatedCards.length === 0 ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Link to Concept (Optional)
                </label>
                <select
                  value={selectedConceptId}
                  onChange={(e) => {
                    setSelectedConceptId(e.target.value);
                    const selected = concepts.find((c) => c.id === e.target.value);
                    if (selected) setTopicTitle(selected.title);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- Choose a concept or type custom topic below --</option>
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Topic Title
                </label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g. Backpropagation, React useEffect Lifecycle, Docker Swarm"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required={!selectedConceptId}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Study Notes / Context (Optional)
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Paste lecture notes, definitions, syntax examples, or summary paragraphs here..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating || (!selectedConceptId && !topicTitle.trim())}
                  className="w-full py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing & Synthesizing Cards...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Flashcards
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Generated {generatedCards.length} flashcards ({selectedIndices.size} selected)
                </span>
                <button
                  type="button"
                  onClick={() => setGeneratedCards([])}
                  className="text-xs text-primary hover:underline"
                >
                  Start Over
                </button>
              </div>

              <div className="space-y-3">
                {generatedCards.map((card, idx) => {
                  const isChecked = selectedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isChecked
                          ? "bg-card border-primary/40 shadow-sm"
                          : "bg-muted/30 border-border/40 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectCard(idx)}
                          className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
                        />
                        <div className="flex-1 space-y-2.5">
                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Front (Question)
                            </span>
                            <input
                              type="text"
                              value={card.front}
                              onChange={(e) =>
                                handleCardFieldChange(idx, "front", e.target.value)
                              }
                              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-background border border-border/60 text-xs text-foreground font-medium"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Back (Answer)
                            </span>
                            <textarea
                              rows={2}
                              value={card.back}
                              onChange={(e) =>
                                handleCardFieldChange(idx, "back", e.target.value)
                              }
                              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-background border border-border/60 text-xs text-foreground resize-none"
                            />
                          </div>

                          {card.hint && (
                            <div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Hint
                              </span>
                              <input
                                type="text"
                                value={card.hint}
                                onChange={(e) =>
                                  handleCardFieldChange(idx, "hint", e.target.value)
                                }
                                className="w-full mt-1 px-3 py-1 rounded-lg bg-background border border-border/60 text-[11px] text-muted-foreground"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {generatedCards.length > 0 && (
          <div className="p-4 px-6 border-t border-border/50 bg-card flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSelected}
              disabled={isSaving || selectedIndices.size === 0}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Add {selectedIndices.size} Flashcards to Deck
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
