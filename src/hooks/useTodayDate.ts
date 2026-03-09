/**
 * useTodayDate.ts
 *
 * Returns today's ISO date string (YYYY-MM-DD) as reactive state.
 * Re-evaluates at midnight so any component using this hook automatically
 * gets the new date without a page refresh.
 *
 * Also clears stale daily localStorage caches when the date rolls over,
 * so dashboard cards don't flash yesterday's data on first paint.
 */

import { useEffect, useState } from "react";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Cache keys that are date-specific and must be cleared on a new day */
const DAILY_CACHE_KEYS = [
  "cache:nutrition_log:v1",
  "cache:schedule_log:v1",
  // water uses date-keyed keys (cache:water:YYYY-MM-DD) — no clearing needed
  // fitness, todos, reading are not date-specific — no clearing needed
];

const LAST_SEEN_DATE_KEY = "app:last-seen-date";

/**
 * Clears stale daily caches when the date has changed since last visit.
 * Call once at app startup (in AppLayout or AuthProvider).
 */
export function clearStaleDailyCaches(): void {
  try {
    const lastSeen = localStorage.getItem(LAST_SEEN_DATE_KEY);
    const today = todayISO();
    if (lastSeen !== today) {
      DAILY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(LAST_SEEN_DATE_KEY, today);
    }
  } catch {
    // localStorage unavailable — ignore
  }
}

/**
 * Hook that returns today's date string and re-renders at midnight.
 * Use this instead of inline `new Date().toISOString().slice(0,10)`
 * in any hook or component that must stay correct across midnight.
 */
export function useTodayDate(): string {
  const [today, setToday] = useState(todayISO);

  useEffect(() => {
    function scheduleNextTick() {
      const now = new Date();
      // ms until next midnight
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
        now.getTime();

      const timer = setTimeout(() => {
        const newDay = todayISO();
        // Clear stale daily caches before re-rendering
        clearStaleDailyCaches();
        setToday(newDay);
        scheduleNextTick(); // reschedule for the following midnight
      }, msUntilMidnight + 100); // +100ms buffer past midnight

      return timer;
    }

    const timer = scheduleNextTick();
    return () => clearTimeout(timer);
  }, []);

  return today;
}