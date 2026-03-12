import type { MetricType, PREntry, PRCategory } from "@/features/fitness/fitnessStorage";
import type { NutritionLog } from "@/features/nutrition/nutritionStorage";
import type { UserGoal } from "@/features/goals/goalTypes";
import type { ReadingInputs } from "@/features/reading/readingTypes";
import type { Todo } from "@/features/todos/todoStorage";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export type AchievementCategory =
  | "goals"
  | "fitness"
  | "nutrition"
  | "reading"
  | "todos"
  | "streaks"
  | "meta";

export type AchievementFitnessLift = {
  label: string;
  goal: number;
  unit: MetricType;
  category?: PRCategory;
  history: PREntry[];
};

export type AchievementFitnessStore = {
  lifts: Record<string, AchievementFitnessLift>;
};

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  check: (data: AchievementCheckData) => boolean;
};

export type AchievementCheckData = {
  goals: UserGoal[];
  fitness: AchievementFitnessStore | null;
  nutritionLog: NutritionLog | null;
  nutritionLogsThisWeek: number;
  reading: ReadingInputs | null;
  readingStreak: number;
  readingBooksCompleted: number;
  todos: Todo[];
  todosCompletedTotal: number;
  enabledModules: string[];
  accountAgeDays: number;
};

export type UnlockedAchievement = {
  id: string;
  unlockedAt: string;
};