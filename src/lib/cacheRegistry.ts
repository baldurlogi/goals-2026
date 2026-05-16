/* localStorage keys are limited to query seeding, optimistic rollback, or local-only UX state. Server-backed entities should flow through TanStack Query. */
export const CACHE_KEYS = {
  AI_COACH: "cache:ai-coach:v2",
  AI_COACH_LAST_MODULE: "cache:ai-coach:last-module:v2",
  AI_COACH_LAST_SESSION: "cache:ai-coach:last-session:v2",
  AI_SIGNALS: "cache:ai-signals:v1",
  AI_USAGE: "cache:ai-usage:v1",
  ACHIEVEMENTS: "cache:achievements:v1",
  FITNESS: "cache:fitness:v1",
  FITNESS_PRS: "cache:fitness_prs:v1",
  FITNESS_SPLIT: "cache:fitness_split:v1",
  LIFE_PROGRESS_HISTORY: "cache:life-progress-history:v1",
  LIFE_PROGRESS_OPTIONAL_METRICS: "cache:life-progress-optional-metrics:v1",
  GOALS_DONE: "goals:done:v1",
  GOALS_STEP_HISTORY: "goals:step-history:v1",
  NUTRITION_LOG: "cache:nutrition_log:v1",
  NUTRITION_PHASE: "cache:nutrition_phase:v1",
  NUTRITION_GOAL_FOCUSES: "cache:nutrition_goal_focuses:v1",
  PROFILE: "cache:profile:v2",
  READING: "daily-life:reading:v2",
  READING_DAILY_PROGRESS: "cache:reading:today-progress:v2",
  READING_HISTORY: "cache:reading:history:v1",
  SCHEDULE_LOG: "cache:schedule_log:v1",
  SCHEDULE_TEMPLATES: "cache:schedule:templates:v1",
  TODOS: "cache:todos:v1",
  TODOS_COMPLETION_HISTORY: "cache:todos:completion-history:v1",
  TODOS_PENDING_SYNC: "cache:todos:pending-sync:v1",
  USER_GOALS: "cache:user_goals:v1",
  USER_TIER: "cache:user-tier:v1",
  WEEKLY_REPORT: "cache:weekly-report:latest:v1",
} as const;

export const LEGACY_CACHE_KEYS = {
  ACTIVE_USER: "cache:active-user:v1",
  SUPABASE_PROJECT_REF: "cache:supabase-project-ref:v1",
  PROFILE_V1: "cache:profile:v1",
  AI_COACH_V1: "cache:ai-coach:v1",
  AI_COACH_LAST_MODULE_V1: "cache:ai-coach:last-module",
  AI_COACH_LAST_SESSION_V1: "cache:ai-coach:last-session:v1",
  AI_SIGNALS_V1: "cache:ai-signals:v1",
  WEEKLY_REPORT_V1: "cache:weekly-report:latest:v1",
  USER_TIER_V1: "cache:user-tier:v1",
  USER_GOALS_V1: "cache:user_goals:v1",
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
  finance: (goalId: string, month: string) =>
    `${CACHE_PREFIXES.FINANCE}${goalId}:${month}`,
  water: (date: string) => `${CACHE_PREFIXES.WATER}${date}`,
  goalModule: (goalId: string, moduleKey: string) =>
    `${CACHE_PREFIXES.GOAL_MODULE}${goalId}:${moduleKey}`,
  goalModulePendingSync: (goalId: string, moduleKey: string) =>
    `${CACHE_PREFIXES.GOAL_MODULE_PENDING_SYNC}${goalId}:${moduleKey}`,
  goalReadingNamespace: (goalId: string, key: string) =>
    `${CACHE_PREFIXES.GOALS}${goalId}:reading:${key}`,
} as const;

export const USER_SCOPED_CACHE_KEYS = [
  CACHE_KEYS.PROFILE,
  CACHE_KEYS.AI_COACH,
  CACHE_KEYS.AI_COACH_LAST_MODULE,
  CACHE_KEYS.AI_COACH_LAST_SESSION,
  CACHE_KEYS.AI_SIGNALS,
  CACHE_KEYS.WEEKLY_REPORT,
  CACHE_KEYS.USER_TIER,
  CACHE_KEYS.USER_GOALS,
  CACHE_KEYS.GOALS_DONE,
  CACHE_KEYS.GOALS_STEP_HISTORY,
  CACHE_KEYS.TODOS,
  CACHE_KEYS.TODOS_COMPLETION_HISTORY,
  CACHE_KEYS.TODOS_PENDING_SYNC,
  CACHE_KEYS.NUTRITION_LOG,
  CACHE_KEYS.NUTRITION_PHASE,
  CACHE_KEYS.NUTRITION_GOAL_FOCUSES,
  CACHE_KEYS.SCHEDULE_LOG,
  CACHE_KEYS.SCHEDULE_TEMPLATES,
  CACHE_KEYS.FITNESS_PRS,
  CACHE_KEYS.FITNESS_SPLIT,
  CACHE_KEYS.LIFE_PROGRESS_HISTORY,
  CACHE_KEYS.LIFE_PROGRESS_OPTIONAL_METRICS,
  CACHE_KEYS.READING,
  CACHE_KEYS.READING_DAILY_PROGRESS,
  CACHE_KEYS.READING_HISTORY,
  CACHE_KEYS.AI_USAGE,
  CACHE_KEYS.ACHIEVEMENTS,
] as const;

export const USER_SCOPED_CACHE_PREFIXES = [CACHE_PREFIXES.WATER] as const;

export const LEGACY_USER_SCOPED_EXACT_KEYS = [
  LEGACY_CACHE_KEYS.PROFILE_V1,
  LEGACY_CACHE_KEYS.AI_COACH_V1,
  LEGACY_CACHE_KEYS.AI_COACH_LAST_MODULE_V1,
  LEGACY_CACHE_KEYS.AI_COACH_LAST_SESSION_V1,
  LEGACY_CACHE_KEYS.AI_SIGNALS_V1,
  LEGACY_CACHE_KEYS.WEEKLY_REPORT_V1,
  LEGACY_CACHE_KEYS.USER_TIER_V1,
  LEGACY_CACHE_KEYS.USER_GOALS_V1,
] as const;

export const LEGACY_USER_SCOPED_PREFIXES = [CACHE_PREFIXES.WATER] as const;

const registeredExactWrites = new Set<string>([
  ...Object.values(CACHE_KEYS),
  ...Object.values(LEGACY_CACHE_KEYS),
]);

const registeredWritePrefixes = [
  CACHE_PREFIXES.FINANCE,
  CACHE_PREFIXES.WATER,
  CACHE_PREFIXES.GOAL_MODULE,
  CACHE_PREFIXES.GOAL_MODULE_PENDING_SYNC,
  CACHE_PREFIXES.GOALS,
  CACHE_PREFIXES.DAILY_GOALS,
];

const warnedKeys = new Set<string>();

export function assertRegisteredCacheWrite(key: string): void {
  if (!import.meta.env.DEV) return;

  const isKnownExact = registeredExactWrites.has(key);
  const isKnownDynamic = registeredWritePrefixes.some((prefix) =>
    key.startsWith(prefix),
  );

  if (isKnownExact || isKnownDynamic || warnedKeys.has(key)) return;

  warnedKeys.add(key);
  console.warn(`[cache-registry] Unregistered cache write key: ${key}`);
}
