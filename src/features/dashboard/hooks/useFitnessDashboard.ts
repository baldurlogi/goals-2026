import { useEffect, useMemo, useState } from "react";
import {
  DASHBOARD_TOP_LIFTS,
  FITNESS_CHANGED_EVENT,
  currentBest,
  findGoalByAliases,
  loadPRGoals,
  progressPct,
  readPRCache,
  type MetricType,
  type PRGoal,
} from "@/features/fitness/fitnessStorage";

type DashboardTopLift = {
  id: string;
  label: string;
  unit: MetricType;
  best: number | null;
  goal: number;
  pct: number;
};

export function useFitnessDashboard() {
  const [goals, setGoals] = useState<PRGoal[]>(() => readPRCache());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const fresh = await loadPRGoals();
      if (!cancelled) {
        setGoals(fresh);
        setLoading(false);
      }
    }

    void refresh();

    const sync = () => {
      void refresh();
    };

    window.addEventListener(FITNESS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      cancelled = true;
      window.removeEventListener(FITNESS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const topLifts = useMemo<DashboardTopLift[]>(
    () =>
      DASHBOARD_TOP_LIFTS.map((entry) => {
        const goal = findGoalByAliases(goals, entry.aliases);

        if (!goal) {
          return {
            id: entry.id,
            label: entry.label,
            unit: "kg" as const,
            best: null,
            goal: 0,
            pct: 0,
          };
        }

        const best = currentBest(goal.history);

        return {
          id: goal.id,
          label: goal.label,
          unit: goal.unit,
          best,
          goal: goal.goal,
          pct: progressPct(best, goal.goal),
        };
      }),
    [goals],
  );

  return {
    goals,
    topLifts,
    loading,
  };
}