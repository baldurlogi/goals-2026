import { useEffect, useMemo, useState } from "react";
import {
  loadNutritionLog,
  loadPhase,
  getLoggedMacros,
  NUTRITION_CHANGED_EVENT,
  type NutritionLog,
} from "@/features/nutrition/nutritionStorage";
import { getTargets, type NutritionPhase } from "@/features/nutrition/nutritionData";

const LOG_CACHE   = "cache:nutrition_log:v1";
const PHASE_CACHE = "cache:nutrition_phase:v1";

function clamp(v: number, lo = 0, hi = 100) {
  return Math.min(Math.max(v, lo), hi);
}
function pct(value: number, target: number) {
  return clamp(target > 0 ? Math.round((value / target) * 100) : 0);
}

function readLogCache(): NutritionLog {
  try {
    const raw = localStorage.getItem(LOG_CACHE);
    const today = new Date().toISOString().slice(0, 10);
    if (!raw) return { date: today, eaten: {}, customEntries: [] };
    const parsed = JSON.parse(raw) as NutritionLog;
    // stale day — return empty
    if (parsed.date !== today) return { date: today, eaten: {}, customEntries: [] };
    return parsed;
  } catch { return { date: new Date().toISOString().slice(0, 10), eaten: {}, customEntries: [] }; }
}

function readPhaseCache(): NutritionPhase {
  return (localStorage.getItem(PHASE_CACHE) as NutritionPhase | null) ?? "maintain";
}

export function useNutritionDashboard() {
  const [log,     setLog]     = useState<NutritionLog>(readLogCache);
  const [phase,   setPhase]   = useState<NutritionPhase>(readPhaseCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const [freshLog, freshPhase] = await Promise.all([loadNutritionLog(), loadPhase()]);
      if (!cancelled) {
        setLog(freshLog);
        setPhase(freshPhase);
        setLoading(false);
        try {
          localStorage.setItem(LOG_CACHE,   JSON.stringify(freshLog));
          localStorage.setItem(PHASE_CACHE, freshPhase);
        } catch {}
      }
    }

    fetch();

    const sync = () => fetch();
    window.addEventListener(NUTRITION_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      cancelled = true;
      window.removeEventListener(NUTRITION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const target  = useMemo(() => getTargets(phase), [phase]);
  const logged  = useMemo(() => getLoggedMacros(log), [log]);
  const calPct  = pct(logged.cal, target.cal);

  const mealsEaten        = Object.values(log.eaten).filter(Boolean).length;
  const caloriesRemaining = target.cal - logged.cal;
  const proteinRemaining  = target.protein  - logged.protein;

  return {
    logged, target, phase, calPct,
    mealsEaten, totalMeals: 5,
    caloriesRemaining, proteinRemaining,
    loading,
  };
}