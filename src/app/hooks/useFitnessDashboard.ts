import { useEffect, useMemo, useState } from "react";
import {
  loadFitness,
  FITNESS_CHANGED_EVENT,
  currentBest,
  progressPct,
  type FitnessStore,
} from "@/features/fitness/fitnessStorage";

type LiftId = "bench" | "squat" | "ohp";

const FALLBACK_LIFT = (id: LiftId) => ({
  label: id.toUpperCase(),
  goal: 0,
  history: [] as any[],
});

const EMPTY_STORE: FitnessStore = {
  lifts: {
    bench: FALLBACK_LIFT("bench"),
    squat: FALLBACK_LIFT("squat"),
    ohp: FALLBACK_LIFT("ohp"),
  },
  skills: {}, // adjust if your FitnessStore.skills is not an object
} as FitnessStore;

export function useFitnessDashboard() {
  const [store, setStore] = useState<FitnessStore>(EMPTY_STORE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    const sync = async () => {
      setLoading(true);
      try {
        const next = await loadFitness();          // ✅ await
        if (alive) setStore(next ?? EMPTY_STORE);  // guard
      } finally {
        if (alive) setLoading(false);
      }
    };

    sync();

    const onChange = () => { void sync(); };
    window.addEventListener(FITNESS_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);

    return () => {
      alive = false;
      window.removeEventListener(FITNESS_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const topLifts = useMemo(() => {
    const lifts = (store as any)?.lifts ?? {};
    return (["bench", "squat", "ohp"] as const).map((id) => {
      const r = lifts[id] ?? FALLBACK_LIFT(id);
      const best = currentBest(r.history ?? []);
      const goal = r.goal ?? 0;

      return {
        id,
        label: r.label ?? id.toUpperCase(),
        best,
        goal,
        pct: progressPct(best, goal),
      };
    });
  }, [store]);

  return { store, topLifts, loading };
}