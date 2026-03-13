import { useEffect, useState } from "react";

export function getLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Cache keys that are date-specific and must be cleared on a new day */
const DAILY_CACHE_KEYS = [
  "cache:nutrition_log:v1",
  "cache:schedule_log:v1",
  // water uses date-keyed keys (cache:water:YYYY-MM-DD) — no clearing needed
  // fitness, todos, reading are not date-specific — no clearing needed
];

const LAST_SEEN_DATE_KEY = "app:last-seen-date";

export function clearStaleDailyCaches(): void {
  try {
    const lastSeen = localStorage.getItem(LAST_SEEN_DATE_KEY);
    const today = getLocalDateKey();

    if (lastSeen !== today) {
      DAILY_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(LAST_SEEN_DATE_KEY, today);
    }
  } catch {
    // localStorage unavailable — ignore
  }
}

export function useTodayDate(): string {
  const [today, setToday] = useState(getLocalDateKey);

  useEffect(() => {
    function scheduleNextTick() {
      const now = new Date();

      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() -
        now.getTime();

      const timer = setTimeout(() => {
        const newDay = getLocalDateKey();
        clearStaleDailyCaches();
        setToday(newDay);
        scheduleNextTick();
      }, msUntilMidnight + 100);

      return timer;
    }

    const timer = scheduleNextTick();
    return () => clearTimeout(timer);
  }, []);

  return today;
}