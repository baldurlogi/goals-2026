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
  | "water"
  | "sleep"
  | "wellbeing"
  | "skincare"
  | "finance"
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
  goalsCompletedTotal: number;
  goalStepCompletionsTotal: number;
  fitness: AchievementFitnessStore | null;
  fitnessCompletedWorkoutDays: number;
  fitnessWorkoutStreak: number;
  nutritionLog: NutritionLog | null;
  nutritionLogsThisWeek: number;
  nutritionLoggedDaysTotal: number;
  nutritionProteinTargetHitDays: number;
  nutritionOnTargetDays: number;
  nutritionLongestLoggedStreak: number;
  nutritionRepeatedCustomMealCount: number;
  nutritionBalancedOnTargetDays: number;
  reading: ReadingInputs | null;
  readingStreak: number;
  readingGoalHitDays: number;
  readingPagesTotal: number;
  readingBooksCompleted: number;
  todos: Todo[];
  todosCompletedTotal: number;
  todoCompletionEventsTotal: number;
  todoBestDayCompletions: number;
  todoCompletionStreak: number;
  waterGoalHitDays: number;
  waterLoggedTotalMl: number;
  sleepLoggedDaysTotal: number;
  sleepSevenHourNights: number;
  sleepHighQualityNights: number;
  wellbeingCheckInsTotal: number;
  wellbeingJournalDays: number;
  wellbeingGratitudeDays: number;
  skincareAmCompletedEver: boolean;
  skincarePmCompletedEver: boolean;
  skincareFullDaysCompletedEver: boolean;
  skincareStreak: number;
  skincareSkinLogsTotal: number;
  financeHasBudgetSet: boolean;
  financeHasExpenseLogged: boolean;
  financeMonthlyPlansBuilt: number;
  financeUnderBudgetCategoryWins: number;
  financeSavingsTotal: number;
  enabledModules: string[];
  accountAgeDays: number;
};

export type UnlockedAchievement = {
  id: string;
  unlockedAt: string;
};
