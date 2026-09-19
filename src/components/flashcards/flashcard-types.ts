export type FlashcardRating = 0 | 1 | 2 | 3; // 0: Again, 1: Hard, 2: Good, 3: Easy

export interface FlashcardItem {
  id: string;
  userId: string;
  conceptId?: string | null;
  resourceId?: string | null;
  front: string;
  back: string;
  hint?: string | null;
  easeFactor: number;
  interval: number;
  repetitions: number;
  dueDate: string | Date;
  lastReviewedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  concept?: {
    id: string;
    title: string;
    category?: {
      id: string;
      name: string;
    } | null;
  } | null;
  resource?: {
    id: string;
    title: string;
    type: string;
  } | null;
  reviews?: {
    id: string;
    rating: number;
    reviewedAt: string | Date;
  }[];
}

export interface ReviewStats {
  totalCards: number;
  dueToday: number;
  reviewedToday: number;
  masteredCards: number;
  learningCards: number;
  retentionRate: number;
  streakDays: number;
}
