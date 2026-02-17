import { useEffect, useMemo, useState } from "react";
import {
  loadNutritionLog,
  getLoggedMacros,
  getPlannedMacros,
  NUTRITION_CHANGED_EVENT,
} from "@/features/nutrition/nutritionStorage";
import { nutritionTarget } from "@/features/nutrition/nutritionData";

function clamp(val: number, min = 0, max = 100) {
  return Math.min(Math.max(val, min), max);
}

function pct(value: number, target: number) {
  if (target <= 0) return 0;
  return clamp(Math.round((value / target) * 100));
}

export function useNutritionDashboard() {
  const [nutritionLog, setNutritionLog] = useState(() => loadNutritionLog());

  useEffect(() => {
    const sync = () => setNutritionLog(loadNutritionLog());
    window.addEventListener(NUTRITION_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NUTRITION_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const logged = useMemo(() => getLoggedMacros(nutritionLog), [nutritionLog]);

  // Planned is stable — breakfast option 1 is the default plan baseline
  const planned = useMemo(() => getPlannedMacros(1), []);

  const calLoggedPct = pct(logged.cal, nutritionTarget.calories);
  const calPlannedPct = pct(planned.cal, nutritionTarget.calories);

  const mealsEaten = Object.values(nutritionLog.eaten).filter(Boolean).length;
  const totalMeals = 5; // breakfast + lunch + snack + shake + dinner

  const caloriesRemaining = nutritionTarget.calories - logged.cal;
  const proteinRemaining = nutritionTarget.protein - logged.protein;

  return {
    logged,
    planned,
    target: nutritionTarget,
    calLoggedPct,
    calPlannedPct,
    mealsEaten,
    totalMeals,
    caloriesRemaining,
    proteinRemaining,
  };
}