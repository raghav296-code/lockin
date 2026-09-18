export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  focusMinutes: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface DailyVelocityItem {
  date: string; // MM/DD
  fullDate: string;
  focusMinutes: number;
  tasksCompleted: number;
}

export interface SubjectDistributionItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ConceptMasteryDistribution {
  novice: number;
  familiar: number;
  proficient: number;
  mastered: number;
  total: number;
}

export interface AnalyticsData {
  streak: {
    currentStreak: number;
    longestStreak: number;
    activeDaysPastYear: number;
  };
  totals: {
    totalFocusHours: number;
    totalTasksCompleted: number;
    totalConceptsMastered: number;
    totalResourcesRead: number;
  };
  heatmapDays: HeatmapDay[];
  velocity: DailyVelocityItem[];
  subjectDistribution: SubjectDistributionItem[];
  conceptMastery: ConceptMasteryDistribution;
}
