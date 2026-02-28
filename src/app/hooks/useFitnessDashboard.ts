import { useEffect, useState } from "react";
import {
  loadFitness,
  FITNESS_CHANGED_EVENT,
  currentBest,
  progressPct,
  DEFAULT_STORE,
  type FitnessStore,
} from "@/features/fitness/fitnessStorage";

const CACHE_KEY = "cache:fitness:v1";

function readCache(): FitnessStore {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_STORE;
  } catch { return DEFAULT_STORE; }
}

export function useFitnessDashboard() {
  const [store,   setStore]   = useState<FitnessStore>(readCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const fresh = await loadFitness();
      if (!cancelled) {
        setStore(fresh);
        setLoading(false);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(fresh)); } catch {}
      }
    }

    fetch();

    const sync = () => fetch();
    window.addEventListener(FITNESS_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(FITNESS_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const topLifts = (["bench", "squat", "ohp"] as const).map((id) => {
    const r    = store.lifts[id];
    const best = currentBest(r.history);
    return { id, label: r.label, best, goal: r.goal, pct: progressPct(best, r.goal) };
  });

  return { store, topLifts, loading };
}