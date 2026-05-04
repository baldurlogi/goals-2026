export const queryKeys = {
  auth: (userId: string | null) => ["auth", userId] as const,
  profile: (userId: string | null) => ["profile", userId] as const,
  enabledModules: (userId: string | null) => ["enabled-modules", userId] as const,
  profileDerivedModules: (userId: string | null) => ["profile-derived-modules", userId] as const,
  goals: (userId: string | null) => ["goals", userId] as const,
  goal: (userId: string | null, goalId: string | null) => ["goal", userId, goalId] as const,
  goalSteps: (userId: string | null, goalId: string | null) => ["goal-steps", userId, goalId] as const,
  goalProgress: (userId: string | null) => ["goal-progress", userId] as const,
  todos: (userId: string | null) => ["todos", userId] as const,
  reading: (userId: string | null) => ["reading", userId] as const,
  nutrition: (userId: string | null) => ["nutrition", userId] as const,
  nutritionLog: (userId: string | null, dateKey: string) => ["nutrition-log", userId, dateKey] as const,
  schedule: (userId: string | null) => ["schedule", userId] as const,
  scheduleLog: (userId: string | null, dateKey: string) => ["schedule-log", userId, dateKey] as const,
  fitnessPlanningProfile: (userId: string | null) => ["fitness-planning-profile", userId] as const,
  fitnessWeeklyPlan: (userId: string | null, weekStart: string) => ["fitness-weekly-plan", userId, weekStart] as const,
  fitnessExerciseSearch: (
    userId: string | null,
    query: string,
    target: string,
    equipment: string,
    limit: number,
  ) => ["fitness-exercise-search", userId, query, target, equipment, limit] as const,
  fitnessExerciseSwap: (
    userId: string | null,
    currentExerciseId: string,
    currentExerciseName: string,
    target: string,
    equipment: string,
    limit: number,
  ) => [
    "fitness-exercise-swap",
    userId,
    currentExerciseId,
    currentExerciseName,
    target,
    equipment,
    limit,
  ] as const,
  fitnessExerciseFilters: (userId: string | null) => ["fitness-exercise-filters", userId] as const,
  fitnessExerciseImage: (
    userId: string | null,
    exerciseId: string,
    resolution: number,
  ) => ["fitness-exercise-image", userId, exerciseId, resolution] as const,
  fitnessExercisePreview: (
    userId: string | null,
    exerciseId: string,
    query: string,
    target: string,
    equipment: string,
    resolution: number,
  ) => [
    "fitness-exercise-preview",
    userId,
    exerciseId,
    query,
    target,
    equipment,
    resolution,
  ] as const,
  sleepLog: (userId: string | null, dateKey: string) => ["sleep-log", userId, dateKey] as const,
  sleepHistory: (userId: string | null, limit: number) => ["sleep-history", userId, limit] as const,
  wellbeingLog: (userId: string | null, dateKey: string) => ["wellbeing-log", userId, dateKey] as const,
  wellbeingHistory: (userId: string | null, limit: number) => ["wellbeing-history", userId, limit] as const,
  tier: (userId: string | null) => ["tier", userId] as const,
  dashboardAggregate: (userId: string | null, scope: string) => ["dashboard", userId, scope] as const,
  dashboardGoals: (userId: string | null) => ["dashboard", userId, "goals"] as const,
  dashboardTodos: (userId: string | null) => ["dashboard", userId, "todos"] as const,
  dashboardReading: (userId: string | null) => ["dashboard", userId, "reading"] as const,
  dashboardLifeProgress: (userId: string | null) => ["dashboard", userId, "life-progress"] as const,
  dashboardTier: (userId: string | null) => ["dashboard", userId, "tier"] as const,
  lifeProgressOptionalMetrics: (userId: string | null) =>
    ["life-progress-optional-metrics", userId] as const,
  aiUsage: (userId: string | null) => ["ai-usage", userId] as const,
};

export const AUTH_USER_CHANGED_EVENT = "app:auth-user-changed";

export function getSupabaseProjectRef(url: string | undefined | null): string | null {
  if (!url) return null;

  try {
    return new URL(url).hostname.split(".")[0] ?? null;
  } catch {
    return null;
  }
}
