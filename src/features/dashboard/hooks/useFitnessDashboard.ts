import { useEffect, useState } from "react";
import {
  loadPRGoals,
  readPRCache,
  FITNESS_CHANGED_EVENT,
  currentBest,
  progressPct,
  type PRGoal,
  type PREntry,
  type MetricType,
} from "@/features/fitness/fitnessStorage";

type FitnessDashboardLift = {
  label: string;
  goal: number;
  unit: MetricType;
  history: PREntry[];
};

type FitnessDashboardStore = {
  lifts: Record<string, FitnessDashboardLift>;
};

const EMPTY_STORE: FitnessDashboardStore = { lifts: {} };

function toStore(prGoals: PRGoal[]): FitnessDashboardStore {
  return {
    lifts: Object.fromEntries(
      prGoals.map((goal) => [
        goal.id,
        {
          label: goal.label,
          goal: goal.goal,
          unit: goal.unit,
          history: Array.isArray(goal.history) ? goal.history : [],
        },
      ]),
    ),
  };
}

function readCache(): FitnessDashboardStore {
  try {
    return toStore(readPRCache());
  } catch {
    return EMPTY_STORE;
  }
}

function findLift(
  store: FitnessDashboardStore,
  ids: string[],
  fallbackLabel: string,
) {
  for (const id of ids) {
    const lift = store.lifts[id];
    if (lift) {
      const best = currentBest(lift.history);
      return {
        id,
        label: lift.label,
        best,
        goal: lift.goal,
        pct: progressPct(best, lift.goal),
      };
    }
  }

  return {
    id: ids[0],
    label: fallbackLabel,
    best: null,
    goal: 0,
    pct: 0,
  };
}

export function useFitnessDashboard() {
  const [store, setStore] = useState<FitnessDashboardStore>(readCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const prGoals = await loadPRGoals();
      const fresh = toStore(prGoals);

      if (!cancelled) {
        setStore(fresh);
        setLoading(false);
      }
    }

    void fetchData();

    const sync = () => {
      void fetchData();
    };

    window.addEventListener(FITNESS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      cancelled = true;
      window.removeEventListener(FITNESS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const topLifts = [
    findLift(store, ["bench_press", "bench"], "Bench Press"),
    findLift(store, ["back_squat", "squat"], "Back Squat"),
    findLift(store, ["ohp", "overhead_press"], "Overhead Press"),
  ];

  return { store, topLifts, loading };
}