export type BookProgress = {
    title: string;
    author: string;
    currentPage: number;
    totalPages: number;
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

export type ReadingInputs = {
    current: {
        title: string;
        author: string;
        currentPage: string;
        totalPages: string;
    };
    next?: {
        title: string;
        author: string;
        totalPages: string;
    };
    dailyGoalPages: string;
};

export type ReadingFieldPath =
  | "current.title"
  | "current.author"
  | "current.currentPage"
  | "current.totalPages"
  | "dailyGoalPages"
  | "next.title"
  | "next.author"
  | "next.totalPages";