/**
 * achievementDefinitions.ts
 *
 * All achievement definitions for Life OS.
 * Each achievement has a unique id, metadata, and an async `check` function
 * that returns true if the user has earned it.
 *
 * check() receives a snapshot of all relevant data — called once per session
 * by useAchievements.ts.
 */

import type { FitnessStore } from "@/features/fitness/fitnessStorage";
import type { NutritionLog } from "@/features/nutrition/nutritionStorage";
import type { UserGoal } from "@/features/goals/goalTypes";
import type { ReadingInputs } from "@/features/reading/readingTypes";
import type { Todo } from "@/features/todos/todoStorage";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";
export type AchievementCategory =
  | "goals" | "fitness" | "nutrition" | "reading" | "todos" | "streaks" | "meta";

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  /** Returns true if the user has earned this achievement */
  check: (data: AchievementCheckData) => boolean;
};

export type AchievementCheckData = {
  goals: UserGoal[];
  fitness: FitnessStore | null;
  nutritionLog: NutritionLog | null;
  nutritionLogsThisWeek: number; // count of days with at least 1 meal logged
  reading: ReadingInputs | null;
  readingStreak: number;
  readingBooksCompleted: number;
  todos: Todo[];
  todosCompletedTotal: number; // lifetime completed count from storage
  enabledModules: string[];
  accountAgeDays: number;
};

// ── Rarity colours (used by UI) ───────────────────────────────────────────────

export const RARITY_CONFIG: Record<AchievementRarity, {
  label: string;
  glowClass: string;
  borderClass: string;
  badgeClass: string;
  textClass: string;
}> = {
  common: {
    label: "Common",
    glowClass: "",
    borderClass: "border-border",
    badgeClass: "bg-muted text-muted-foreground",
    textClass: "text-muted-foreground",
  },
  rare: {
    label: "Rare",
    glowClass: "shadow-[0_0_12px_2px_rgba(59,130,246,0.25)]",
    borderClass: "border-blue-500/40",
    badgeClass: "bg-blue-500/15 text-blue-400",
    textClass: "text-blue-400",
  },
  epic: {
    label: "Epic",
    glowClass: "shadow-[0_0_16px_3px_rgba(168,85,247,0.3)]",
    borderClass: "border-purple-500/50",
    badgeClass: "bg-purple-500/15 text-purple-400",
    textClass: "text-purple-400",
  },
  legendary: {
    label: "Legendary",
    glowClass: "shadow-[0_0_24px_4px_rgba(251,191,36,0.35)]",
    borderClass: "border-amber-400/60",
    badgeClass: "bg-amber-400/15 text-amber-400",
    textClass: "text-amber-400",
  },
};

export const CATEGORY_CONFIG: Record<AchievementCategory, { label: string; emoji: string }> = {
  goals:     { label: "Goals",     emoji: "🎯" },
  fitness:   { label: "Fitness",   emoji: "💪" },
  nutrition: { label: "Nutrition", emoji: "🥗" },
  reading:   { label: "Reading",   emoji: "📚" },
  todos:     { label: "To-do",     emoji: "✅" },
  streaks:   { label: "Streaks",   emoji: "🔥" },
  meta:      { label: "Meta",      emoji: "⭐" },
};

// ── All achievement definitions ───────────────────────────────────────────────

export const ACHIEVEMENTS: AchievementDefinition[] = [

  // ── Meta ───────────────────────────────────────────────────────────────────
  {
    id: "meta_early_adopter",
    title: "Early Adopter",
    description: "Joined Life OS in its early days.",
    emoji: "🚀",
    category: "meta",
    rarity: "legendary",
    check: ({ accountAgeDays }) => accountAgeDays >= 0, // always true — you're here!
  },
  {
    id: "meta_all_modules",
    title: "Life Maximalist",
    description: "Enabled all 6 core modules.",
    emoji: "🌟",
    category: "meta",
    rarity: "epic",
    check: ({ enabledModules }) => {
      const core = ["goals", "fitness", "nutrition", "reading", "todos", "schedule"];
      return core.every(m => enabledModules.includes(m));
    },
  },

  // ── Goals ──────────────────────────────────────────────────────────────────
  {
    id: "goals_first",
    title: "Dream Catcher",
    description: "Created your first goal.",
    emoji: "🎯",
    category: "goals",
    rarity: "common",
    check: ({ goals }) => goals.length >= 1,
  },
  {
    id: "goals_five",
    title: "Big Thinker",
    description: "Created 5 goals.",
    emoji: "🧠",
    category: "goals",
    rarity: "rare",
    check: ({ goals }) => goals.length >= 5,
  },
  {
    id: "goals_first_step",
    title: "First Step",
    description: "Added steps to a goal.",
    emoji: "👣",
    category: "goals",
    rarity: "common",
    check: ({ goals }) => goals.some(g => g.steps.length > 0),
  },
  {
    id: "goals_high_priority",
    title: "Laser Focused",
    description: "Set a goal to high priority.",
    emoji: "🎖️",
    category: "goals",
    rarity: "common",
    check: ({ goals }) => goals.some(g => g.priority === "high"),
  },
  {
    id: "goals_planner",
    title: "Master Planner",
    description: "Created a goal with 8 or more steps.",
    emoji: "📋",
    category: "goals",
    rarity: "rare",
    check: ({ goals }) => goals.some(g => g.steps.length >= 8),
  },

  // ── Fitness ────────────────────────────────────────────────────────────────
  {
    id: "fitness_first_pr",
    title: "Iron Starter",
    description: "Logged your first PR.",
    emoji: "🏋️",
    category: "fitness",
    rarity: "common",
    check: ({ fitness }) => {
      if (!fitness) return false;
      return Object.values(fitness.lifts).some(l => l.history.length > 0) ||
             Object.values(fitness.skills).some(s => s.history.length > 0);
    },
  },
  {
    id: "fitness_all_lifts",
    title: "Full Rack",
    description: "Logged a PR for every barbell lift.",
    emoji: "🏆",
    category: "fitness",
    rarity: "rare",
    check: ({ fitness }) => {
      if (!fitness) return false;
      return Object.values(fitness.lifts).every(l => l.history.length > 0);
    },
  },
  {
    id: "fitness_beat_goal",
    title: "Goal Crusher",
    description: "Beat your target on any lift.",
    emoji: "💥",
    category: "fitness",
    rarity: "epic",
    check: ({ fitness }) => {
      if (!fitness) return false;
      return Object.values(fitness.lifts).some(l => {
        if (!l.history.length) return false;
        const best = Math.max(...l.history.map(e => e.value));
        return best >= l.goal;
      });
    },
  },
  {
    id: "fitness_crossfit",
    title: "CrossFitter",
    description: "Logged a CrossFit skill PR.",
    emoji: "⚡",
    category: "fitness",
    rarity: "common",
    check: ({ fitness }) => {
      if (!fitness) return false;
      return Object.values(fitness.skills)
        .filter(s => s.category === "crossfit")
        .some(s => s.history.length > 0);
    },
  },
  {
    id: "fitness_swimmer",
    title: "Aquanaut",
    description: "Logged a swimming PR.",
    emoji: "🏊",
    category: "fitness",
    rarity: "common",
    check: ({ fitness }) => {
      if (!fitness) return false;
      return Object.values(fitness.skills)
        .filter(s => s.category === "swimming")
        .some(s => s.history.length > 0);
    },
  },
  {
    id: "fitness_ten_prs",
    title: "PR Machine",
    description: "Logged 10 total PRs across all lifts.",
    emoji: "📈",
    category: "fitness",
    rarity: "epic",
    check: ({ fitness }) => {
      if (!fitness) return false;
      const total = Object.values(fitness.lifts).reduce((s, l) => s + l.history.length, 0) +
                    Object.values(fitness.skills).reduce((s, sk) => s + sk.history.length, 0);
      return total >= 10;
    },
  },

  // ── Nutrition ──────────────────────────────────────────────────────────────
  {
    id: "nutrition_first_log",
    title: "Bon Appétit",
    description: "Logged your first meal.",
    emoji: "🍽️",
    category: "nutrition",
    rarity: "common",
    check: ({ nutritionLog }) => {
      if (!nutritionLog) return false;
      return Object.values(nutritionLog.eaten ?? {}).some(Boolean) ||
             (nutritionLog.customEntries ?? []).length > 0;
    },
  },
  {
    id: "nutrition_full_day",
    title: "Clean Plate",
    description: "Logged all 7 meals in a single day.",
    emoji: "🥇",
    category: "nutrition",
    rarity: "rare",
    check: ({ nutritionLog }) => {
      if (!nutritionLog) return false;
      return Object.values(nutritionLog.eaten ?? {}).filter(Boolean).length >= 7;
    },
  },
  {
    id: "nutrition_week_streak",
    title: "Consistent Fueler",
    description: "Logged meals on 7 different days.",
    emoji: "📅",
    category: "nutrition",
    rarity: "epic",
    check: ({ nutritionLogsThisWeek }) => nutritionLogsThisWeek >= 7,
  },
  {
    id: "nutrition_custom",
    title: "Chef's Special",
    description: "Added a custom meal entry.",
    emoji: "👨‍🍳",
    category: "nutrition",
    rarity: "common",
    check: ({ nutritionLog }) => (nutritionLog?.customEntries ?? []).length > 0,
  },

  // ── Reading ────────────────────────────────────────────────────────────────
  {
    id: "reading_first_book",
    title: "Bookworm",
    description: "Added your first book.",
    emoji: "📖",
    category: "reading",
    rarity: "common",
    check: ({ reading }) => {
      if (!reading) return false;
      return reading.current.title.trim().length > 0;
    },
  },
  {
    id: "reading_finished_book",
    title: "Page Turner",
    description: "Finished a book.",
    emoji: "🎉",
    category: "reading",
    rarity: "rare",
    check: ({ readingBooksCompleted }) => readingBooksCompleted >= 1,
  },
  {
    id: "reading_ten_books",
    title: "Bibliophile",
    description: "Finished 10 books.",
    emoji: "🏛️",
    category: "reading",
    rarity: "legendary",
    check: ({ readingBooksCompleted }) => readingBooksCompleted >= 10,
  },
  {
    id: "reading_streak_7",
    title: "Daily Reader",
    description: "Maintained a 7-day reading streak.",
    emoji: "🔥",
    category: "reading",
    rarity: "rare",
    check: ({ readingStreak }) => readingStreak >= 7,
  },
  {
    id: "reading_streak_30",
    title: "Reading Machine",
    description: "Maintained a 30-day reading streak.",
    emoji: "💎",
    category: "reading",
    rarity: "legendary",
    check: ({ readingStreak }) => readingStreak >= 30,
  },
  {
    id: "reading_library",
    title: "To-Read Librarian",
    description: "Added 5 books to your up-next list.",
    emoji: "📚",
    category: "reading",
    rarity: "common",
    check: ({ reading }) => (reading?.upNext ?? []).length >= 5,
  },

  // ── Todos ──────────────────────────────────────────────────────────────────
  {
    id: "todos_first",
    title: "Task Master",
    description: "Completed your first task.",
    emoji: "✅",
    category: "todos",
    rarity: "common",
    check: ({ todos }) => todos.some(t => t.done),
  },
  {
    id: "todos_ten",
    title: "Getting Things Done",
    description: "Completed 10 tasks total.",
    emoji: "📝",
    category: "todos",
    rarity: "rare",
    check: ({ todosCompletedTotal }) => todosCompletedTotal >= 10,
  },
  {
    id: "todos_clear_list",
    title: "Clean Slate",
    description: "Cleared your entire to-do list.",
    emoji: "🧹",
    category: "todos",
    rarity: "rare",
    check: ({ todos }) => todos.length > 0 && todos.every(t => t.done),
  },

  // ── Streaks ────────────────────────────────────────────────────────────────
  {
    id: "streaks_reading_3",
    title: "Habit Forming",
    description: "3-day reading streak.",
    emoji: "🌱",
    category: "streaks",
    rarity: "common",
    check: ({ readingStreak }) => readingStreak >= 3,
  },
  {
    id: "streaks_reading_14",
    title: "Two Weeks Strong",
    description: "14-day reading streak.",
    emoji: "💪",
    category: "streaks",
    rarity: "epic",
    check: ({ readingStreak }) => readingStreak >= 14,
  },
];

export type UnlockedAchievement = {
  id: string;
  unlockedAt: string; // ISO date
};