import type { MetricType, PREntry, PRGoal } from "./types";

export function currentBest(history: PREntry[]): number | null {
  if (!Array.isArray(history) || history.length === 0) return null;
  return Math.max(...history.map((entry) => entry.value));
}

export function progressPct(best: number | null, goal: number): number {
  if (best === null || goal <= 0) return 0;
  return Math.min(Math.round((best / goal) * 100), 100);
}

export function fmtValue(value: number, unit: MetricType): string {
  if (unit === "seconds") {
    const h = Math.floor(value / 3600);
    const m = Math.floor((value % 3600) / 60);
    const s = value % 60;

    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return `${value} ${unit}`;
}

export function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export function getGoalBest(goal: PRGoal): number | null {
  return currentBest(goal.history);
}

export function getGoalProgress(goal: PRGoal): number {
  return progressPct(getGoalBest(goal), goal.goal);
}

export function findGoalByAliases(
  prGoals: PRGoal[],
  aliases: readonly string[],
): PRGoal | null {
  for (const alias of aliases) {
    const match = prGoals.find((goal) => goal.id === alias);
    if (match) return match;
  }
  return null;
}

export function getLatestWorkoutDate(prGoals: PRGoal[]): string | null {
  const allDates = prGoals.flatMap((goal) =>
    Array.isArray(goal.history)
      ? goal.history
          .map((entry) => (typeof entry.date === "string" ? entry.date : null))
          .filter((date): date is string => Boolean(date))
      : [],
  );

  return [...allDates].sort().at(-1) ?? null;
}

export function daysSinceDate(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return null;
  return Math.floor((Date.now() - time) / 86400000);
}

export function getDaysSinceWorkout(prGoals: PRGoal[]): number | null {
  return daysSinceDate(getLatestWorkoutDate(prGoals));
}

export function getLoggedGoals(prGoals: PRGoal[]): PRGoal[] {
  return prGoals.filter((goal) => Array.isArray(goal.history) && goal.history.length > 0);
}

export function hasAnyLoggedPR(prGoals: PRGoal[]): boolean {
  return getLoggedGoals(prGoals).length > 0;
}

export function getAveragePRProgress(prGoals: PRGoal[]): number {
  const logged = getLoggedGoals(prGoals);
  if (logged.length === 0) return 0;

  const total = logged.reduce((sum, goal) => sum + getGoalProgress(goal), 0);
  return Math.round(total / logged.length);
}

export function getRecentPRCount(prGoals: PRGoal[], days = 7): number {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString().slice(0, 10);

  return prGoals.reduce((count, goal) => {
    const recentEntries = goal.history.filter((entry) => entry.date >= sinceISO);
    return count + recentEntries.length;
  }, 0);
}

export function getTopProgressGoal(prGoals: PRGoal[]): PRGoal | null {
  const logged = getLoggedGoals(prGoals);
  if (logged.length === 0) return null;

  return logged.reduce((top, goal) =>
    getGoalProgress(goal) > getGoalProgress(top) ? goal : top,
  );
}

export function getStrongestLiftLabel(prGoals: PRGoal[]): string | null {
  return getTopProgressGoal(prGoals)?.label ?? null;
}

export function getWeakestLiftLabel(prGoals: PRGoal[]): string | null {
  const logged = getLoggedGoals(prGoals);
  if (logged.length === 0) return null;

  const weakest = logged.reduce((bottom, goal) =>
    getGoalProgress(goal) < getGoalProgress(bottom) ? goal : bottom,
  );

  return weakest.label;
}