import { supabase } from '@/lib/supabaseClient';
import type { NutritionPhase } from '@/features/nutrition/nutritionData';
import type { Macros } from '@/features/nutrition/nutritionTypes';
import { meals } from '@/features/nutrition/nutritionData';
import { getLocalDateKey } from '@/hooks/useTodayDate';
import { CACHE_KEYS, assertRegisteredCacheWrite } from '@/lib/cacheRegistry';
import { getActiveUserId, scopedKey } from '@/lib/activeUser';

export const NUTRITION_CHANGED_EVENT = "nutrition:changed";

export const NUTRITION_LOG_CACHE_KEY = CACHE_KEYS.NUTRITION_LOG;
export const NUTRITION_PHASE_CACHE_KEY = CACHE_KEYS.NUTRITION_PHASE;

function logCacheKey(userId: string | null = getActiveUserId()) {
  return scopedKey(NUTRITION_LOG_CACHE_KEY, userId);
}

function phaseCacheKey(userId: string | null = getActiveUserId()) {
  return scopedKey(NUTRITION_PHASE_CACHE_KEY, userId);
}

function emit() {
  window.dispatchEvent(new Event(NUTRITION_CHANGED_EVENT));
}

function todayKey() {
  return getLocalDateKey();
}

export type MealKey =
  | "breakfast1"
  | "breakfast2"
  | "lunchWfh"
  | "lunchOffice"
  | "afternoonSnack"
  | "postWorkout"
  | "dinner";

export type CustomEntry = {
  id: string;
  name: string;
  macros: Macros;
  loggedAt: number;
};

export type SavedMeal = {
  id: string;
  name: string;
  macros: Macros;
  emoji: string;
};

export type NutritionLog = {
  date: string;
  eaten: Partial<Record<MealKey, boolean>>;
  customEntries: CustomEntry[];
};

function emptyLog(date = todayKey()): NutritionLog {
  return { date, eaten: {}, customEntries: [] };
}

function readLogCache(userId: string | null = getActiveUserId()): NutritionLog | null {
  try {
    const raw = localStorage.getItem(logCacheKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as NutritionLog;
    if (parsed.date !== todayKey()) return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeLogCache(log: NutritionLog, userId: string | null = getActiveUserId()): void {
  try {
    const key = logCacheKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, JSON.stringify(log));
  } catch {
    // ignore
  }
}

function readPhaseCache(userId: string | null = getActiveUserId()): NutritionPhase | null {
  try {
    const raw = localStorage.getItem(phaseCacheKey(userId));
    return raw === 'cut' || raw === 'maintain' ? raw : null;
  } catch {
    return null;
  }
}

function writePhaseCache(phase: NutritionPhase, userId: string | null = getActiveUserId()): void {
  try {
    const key = phaseCacheKey(userId);
    assertRegisteredCacheWrite(key);
    localStorage.setItem(key, phase);
  } catch {
    // ignore
  }
}

export function seedNutritionLog(): NutritionLog {
  return readLogCache() ?? emptyLog();
}

export async function loadPhase(): Promise<NutritionPhase> {
  const cached = readPhaseCache();
  if (cached) return cached;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "maintain";

  const { data, error } = await supabase
    .from("nutrition_phase")
    .select("phase")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("loadPhase error:", error);
    return "maintain";
  }

  if (!data) {
    await supabase
      .from("nutrition_phase")
      .insert({ user_id: user.id, phase: "maintain" });

    writePhaseCache("maintain", user.id);
    return "maintain";
  }

  const phase = (data.phase as NutritionPhase) ?? "maintain";
  writePhaseCache(phase, user.id);
  return phase;
}

export async function savePhase(phase: NutritionPhase): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    emit();
    return;
  }

  writePhaseCache(phase, user.id);

  await supabase
    .from("nutrition_phase")
    .upsert({ user_id: user.id, phase }, { onConflict: "user_id" });

  emit();
}

export async function loadNutritionLog(
  date = todayKey(),
): Promise<NutritionLog> {
  const cached = date === todayKey() ? readLogCache() : null;
  if (cached) return cached;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return cached ?? emptyLog(date);

    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("log_date, eaten, custom_entries")
      .eq("user_id", user.id)
      .eq("log_date", date)
      .maybeSingle();

    if (error) {
      console.warn("loadNutritionLog error:", error);
      return cached ?? emptyLog(date);
    }

    if (!data) {
      const created = {
        user_id: user.id,
        log_date: date,
        eaten: {},
        custom_entries: [],
      };

      const { error: insertError } = await supabase
        .from("nutrition_logs")
        .insert(created);

      if (insertError) {
        console.warn("loadNutritionLog insert error:", insertError);
      }

      const fresh = emptyLog(date);
      if (date === todayKey()) writeLogCache(fresh);
      return fresh;
    }

    const log: NutritionLog = {
      date: data.log_date,
      eaten: (data.eaten ?? {}) as NutritionLog["eaten"],
      customEntries: (data.custom_entries ?? []) as NutritionLog["customEntries"],
    };

    if (date === todayKey()) writeLogCache(log);
    return log;
  } catch (error) {
    console.warn("loadNutritionLog exception:", error);
    return cached ?? emptyLog(date);
  }
}

async function saveLog(log: NutritionLog): Promise<void> {
  if (log.date === todayKey()) writeLogCache(log);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      emit();
      return;
    }

    const { error } = await supabase.from("nutrition_logs").upsert(
      {
        user_id: user.id,
        log_date: log.date,
        eaten: log.eaten ?? {},
        custom_entries: log.customEntries ?? [],
      },
      { onConflict: "user_id,log_date" },
    );

    if (error) {
      console.warn("saveLog error:", error);
    }

    emit();
  } catch (error) {
    console.warn("saveLog exception:", error);
    emit();
  }
}

export async function toggleMeal(key: MealKey, eaten: boolean): Promise<void> {
  const log = await loadNutritionLog();
  log.eaten = log.eaten ?? {};
  log.eaten[key] = eaten;
  await saveLog(log);
}

export async function addCustomEntry(
  name: string,
  macros: Macros,
): Promise<void> {
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

export async function loadSavedMeals(): Promise<SavedMeal[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

export async function saveNewMeal(
  name: string,
  macros: Macros,
  emoji = "🍽️",
): Promise<SavedMeal> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meal: SavedMeal = {
    id: crypto.randomUUID(),
    name: name.trim(),
    macros,
    emoji,
  };

  if (user) {
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

const MEAL_MACROS: Record<MealKey, Macros> = {
  breakfast1: meals.breakfast.option1.macros,
  breakfast2: meals.breakfast.option2.macros,
  lunchWfh: meals.lunch.wfh.macros,
  lunchOffice: meals.lunch.office.macros,
  afternoonSnack: meals.afternoonSnack.macros,
  postWorkout: meals.postWorkout.macros,
  dinner: meals.dinner.macros,
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

  return {
    cal: fromMeals.cal + fromCustom.cal,
    protein: fromMeals.protein + fromCustom.protein,
    carbs: fromMeals.carbs + fromCustom.carbs,
    fat: fromMeals.fat + fromCustom.fat,
  };
}
