import { clamp, digitsOnly, toInt } from "@/lib/utils";
import type { ReadingInputs, ReadingPlan, ReadingStats } from "./readingTypes";

/**
 * Call whenever the user updates currentPage.
 * - If today already recorded: keep streak as-is (idempotent).
 * - If yesterday was lastReadDate: increment streak.
 * - If older / null: reset streak to 1.
 * Returns a partial ReadingInputs with updated streak + lastReadDate.
 */
export function updateReadingStreak(
  inputs: ReadingInputs,
  todayKey: string,
): Pick<ReadingInputs, "streak" | "lastReadDate"> {
  const last = inputs.lastReadDate ?? null;

  // Already logged today — no change
  if (last === todayKey) {
    return { streak: inputs.streak ?? 1, lastReadDate: last };
  }

  // Check if last was yesterday
  const yesterday = new Date(todayKey);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  if (last === yesterdayKey) {
    return { streak: (inputs.streak ?? 0) + 1, lastReadDate: todayKey };
  }

  // Gap of 2+ days — reset
  return { streak: 1, lastReadDate: todayKey };
}

export function inputsToPlan(inputs: ReadingInputs): ReadingPlan {
  const first = inputs.upNext?.[0];

  return {
    current: {
      title: inputs.current.title,
      author: inputs.current.author,
      currentPage: toInt(inputs.current.currentPage, 0),
      totalPages: toInt(inputs.current.totalPages, 1),
    },
    next: first
      ? {
          title: first.title,
          author: first.author,
          totalPages: toInt(first.totalPages, 0),
        }
      : undefined,
    dailyGoalPages: toInt(inputs.dailyGoalPages, 1),
  };
}

export function getReadingStats(plan: ReadingPlan): ReadingStats {
  const currentPage = clamp(plan.current.currentPage, 0, plan.current.totalPages);
  const totalPages = Math.max(1, plan.current.totalPages);

  const pagesLeft = Math.max(0, totalPages - currentPage);
  const pct = Math.round((currentPage / totalPages) * 100);

  const daily = Math.max(1, plan.dailyGoalPages);
  const daysToFinishCurrent = Math.ceil(pagesLeft / daily);

  const daysToFinishNext =
    plan.next && plan.next.totalPages > 0
      ? Math.ceil(plan.next.totalPages / daily)
      : undefined;

  return {
    ...plan,
    current: { ...plan.current, currentPage, totalPages },
    pct,
    pagesLeft,
    daysToFinishCurrent,
    daysToFinishNext,
  };
}

export function canAcceptDigitsOrBlank(value: string) {
  return digitsOnly(value);
}