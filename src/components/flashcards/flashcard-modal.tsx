"use client";

import { useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { createFlashcardAction } from "@/actions/flashcards";

interface ConceptOption {
  id: string;
  title: string;
}

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  concepts: ConceptOption[];
  onSuccess: () => void;
}

export function FlashcardModal({
  isOpen,
  onClose,
  concepts,
  onSuccess,
}: FlashcardModalProps) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [hint, setHint] = useState("");
  const [conceptId, setConceptId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await createFlashcardAction({
        front,
        back,
        hint: hint || null,
        conceptId: conceptId || null,
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Failed to create flashcard.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border/80 shadow-2xl rounded-3xl overflow-hidden flex flex-col">
        <div className="p-6 pb-4 border-b border-border/50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              New Flashcard
            </h2>
            <p className="text-xs text-muted-foreground">
              Create an active recall prompt for spaced repetition
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Link Concept (Optional)
            </label>
            <select
              value={conceptId}
              onChange={(e) => setConceptId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">-- No Concept Link --</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Front (Question / Prompt) *
            </label>
            <textarea
              rows={3}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="e.g. What is the time complexity of QuickSort in the average case?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Back (Answer / Key Explanation) *
            </label>
            <textarea
              rows={4}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="e.g. O(n log n). The array is partitioned recursively into balanced subarrays."
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Hint (Optional)
            </label>
            <input
              type="text"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="e.g. Think about divide and conquer recursion"
              className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !front.trim() || !back.trim()}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Create Flashcard
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
