export type BookProgress = {
    title: string;
    author: string;
    currentPage: number;
    totalPages: number;
};

export type UpNextBook = {
  title: string;
  author: string;
  totalPages: number;
};

export type CompletedBook = UpNextBook & {
  finishedAt: string; // ISO
};

export type ReadingPlan = {
  current: BookProgress;
  next?: Omit<BookProgress, "currentPage">;
  dailyGoalPages: number;
};

export type ReadingStats = ReadingPlan & {
  pct: number;
  pagesLeft: number;
  daysToFinishCurrent: number;
  daysToFinishNext?: number;
};

export type ReadingDailyProgress = {
  date: string;
  bookKey: string;
  baselinePage: number;
  latestPage: number;
};

export type ReadingInputs = {
  current: {
    title: string;
    author: string;
    currentPage: string;
    totalPages: string;
  };
  upNext: Array<{
    title: string;
    author: string;
    totalPages: string;
  }>;
  completed: CompletedBook[];
  dailyGoalPages: string;
  /** ISO date string (YYYY-MM-DD) of the last day pages were updated */
  lastReadDate: string | null;
  /** Consecutive days with at least one page update */
  streak: number;
  /** Persisted same-day reading progress snapshot used by dashboard/status UI */
  dailyProgress?: ReadingDailyProgress | null;
};

export type ReadingFieldPath =
  | "current.title"
  | "current.author"
  | "current.currentPage"
  | "current.totalPages"
  | "dailyGoalPages";
