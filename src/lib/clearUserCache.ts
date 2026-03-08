/**
 * Clears all per-user localStorage caches.
 * Call this on sign-out and when a different user signs in.
 */
export function clearUserCache(): void {
  // Exact known keys
  const exactKeys = [
    "cache:ai-coach:v1",
    "cache:profile:v1",
    "cache:user_goals:v1",
    "cache:fitness:v1",
    "cache:nutrition_log:v1",
    "cache:nutrition_phase:v1",
    "cache:schedule:templates:v1",
    "cache:schedule_log:v1",
    "cache:todos:v1",
    "cache:goals:v1",
    "daily-life:reading:v2",
    "daily-life:fitness:streak:fitness-nutrition:v1",
    "daily-life:goals:metric:finance:saved",
    "daily-life:goals:v1",
    "goals_v1",
    "todos_v1",
    "schedule_log_v1",
    "nutrition_log_v1",
    "nutrition_phase_v1",
    "nutrition_saved_meals_v1",
    "fitness_prs_v1",
  ];

  exactKeys.forEach((key) => {
    try { localStorage.removeItem(key); } catch {
      return;
    }
  });

  // Prefix-based sweep — catches dynamic keys like:
  // goals:frontend-roadmap:*, goals:reading-12-books:*, cache:finance:finance:*
  const prefixes = [
    "goals:",
    "cache:finance:",
    "daily-life:goals:",
  ];

  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (prefixes.some((p) => key.startsWith(p))) {
        try { localStorage.removeItem(key); } catch {
          return;
        }
      }
    });
  } catch {
    return;
  }
}