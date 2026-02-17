import type { GoalDefinition, GoalStep } from "./goalTypes";

export function getGoalProgress(
  def: Pick<GoalDefinition, "steps">,
  doneMap?: Record<string, boolean>
) {
  const steps = def.steps;
  if (steps.length === 0) return { pct: 0, doneCount: 0, total: 0 };

  const doneCount = steps.reduce(
    (acc, step) => acc + (doneMap?.[step.id] ? 1 : 0),
    0
  );

  const pct = Math.round((doneCount / steps.length) * 100);
  return { pct, doneCount, total: steps.length };
}

export function startOfDay(dt: Date) {
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

export function diffDays(a: Date, b: Date) {
  // a - b in whole days
  const ms = startOfDay(a).getTime() - startOfDay(b).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function parseIdealFinishDate(idealFinish?: string): Date | null {
  if (!idealFinish) return null;
  const s = idealFinish.trim();

  // Supports "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // Supports "YYYY-MM" => treat as last day of month (good enough for sorting)
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split("-").map(Number);
    return new Date(y, m, 0); // day 0 of next month = last day of this month
  }

  return null; // ignore "March 2026", "ongoing", etc. for upcoming dashboard
}

export type UpcomingItem = {
  goalId: string;
  goalTitle: string;
  goalEmoji: string;
  step: GoalStep;
  due: Date;
  daysFromToday: number; // negative = overdue
};

export function getUpcomingSteps(
  goals: Array<Pick<GoalDefinition, "id" | "title" | "emoji" | "steps">>,
  done: Record<string, Record<string, boolean>> | undefined,
  horizonDays: number
): UpcomingItem[] {
  const today = startOfDay(new Date());
  const items: UpcomingItem[] = [];

  for (const g of goals) {
    const doneMap = done?.[g.id];
    for (const step of g.steps) {
      if (doneMap?.[step.id]) continue;

      const due = parseIdealFinishDate(step.idealFinish);
      if (!due) continue;

      const daysFromToday = diffDays(due, today);

      // include overdue OR within horizon
      if (daysFromToday < 0 || daysFromToday <= horizonDays) {
        items.push({
          goalId: g.id,
          goalTitle: g.title,
          goalEmoji: g.emoji,
          step,
          due,
          daysFromToday,
        });
      }
    }
  }

  // Sort: overdue first (most overdue), then soonest due
  return items.sort((a, b) => a.daysFromToday - b.daysFromToday);
}
