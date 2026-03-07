import { useEffect, useMemo, useState } from "react";
import { useGoalsStore } from "@/features/goals/goalStoreContext";
import { loadUserGoals, seedUserGoals } from "@/features/goals/userGoalStorage";
import type { UserGoal } from "@/features/goals/goalTypes";

const HORIZON       = 14;
const PREVIEW_LIMIT = 6;

export type UpcomingItem = {
  goalId: string;
  goalTitle: string;
  goalEmoji: string;
  step: { id: string; label: string; idealFinish: string | null; estimatedTime: string };
  daysFromToday: number;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function diffDays(isoA: string, isoB: string) {
  return Math.round(
    (new Date(isoB + "T00:00:00").getTime() - new Date(isoA + "T00:00:00").getTime()) / 86400000
  );
}

function getUpcomingItems(
  goals: UserGoal[],
  doneMap: Record<string, Record<string, boolean>>,
  horizonDays: number
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
  const { state: goalsState } = useGoalsStore();
  const [goals, setGoals] = useState<UserGoal[]>(() => seedUserGoals());

  useEffect(() => {
    let cancelled = false;
    loadUserGoals().then((g) => { if (!cancelled) setGoals(g); });
    return () => { cancelled = true; };
  }, []);

  const upcomingItems = useMemo<UpcomingItem[]>(
    () => getUpcomingItems(goals, goalsState.done, HORIZON),
    [goals, goalsState.done]
  );

  const overdueCount  = useMemo(() => upcomingItems.filter((i) => i.daysFromToday < 0).length, [upcomingItems]);
  const previewItems  = upcomingItems.slice(0, PREVIEW_LIMIT);
  const hasMore       = upcomingItems.length > PREVIEW_LIMIT;
  const extraCount    = upcomingItems.length - PREVIEW_LIMIT;

  return {
    upcomingItems, previewItems, overdueCount,
    hasMore, extraCount,
    horizon: HORIZON, totalCount: upcomingItems.length,
  };
}