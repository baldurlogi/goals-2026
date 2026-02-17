/**
 * nutritionStorage.ts
 *
 * Persists the user's "today I ate" meal check-ins.
 * Mirrors the pattern used in readingStorage.ts so the dashboard
 * can react to changes via a custom event.
 *
 * Storage key: nutrition_log_<YYYY-MM-DD>
 * Value: NutritionLog (JSON)
 */

import type { Macros } from "./nutritionTypes";

export const NUTRITION_CHANGED_EVENT = "nutrition:changed";

/** One day's log — which meals the user has marked as eaten */
export type MealKey =
  | "breakfast1"
  | "breakfast2"
  | "lunchWfh"
  | "lunchOffice"
  | "afternoonSnack"
  | "postWorkout"
  | "dinner";

export type NutritionLog = {
  date: string; // "YYYY-MM-DD"
  eaten: Partial<Record<MealKey, boolean>>;
};

// ─── helpers ────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(date: string): string {
  return `nutrition_log_${date}`;
}

// ─── public API ─────────────────────────────────────────────────────────────

export function loadNutritionLog(date = todayKey()): NutritionLog {
  try {
    const raw = localStorage.getItem(storageKey(date));
    if (raw) return JSON.parse(raw) as NutritionLog;
  } catch {
    // ignore parse errors
  }
  return { date, eaten: {} };
}

export function saveNutritionLog(log: NutritionLog): void {
  try {
    localStorage.setItem(storageKey(log.date), JSON.stringify(log));
    window.dispatchEvent(new Event(NUTRITION_CHANGED_EVENT));
  } catch {
    // storage full or private-mode — fail silently
  }
}

export function toggleMeal(key: MealKey, eaten: boolean, date = todayKey()): void {
  const log = loadNutritionLog(date);
  log.eaten[key] = eaten;
  saveNutritionLog(log);
}

// ─── macro aggregation ──────────────────────────────────────────────────────

import { meals } from "./nutritionData";

/** Map from MealKey → its Macros object */
const mealMacrosMap: Record<MealKey, Macros> = {
  breakfast1: meals.breakfast.option1.macros,
  breakfast2: meals.breakfast.option2.macros,
  lunchWfh: meals.lunch.wfh.macros,
  lunchOffice: meals.lunch.office.macros,
  afternoonSnack: meals.afternoonSnack.macros,
  postWorkout: meals.postWorkout.macros,
  dinner: meals.dinner.macros,
};

/** Macros the user has actually logged as eaten today */
export function getLoggedMacros(log: NutritionLog): Macros {
  let cal = 0, protein = 0, carbs = 0, fat = 0;

  for (const [key, wasEaten] of Object.entries(log.eaten) as [MealKey, boolean][]) {
    if (!wasEaten) continue;
    const m = mealMacrosMap[key];
    if (!m) continue;
    cal += m.cal;
    protein += m.protein;
    carbs += m.carbs;
    fat += m.fat;
  }

  return { cal, protein, carbs, fat };
}

/** Full planned-day macros (all meals, breakfast option selectable) */
export function getPlannedMacros(breakfastOption: 1 | 2 = 1): Macros {
  const breakfast =
    breakfastOption === 1
      ? meals.breakfast.option1.macros
      : meals.breakfast.option2.macros;

  return {
    cal:
      breakfast.cal +
      meals.lunch.wfh.macros.cal +
      meals.afternoonSnack.macros.cal +
      meals.postWorkout.macros.cal +
      meals.dinner.macros.cal,
    protein:
      breakfast.protein +
      meals.lunch.wfh.macros.protein +
      meals.afternoonSnack.macros.protein +
      meals.postWorkout.macros.protein +
      meals.dinner.macros.protein,
    carbs:
      breakfast.carbs +
      meals.lunch.wfh.macros.carbs +
      meals.afternoonSnack.macros.carbs +
      meals.postWorkout.macros.carbs +
      meals.dinner.macros.carbs,
    fat:
      breakfast.fat +
      meals.lunch.wfh.macros.fat +
      meals.afternoonSnack.macros.fat +
      meals.postWorkout.macros.fat +
      meals.dinner.macros.fat,
  };
}