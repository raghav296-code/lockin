import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getFlashcardsAction,
  getDueFlashcardsAction,
  getFlashcardStatsAction,
} from "@/actions/flashcards";
import { FlashcardManager } from "@/components/flashcards/flashcard-manager";

export const metadata: Metadata = {
  title: "Flashcards & Active Recall | Lock In",
  description: "Scientific spaced repetition and active recall study assistant.",
};

export default async function ReviewPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [cardsRes, dueCardsRes, statsRes, concepts] = await Promise.all([
    getFlashcardsAction(),
    getDueFlashcardsAction(),
    getFlashcardStatsAction(),
    db.concept.findMany({
      where: { userId: session.user.id },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const cards = cardsRes.ok && cardsRes.data ? cardsRes.data : [];
  const dueCards = dueCardsRes.ok && dueCardsRes.data ? dueCardsRes.data : [];
  const stats =
    statsRes.ok && statsRes.data
      ? statsRes.data
      : {
          totalCards: 0,
          dueToday: 0,
          reviewedToday: 0,
          masteredCards: 0,
          learningCards: 0,
          retentionRate: 100,
          streakDays: 0,
        };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Flashcards & Spaced Repetition
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Active recall intervals optimized with the SuperMemo SM-2 algorithm
        </p>
      </div>

      <FlashcardManager
        initialCards={cards}
        initialDueCards={dueCards}
        initialStats={stats}
        concepts={concepts}
      />
    </div>
  );
}
