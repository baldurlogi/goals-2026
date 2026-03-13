import type { AchievementDefinition } from "./achievementTypes";

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "meta_early_adopter",
    title: "Early Adopter",
    description: "Joined Life OS in its early days.",
    emoji: "🚀",
    category: "meta",
    rarity: "legendary",
    check: ({ accountAgeDays }) => accountAgeDays >= 0,
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
      return core.every((m) => enabledModules.includes(m));
    },
  },

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
    check: ({ goals }) => goals.some((g) => g.steps.length > 0),
  },
  {
    id: "goals_high_priority",
    title: "Laser Focused",
    description: "Set a goal to high priority.",
    emoji: "🎖️",
    category: "goals",
    rarity: "common",
    check: ({ goals }) => goals.some((g) => g.priority === "high"),
  },
  {
    id: "goals_planner",
    title: "Master Planner",
    description: "Created a goal with 8 or more steps.",
    emoji: "📋",
    category: "goals",
    rarity: "rare",
    check: ({ goals }) => goals.some((g) => g.steps.length >= 8),
  },

  {
    id: "fitness_first_pr",
    title: "Iron Starter",
    description: "Logged your first PR.",
    emoji: "🏋️",
    category: "fitness",
    rarity: "common",
    check: ({ fitness }) => {
      if (!fitness) return false;
      return Object.values(fitness.lifts).some((lift) => lift.history.length > 0);
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
      const barbellLifts = Object.values(fitness.lifts).filter(
        (lift) => lift.category === "barbell",
      );
      return barbellLifts.length > 0 && barbellLifts.every((lift) => lift.history.length > 0);
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
      return Object.values(fitness.lifts).some((lift) => {
        if (!lift.history.length) return false;
        const best = Math.max(...lift.history.map((entry) => entry.value));
        return best >= lift.goal;
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
      return Object.values(fitness.lifts)
        .filter((lift) => lift.category === "crossfit")
        .some((lift) => lift.history.length > 0);
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
      return Object.values(fitness.lifts)
        .filter((lift) => lift.category === "swimming")
        .some((lift) => lift.history.length > 0);
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
      const total = Object.values(fitness.lifts).reduce(
        (sum, lift) => sum + lift.history.length,
        0,
      );
      return total >= 10;
    },
  },

  {
    id: "nutrition_first_log",
    title: "Bon Appétit",
    description: "Logged your first meal.",
    emoji: "🍽️",
    category: "nutrition",
    rarity: "common",
    check: ({ nutritionLog }) => {
      if (!nutritionLog) return false;
      return (
        Object.values(nutritionLog.eaten ?? {}).some(Boolean) ||
        (nutritionLog.customEntries ?? []).length > 0
      );
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

  {
    id: "todos_first",
    title: "Task Master",
    description: "Completed your first task.",
    emoji: "✅",
    category: "todos",
    rarity: "common",
    check: ({ todos }) => todos.some((t) => t.done),
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
    check: ({ todos }) => todos.length > 0 && todos.every((t) => t.done),
  },

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