import { supabase } from "@/lib/supabaseClient";
import type { NutritionPhase } from "@/features/nutrition/nutritionData";
import type { Macros } from "@/features/nutrition/nutritionTypes";
import { meals } from "@/features/nutrition/nutritionData";

export const NUTRITION_CHANGED_EVENT = "nutrition:changed";

function emit() { window.dispatchEvent(new Event(NUTRITION_CHANGED_EVENT)); }
function todayKey() { return new Date().toISOString().slice(0, 10); }

// ── Types ──────────────────────────────────────────────────────────────────
export type MealKey =
  | "breakfast1" | "breakfast2"
  | "lunchWfh"   | "lunchOffice"
  | "afternoonSnack" | "postWorkout" | "dinner";

export type CustomEntry = {
  id: string; name: string; macros: Macros; loggedAt: number;
};

export type SavedMeal = {
  id: string; name: string; macros: Macros; emoji: string;
};

export type NutritionLog = {
  date: string;
  eaten: Partial<Record<MealKey, boolean>>;
  customEntries: CustomEntry[];
};

function emptyLog(date = todayKey()): NutritionLog {
  return { date, eaten: {}, customEntries: [] };
}

// ── Phase ──────────────────────────────────────────────────────────────────
export async function loadPhase(): Promise<NutritionPhase> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "maintain";

  const { data, error } = await supabase
    .from("nutrition_phase")
    .select("phase")
    .eq("user_id", user.id)
    .maybeSingle();

  // If anything truly unexpected happens, fall back safely
  if (error) {
    console.warn("loadPhase error:", error);
    return "maintain";
  }

  // First-time user: create default row
  if (!data) {
    await supabase.from("nutrition_phase").insert({ user_id: user.id, phase: "maintain" });
    return "maintain";
  }

  return (data.phase as NutritionPhase) ?? "maintain";
}

export async function savePhase(phase: NutritionPhase): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("nutrition_phase")
    .upsert({ user_id: user.id, phase }, { onConflict: "user_id" });

  emit();
}

// ── Daily log ──────────────────────────────────────────────────────────────
export async function loadNutritionLog(date = todayKey()): Promise<NutritionLog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return emptyLog(date);

  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("log_date, eaten, custom_entries")
    .eq("user_id", user.id)
    .eq("log_date", date)
    .maybeSingle();

  if (error) {
    console.warn("loadNutritionLog error:", error);
    return emptyLog(date);
  }

  // First-time user for this date: create default row so future reads are clean
  if (!data) {
    const created = {
      user_id: user.id,
      log_date: date,
      eaten: {},
      custom_entries: [],
    };
    await supabase.from("nutrition_logs").insert(created);
    return emptyLog(date);
  }

  return {
    date: data.log_date,
    eaten: (data.eaten ?? {}) as NutritionLog["eaten"],
    customEntries: (data.custom_entries ?? []) as NutritionLog["customEntries"],
  };
}

async function saveLog(log: NutritionLog): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("nutrition_logs")
    .upsert({
      user_id: user.id,
      log_date: log.date,
      eaten: log.eaten ?? {},
      custom_entries: log.customEntries ?? [],
    }, { onConflict: "user_id,log_date" });

  emit();
}

export async function toggleMeal(key: MealKey, eaten: boolean): Promise<void> {
  const log = await loadNutritionLog();
  log.eaten = log.eaten ?? {};
  log.eaten[key] = eaten;
  await saveLog(log);
}

export async function addCustomEntry(name: string, macros: Macros): Promise<void> {
  const log = await loadNutritionLog();
  log.customEntries = log.customEntries ?? [];
  log.customEntries.push({
    id: crypto.randomUUID(),
    name: name.trim() || "Custom meal",
    macros,
    loggedAt: Date.now(),
  });
  await saveLog(log);
}

export async function removeCustomEntry(id: string): Promise<void> {
  const log = await loadNutritionLog();
  log.customEntries = (log.customEntries ?? []).filter((e) => e.id !== id);
  await saveLog(log);
}

// ── Saved meals ────────────────────────────────────────────────────────────
export async function loadSavedMeals(): Promise<SavedMeal[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_meals")
    .select("id, name, emoji, macros")
    .eq("user_id", user.id)
    .order("created_at");

  if (error) {
    console.warn("loadSavedMeals error:", error);
    return [];
  }

  return (data ?? []) as SavedMeal[];
}

export async function saveNewMeal(name: string, macros: Macros, emoji = "🍽️"): Promise<SavedMeal> {
  const { data: { user } } = await supabase.auth.getUser();
  const meal: SavedMeal = { id: crypto.randomUUID(), name: name.trim(), macros, emoji };

  if (user) {
    // Let DB generate id; but keeping your UUID is also fine if you store it in "id"
    await supabase.from("saved_meals").insert({ ...meal, user_id: user.id });
    emit();
  }

  return meal;
}

export async function deleteSavedMeal(id: string): Promise<void> {
  await supabase.from("saved_meals").delete().eq("id", id);
  emit();
}

export async function logSavedMeal(meal: SavedMeal): Promise<void> {
  await addCustomEntry(meal.name, meal.macros);
}

// ── Macro aggregation ──────────────────────────────────────────────────────
const MEAL_MACROS: Record<MealKey, Macros> = {
  breakfast1:     meals.breakfast.option1.macros,
  breakfast2:     meals.breakfast.option2.macros,
  lunchWfh:       meals.lunch.wfh.macros,
  lunchOffice:    meals.lunch.office.macros,
  afternoonSnack: meals.afternoonSnack.macros,
  postWorkout:    meals.postWorkout.macros,
  dinner:         meals.dinner.macros,
};

export function getLoggedMacros(log: NutritionLog | null | undefined): Macros {
  const safe = log ?? emptyLog();
  const eaten = safe.eaten ?? {};
  const custom = safe.customEntries ?? [];

  const zero: Macros = { cal: 0, protein: 0, carbs: 0, fat: 0 };

  const fromMeals = (Object.keys(eaten) as MealKey[]).reduce((acc, key) => {
    if (!eaten[key]) return acc;
    const m = MEAL_MACROS[key] ?? zero;
    return {
      cal: acc.cal + m.cal,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    };
  }, zero);

  const fromCustom = custom.reduce((acc, e) => {
    const m = e?.macros ?? zero;
    return {
      cal: acc.cal + (m.cal ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    };
  }, zero);

  // ✅ THIS was missing in your file
  return {
    cal: fromMeals.cal + fromCustom.cal,
    protein: fromMeals.protein + fromCustom.protein,
    carbs: fromMeals.carbs + fromCustom.carbs,
    fat: fromMeals.fat + fromCustom.fat,
  };
}