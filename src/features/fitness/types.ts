export type MetricType = "kg" | "reps" | "metres" | "seconds" | "km" | "lbs";

export type PRCategory = "barbell" | "crossfit" | "swimming" | "cardio" | "custom";

export type PREntry = { value: number; date: string; notes?: string };

export type PRGoal = {
  id: string;
  label: string;
  unit: MetricType;
  goal: number;
  goalLabel: string;
  category: PRCategory;
  history: PREntry[];
  createdAt: string;
};

export type PRSuggestion = {
  id: string;
  label: string;
  unit: MetricType;
  defaultGoal: number;
  defaultGoalLabel: string;
  category: PRCategory;
};

export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";


export type DaySplit = { label: string; completedDate: string | null };


export type WeeklySplitConfig = {
  days: Record<DayKey, DaySplit>;
  streak: number;
  lastStreakDate: string | null;
};

export type DashboardLiftAlias = {
    id: string;
    label: string;
    aliases: readonly string[];
};