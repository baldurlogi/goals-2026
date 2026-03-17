export function clearUserCache() {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (
        key === "cache:active-user:v1" ||
        key === "cache:profile:v1" ||
        key === "cache:ai-coach:v1" ||
        key === "cache:ai-coach:last-module" ||
        key === "cache:ai-coach:last-session:v1" ||
        key === "cache:user-tier:v1" ||
        key === "cache:user_goals:v1" ||
        key === "cache:goals:v1" ||
        key === "goals:done:v1" ||
        key === "goals:step-history:v1" ||
        key.startsWith("cache:profile:v2:") ||
        key.startsWith("cache:ai-coach:v2:") ||
        key.startsWith("cache:ai-coach:last-module:v2:") ||
        key.startsWith("cache:ai-coach:last-session:v2:") ||
        key.startsWith("cache:user_goals:v1:") ||
        key.startsWith("cache:goals:v1:") ||
        key.startsWith("goals:done:v1:") ||
        key.startsWith("goals:step-history:v1:") ||
        key.startsWith("cache:todos:v1:") ||
        key.startsWith("cache:todos:completion-history:v1:") ||
        key.startsWith("cache:todos:pending-sync:v1:") ||
        key.startsWith("cache:nutrition_log:v1:") ||
        key.startsWith("cache:nutrition_phase:v1:") ||
        key.startsWith("cache:schedule_log:v1:") ||
        key.startsWith("cache:schedule:templates:v1:") ||
        key.startsWith("cache:fitness_prs:v1:") ||
        key.startsWith("cache:fitness_split:v1:") ||
        key.startsWith("cache:reading:today-progress:v1:") ||
        key.startsWith("cache:reading:history:v1:") ||
        key.startsWith("daily-life:reading:v2:") ||
        key.startsWith("cache:ai-usage:v1:") ||
        key.startsWith("cache:user-tier:v1:") ||
        key.startsWith("cache:achievements:v1:") ||
        key.startsWith("cache:water:")
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    // ignore
  }
}
