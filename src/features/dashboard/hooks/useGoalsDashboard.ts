import { useMemo } from 'react';
import { useGoalProgressState } from '@/features/goals/goalStore';
import { useGoalsState } from '@/features/goals/useGoalsQuery';
import type { UserGoal } from '@/features/goals/goalTypes';
import { getLocalDateKey } from '@/hooks/useTodayDate';

const HORIZON = 14;
const PREVIEW_LIMIT = 6;

export type UpcomingItem = {
  goalId: string;
  goalTitle: string;
  goalEmoji: string;
  step: {
    id: string;
    label: string;
    idealFinish: string | null;
    estimatedTime: string;
  };
  daysFromToday: number;
};

function todayISO() {
  return getLocalDateKey();
}

function diffDays(isoA: string, isoB: string) {
  return Math.round(
    (new Date(isoB + 'T00:00:00').getTime() -
      new Date(isoA + 'T00:00:00').getTime()) /
      86400000,
  );
}

function getUpcomingItems(
  goals: UserGoal[],
  doneMap: Record<string, Record<string, boolean>>,
  horizonDays: number,
): UpcomingItem[] {
  const today = todayISO();
  const items: UpcomingItem[] = [];

  for (const goal of goals) {
    for (const step of goal.steps) {
      if (!step.idealFinish) continue;
      if (doneMap[goal.id]?.[step.id]) continue;
      const days = diffDays(today, step.idealFinish);
      if (days > horizonDays) continue; // too far in future
      items.push({
        goalId: goal.id,
        goalTitle: goal.title,
        goalEmoji: goal.emoji,
        step,
        daysFromToday: days,
      });
    }
  }

  return items.sort((a, b) => a.daysFromToday - b.daysFromToday);
}

export function useGoalsDashboard() {
  const { doneState: goalProgress, isGoalProgressLoading } = useGoalProgressState();
  const { goals, isGoalsLoading } = useGoalsState();

  const upcomingItems = useMemo<UpcomingItem[]>(
    () => getUpcomingItems(goals, goalProgress, HORIZON),
    [goalProgress, goals],
  );

  const overdueCount = useMemo(
    () => upcomingItems.filter((i) => i.daysFromToday < 0).length,
    [upcomingItems],
  );
  const previewItems = upcomingItems.slice(0, PREVIEW_LIMIT);
  const hasMore = upcomingItems.length > PREVIEW_LIMIT;
  const extraCount = upcomingItems.length - PREVIEW_LIMIT;

  return {
    upcomingItems,
    previewItems,
    overdueCount,
    hasMore,
    extraCount,
    horizon: HORIZON,
    totalCount: upcomingItems.length,
    loading: isGoalsLoading || isGoalProgressLoading,
  };
}
