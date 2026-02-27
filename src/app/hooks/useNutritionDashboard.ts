import { useEffect, useMemo, useState } from "react";
import {
  loadNutritionLog,
  loadPhase,
  getLoggedMacros,
  NUTRITION_CHANGED_EVENT,
  type NutritionLog,
} from "@/features/nutrition/nutritionStorage";
import { getTargets } from "@/features/nutrition/nutritionData";
import type { NutritionPhase } from "@/features/nutrition/nutritionData";

function clamp(val: number, min = 0, max = 100) {
  return Math.min(Math.max(val, min), max);
}

function pct(value: number, target: number) {
  return clamp(target > 0 ? Math.round((value / target) * 100) : 0);
}

const EMPTY_LOG: NutritionLog = { date: "", eaten: {}, customEntries: [] };

export function useNutritionDashboard() {
  const [log, setLog] = useState<NutritionLog>(EMPTY_LOG);
  const [phase, setPhase] = useState<NutritionPhase>("maintain");

  useEffect(() => {
    let alive = true;

    const sync = async () => {
      const [nextLog, nextPhase] = await Promise.all([
        loadNutritionLog(),
        loadPhase(),
      ]);
      if (!alive) return;
      setLog(nextLog);
      setPhase(nextPhase);
    };

    sync();

    window.addEventListener(NUTRITION_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      alive = false;
      window.removeEventListener(NUTRITION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const target = useMemo(() => getTargets(phase), [phase]);
  const logged = useMemo(() => getLoggedMacros(log), [log]);

  const calPct = pct(logged.cal, target.cal);

  const mealsEaten = Object.values(log.eaten ?? {}).filter(Boolean).length;
  const totalMeals = 5;

  const caloriesRemaining = target.cal - logged.cal;
  const proteinRemaining = target.protein - logged.protein;

  return {
    logged,
    target,
    phase,
    calPct,
    mealsEaten,
    totalMeals,
    caloriesRemaining,
    proteinRemaining,
  };
}