export const queryKeys = {
  profile: (userId: string | null) => ["profile", userId] as const,
  goals: (userId: string | null) => ["goals", userId] as const,
  goalSteps: (userId: string | null, goalId: string | null) => ["goal-steps", userId, goalId] as const,
  goalProgress: (userId: string | null) => ["goal-progress", userId] as const,
  nutritionLog: (userId: string | null, dateKey: string) => ["nutrition-log", userId, dateKey] as const,
  reading: (userId: string | null) => ["reading", userId] as const,
  readingLog: (userId: string | null, dateKey: string) => ["reading-log", userId, dateKey] as const,
  todos: (userId: string | null) => ["todos", userId] as const,
  schedule: (userId: string | null) => ["schedule", userId] as const,
  scheduleLog: (userId: string | null, dateKey: string) => ["schedule-log", userId, dateKey] as const,
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
