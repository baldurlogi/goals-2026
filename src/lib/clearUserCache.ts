import { clearProfileState } from "@/features/onboarding/profileStorage";
import { CACHE_KEYS, CACHE_PREFIXES, LEGACY_CACHE_KEYS } from "@/lib/cacheRegistry";

/**
 * Clears all per-user localStorage caches.
 * Call this on sign-out and when a different user signs in.
 */
export function clearUserCache(): void {
  clearProfileState();

  const exactKeys = [
    CACHE_KEYS.AI_COACH,
    CACHE_KEYS.ACHIEVEMENTS,
    CACHE_KEYS.USER_TIER,
    CACHE_KEYS.PROFILE,
    CACHE_KEYS.USER_GOALS,
    CACHE_KEYS.FITNESS,
    CACHE_KEYS.NUTRITION_LOG,
    CACHE_KEYS.NUTRITION_PHASE,
    CACHE_KEYS.SCHEDULE_TEMPLATES,
    CACHE_KEYS.SCHEDULE_LOG,
    CACHE_KEYS.TODOS,
    CACHE_KEYS.GOALS_STORE,
    CACHE_KEYS.READING,
    CACHE_KEYS.DAILY_FITNESS_STREAK,
    CACHE_KEYS.DAILY_GOALS_FINANCE_SAVED,
    CACHE_KEYS.DAILY_GOALS,

    // Deprecated legacy keys kept for backward-compatible cleanup.
    LEGACY_CACHE_KEYS.GOALS_V1,
    LEGACY_CACHE_KEYS.TODOS_V1,
    LEGACY_CACHE_KEYS.SCHEDULE_LOG_V1,
    LEGACY_CACHE_KEYS.NUTRITION_LOG_V1,
    LEGACY_CACHE_KEYS.NUTRITION_PHASE_V1,
    LEGACY_CACHE_KEYS.NUTRITION_SAVED_MEALS_V1,
    LEGACY_CACHE_KEYS.FITNESS_PRS_V1,
  ];

  exactKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  });

  const prefixes = [
    CACHE_PREFIXES.GOALS,
    CACHE_PREFIXES.FINANCE,
    CACHE_PREFIXES.DAILY_GOALS,
  ];

  try {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        try {
          localStorage.removeItem(key);
        } catch {
          return;
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
}
