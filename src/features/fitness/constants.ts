import type {
    DashboardLiftAlias,
    DayKey,
    PRCategory,
    PRSuggestion,
    MetricType
} from "./types";

export const FITNESS_CHANGED_EVENT = "fitness:changed";

export const PR_SUGGESTIONS: PRSuggestion[] = [
  { id: "bench_press",       label: "Bench Press",        unit: "kg",      defaultGoal: 100,  defaultGoalLabel: "100 kg",       category: "barbell"  },
  { id: "back_squat",        label: "Back Squat",         unit: "kg",      defaultGoal: 140,  defaultGoalLabel: "140 kg",       category: "barbell"  },
  { id: "deadlift",          label: "Deadlift",           unit: "kg",      defaultGoal: 180,  defaultGoalLabel: "180 kg",       category: "barbell"  },
  { id: "ohp",               label: "Overhead Press",     unit: "kg",      defaultGoal: 70,   defaultGoalLabel: "70 kg",        category: "barbell"  },
  { id: "power_clean",       label: "Power Clean",        unit: "kg",      defaultGoal: 90,   defaultGoalLabel: "90 kg",        category: "barbell"  },
  { id: "snatch",            label: "Snatch",             unit: "kg",      defaultGoal: 70,   defaultGoalLabel: "70 kg",        category: "barbell"  },
  { id: "front_squat",       label: "Front Squat",        unit: "kg",      defaultGoal: 120,  defaultGoalLabel: "120 kg",       category: "barbell"  },
  { id: "clean_and_jerk",    label: "Clean & Jerk",       unit: "kg",      defaultGoal: 100,  defaultGoalLabel: "100 kg",       category: "barbell"  },
  { id: "butterfly_pullups", label: "Butterfly Pull-ups", unit: "reps",    defaultGoal: 20,   defaultGoalLabel: "20 unbroken",  category: "crossfit" },
  { id: "muscle_ups",        label: "Muscle-ups",         unit: "reps",    defaultGoal: 5,    defaultGoalLabel: "5 unbroken",   category: "crossfit" },
  { id: "strict_hspu",       label: "Strict HSPU",        unit: "reps",    defaultGoal: 10,   defaultGoalLabel: "10 strict",    category: "crossfit" },
  { id: "freestanding_hspu", label: "Freestanding HSPU",  unit: "reps",    defaultGoal: 3,    defaultGoalLabel: "3 reps",       category: "crossfit" },
  { id: "hsw",               label: "Handstand Walk",     unit: "metres",  defaultGoal: 25,   defaultGoalLabel: "25m",          category: "crossfit" },
  { id: "double_unders",     label: "Double-Unders",      unit: "reps",    defaultGoal: 100,  defaultGoalLabel: "100 unbroken", category: "crossfit" },
  { id: "swim_100m",         label: "100m Freestyle",     unit: "seconds", defaultGoal: 75,   defaultGoalLabel: "Sub 1:15",     category: "swimming" },
  { id: "swim_200m",         label: "200m Freestyle",     unit: "seconds", defaultGoal: 180,  defaultGoalLabel: "Sub 3:00",     category: "swimming" },
  { id: "swim_400m",         label: "400m Freestyle",     unit: "seconds", defaultGoal: 420,  defaultGoalLabel: "Sub 7:00",     category: "swimming" },
  { id: "run_5k",            label: "5K Run",             unit: "seconds", defaultGoal: 1500, defaultGoalLabel: "Sub 25:00",    category: "cardio"   },
  { id: "run_10k",           label: "10K Run",            unit: "seconds", defaultGoal: 3300, defaultGoalLabel: "Sub 55:00",    category: "cardio"   },
  { id: "run_half",          label: "Half Marathon",      unit: "seconds", defaultGoal: 7200, defaultGoalLabel: "Sub 2h",       category: "cardio"   },
];

export const CATEGORY_LABELS: Record<PRCategory, string> = {
  barbell:  "🏋️ Barbell",
  crossfit: "🤸 CrossFit",
  swimming: "🏊 Swimming",
  cardio:   "🏃 Cardio",
  custom:   "⚡ Custom",
};

export const UNIT_OPTIONS: { value: MetricType; label: string }[] = [
  { value: "kg",      label: "kg (weight)"    },
  { value: "lbs",     label: "lbs (weight)"   },
  { value: "reps",    label: "reps"           },
  { value: "metres",  label: "metres"         },
  { value: "km",      label: "km (distance)"  },
  { value: "seconds", label: "seconds (time)" },
];

export const DAY_KEYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DEFAULT_SPLIT_LABELS: Record<DayKey, string> = {
  Mon: "Push",
  Tue: "Pull",
  Wed: "Legs",
  Thu: "Rest",
  Fri: "Push",
  Sat: "Cardio",
  Sun: "Rest",
};

export const DASHBOARD_TOP_LIFTS: DashboardLiftAlias[] = [
    { id: "bench", label: "Bench Press", aliases: ["bench_press", "bench"] },
    { id: "squat", label: "Back Squat", aliases: ["back_squat", "squat"] },
    { id: "ohp", label: "Overhead Press", aliases: ["ohp", "overhead_press"] },
]

export const REST_LABELS = new Set(["rest", "off", "rest day"]);