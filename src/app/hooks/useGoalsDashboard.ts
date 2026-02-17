import { useMemo } from "react";
import { useGoalsStore } from "@/features/goals/goalStore";
import { goalsRegistry } from "@/features/goals/registry";
import { getUpcomingSteps, type UpcomingItem } from "@/features/goals/goalUtils";

const HORIZON = 14;
const PREVIEW_LIMIT = 6;

export function useGoalsDashboard() {
  const { state: goalsState } = useGoalsStore();

  const upcomingItems = useMemo<UpcomingItem[]>(
    () => getUpcomingSteps(goalsRegistry, goalsState.done, HORIZON),
    [goalsState.done],
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
  };
}