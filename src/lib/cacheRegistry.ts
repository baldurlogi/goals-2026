export const CACHE_KEYS = {
  AI_COACH: "cache:ai-coach:v1",
  AI_SIGNALS: "cache:ai-signals:v1",
  AI_USAGE: "cache:ai-usage:v1",
  ACHIEVEMENTS: "cache:achievements:v1",
  FITNESS: "cache:fitness:v1",
  FITNESS_PRS: "cache:fitness_prs:v1",
  FITNESS_SPLIT: "cache:fitness_split:v1",
  GOALS_STORE: "cache:goals:v1",
  NUTRITION_LOG: "cache:nutrition_log:v1",
  NUTRITION_PHASE: "cache:nutrition_phase:v1",
  PROFILE: "cache:profile:v1",
  READING: "daily-life:reading:v2",
  READING_DAILY_PROGRESS: "cache:reading:today-progress:v1",
  READING_HISTORY: "cache:reading:history:v1",
  SCHEDULE_LOG: "cache:schedule_log:v1",
  SCHEDULE_TEMPLATES: "cache:schedule:templates:v1",
  TODOS: "cache:todos:v1",
  TODOS_COMPLETION_HISTORY: "cache:todos:completion-history:v1",
  TODOS_PENDING_SYNC: "cache:todos:pending-sync:v1",
  USER_GOALS: "cache:user_goals:v1",
  USER_TIER: "cache:user-tier:v1",
  DAILY_GOALS: "daily-life:goals:v1",
  DAILY_FITNESS_STREAK: "daily-life:fitness:streak:fitness-nutrition:v1",
  DAILY_GOALS_FINANCE_SAVED: "daily-life:goals:metric:finance:saved",
} as const;

export const LEGACY_CACHE_KEYS = {
  GOALS_V1: "goals_v1",
  TODOS_V1: "todos_v1",
  SCHEDULE_LOG_V1: "schedule_log_v1",
  NUTRITION_LOG_V1: "nutrition_log_v1",
  NUTRITION_PHASE_V1: "nutrition_phase_v1",
  NUTRITION_SAVED_MEALS_V1: "nutrition_saved_meals_v1",
  FITNESS_PRS_V1: "fitness_prs_v1",
} as const;

export const CACHE_PREFIXES = {
  GOALS: "goals:",
  FINANCE: "cache:finance:",
  WATER: "cache:water:",
  GOAL_MODULE: "cache:gm:",
  GOAL_MODULE_PENDING_SYNC: "cache:gm:pending-sync:",
  DAILY_GOALS: "daily-life:goals:",
} as const;

export const cacheKeyBuilders = {
  finance: (goalId: string, month: string) => `${CACHE_PREFIXES.FINANCE}${goalId}:${month}`,
  water: (date: string) => `${CACHE_PREFIXES.WATER}${date}`,
  goalModule: (goalId: string, moduleKey: string) =>
    `${CACHE_PREFIXES.GOAL_MODULE}${goalId}:${moduleKey}`,
  goalModulePendingSync: (goalId: string, moduleKey: string) =>
    `${CACHE_PREFIXES.GOAL_MODULE_PENDING_SYNC}${goalId}:${moduleKey}`,
  goalReadingNamespace: (goalId: string, key: string) =>
    `${CACHE_PREFIXES.GOALS}${goalId}:reading:${key}`,
} as const;

const registeredExactWrites = new Set<string>([
  ...Object.values(CACHE_KEYS),
  ...Object.values(LEGACY_CACHE_KEYS),
]);

const registeredWritePrefixes = [
  CACHE_PREFIXES.FINANCE,
  CACHE_PREFIXES.WATER,
  CACHE_PREFIXES.GOAL_MODULE,
  CACHE_PREFIXES.GOALS,
];

const warnedKeys = new Set<string>();

export function assertRegisteredCacheWrite(key: string): void {
  if (!import.meta.env.DEV) return;

  const isKnownExact = registeredExactWrites.has(key);
  const isKnownDynamic = registeredWritePrefixes.some((prefix) => key.startsWith(prefix));

  if (isKnownExact || isKnownDynamic || warnedKeys.has(key)) return;

  warnedKeys.add(key);
  console.warn(`[cache-registry] Unregistered cache write key: ${key}`);
}
